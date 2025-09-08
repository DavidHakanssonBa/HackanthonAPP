
// src/App.jsx
import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { getMealsByCategory, getMealById, getRandomMeal } from "./meal";
import MealCard from "./MealCard";
import { ensureAnonAuth } from "./firebase";
import { likeMealFull } from "./likes";
import ThisWeekPanel from "./ThisWeekPanel";
import FilterPanel from "./FilterPanel";

const BUFFER_SIZE = 5; // antal detaljerade rätter vi håller redo i filter-läge

export default function App() {
  const [selected, setSelected] = useState([]); // valda kategorier
  const [idPool, setIdPool] = useState([]);     // filter-läge: id:n som matchar
  const [cursor, setCursor] = useState(0);      // index i idPool
  const [meals, setMeals] = useState([]);       // kortstacken (båda lägen)
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [actionLock, setActionLock] = useState(false);

  useEffect(() => {
    ensureAnonAuth().catch((e) => setErr(String(e)));
  }, []);

  // Helpers
  const uniqueBy = (arr, keyFn) =>
    Array.from(new Map(arr.map((x) => [keyFn(x), x])).values());

  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  async function fetchBatchRandom(n = 4) {
    const batch = await Promise.all(Array.from({ length: n }, () => getRandomMeal()));
    return batch.filter(Boolean);
  }

  // När filter ändras:
  // - Om inga kategorier: ladda random stack
  // - Annars: bygg ny idPool (filter.php), resetta buffer
  useEffect(() => {
    let cancelled = false;

    async function run() {
      setErr("");
      setMeals([]);
      setIdPool([]);
      setCursor(0);

      setLoading(true);
      try {
        if (selected.length === 0) {
          // RANDOM-LÄGE
          const batch = await fetchBatchRandom(4);
          if (!cancelled) setMeals(batch);
          return;
        }

        // FILTER-LÄGE
        const lists = await Promise.all(selected.map(getMealsByCategory));
        const flat = lists.flat(); // { idMeal, strMeal, strMealThumb }[]
        const deduped = uniqueBy(flat, (m) => m.idMeal);
        const shuffled = shuffle(deduped);
        if (!cancelled) {
          setIdPool(shuffled.map((m) => m.idMeal));
          setCursor(0);
        }
      } catch (e) {
        if (!cancelled) {
          console.error(e);
          setErr(e.message || "Något gick fel");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [selected]);

  // Fyll på bufferten (bara meningsfullt i filter-läge)
  async function fillBuffer() {
    if (loading) return;
    if (selected.length === 0) return; // random-läge använder inte buffer
    if (meals.length >= BUFFER_SIZE) return;
    if (cursor >= idPool.length) return;

    setLoading(true);
    try {
      const need = Math.min(BUFFER_SIZE - meals.length, idPool.length - cursor);
      const nextIds = idPool.slice(cursor, cursor + need);
      const detailed = (await Promise.all(nextIds.map(getMealById))).filter(Boolean);
      setMeals((prev) => [...prev, ...detailed]);
      setCursor((c) => c + need);
    } catch (e) {
      console.error(e);
      setErr(e.message || "Kunde inte fylla buffert");
    } finally {
      setLoading(false);
    }
  }

  // Fyll bufferten när pool/cursor ändras
  useEffect(() => {
    if (selected.length > 0) fillBuffer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idPool, cursor, selected.length]);

  // Flytta kortstacken framåt + fyll på enligt läge
  function advanceDeck() {
    setMeals((prev) => prev.slice(1));
    setTimeout(async () => {
      try {
        if (selected.length === 0) {
          // RANDOM-LÄGE: hämta en ny random och append
          const m = await getRandomMeal();
          if (m) setMeals((prev) => [...prev, m]);
        } else {
          // FILTER-LÄGE: fyll bufferten om det finns fler id:n
          await fillBuffer();
        }
      } catch (e) {
        console.error(e);
        setErr(String(e));
      } finally {
        setActionLock(false);
      }
    }, 150);
  }

  async function handlePass() {
    if (actionLock) return;
    setActionLock(true);
    advanceDeck();
  }

  async function handleLike() {
    if (actionLock) return;
    setActionLock(true);
    const top = meals[0];
    try {
      if (top) {
        await likeMealFull(top);
      }
    } catch (e) {
      console.error(e);
      setErr(String(e));
    } finally {
      advanceDeck();
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-6xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch min-h-[640px]">
          {/* Vänster: Filter */}
          <div className="order-3 lg:order-1 lg:col-span-3 flex">
            <div className="flex-1 flex flex-col">
              <FilterPanel onApply={setSelected} />
            </div>
          </div>

          {/* Mitten: Kortstack */}
          <div className="order-1 lg:order-2 lg:col-span-6 flex items-center justify-center">
            <div className="relative w-full max-w-md h-[640px]">
              {err && (
                <div className="absolute inset-x-0 top-2 mx-auto max-w-sm p-3 rounded-lg bg-red-50 text-red-700 text-sm border">
                  {err}
                </div>
              )}

              <AnimatePresence>
                {meals.map((meal, i) => (
                  <MealCard
                    key={meal.idMeal ?? `${i}-${meal.strMeal}`}
                    meal={meal}
                    index={i}
                    isTop={i === 0}
                    onDislike={handlePass}
                    onLike={handleLike}
                  />
                ))}
              </AnimatePresence>

              {loading && (
                <div className="absolute inset-x-0 bottom-2 mx-auto w-max text-gray-500 text-sm">
                  Laddar…
                </div>
              )}
              {!loading && meals.length === 0 && (
                <div className="absolute inset-0 grid place-items-center text-gray-600">
                  {selected.length === 0
                    ? "Kunde inte ladda slumpade rätter. Försök igen."
                    : "Inga fler resultat. Prova andra kategorier."}
                </div>
              )}
            </div>
          </div>

          {/* Höger: Veckans matplan */}
          <div className="order-2 lg:order-3 lg:col-span-3 flex">
            <div className="order-2 lg:order-3 lg:col-span-3 flex">
              <ThisWeekPanel className="h-[640px] w-full" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
