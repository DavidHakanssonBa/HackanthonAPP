// src/App.jsx
import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { getMealsByCategory, getMealById, getRandomMeal } from "./meal";
import MealCard from "./MealCard";
import { likeMealFull } from "./likes";
import ThisWeekPanel from "./ThisWeekPanel";
import FilterPanel from "./FilterPanel";
import BrandOverCard from "./BrandOverCard";
import LogoBitematch from "./LogoBiteMatch";
import { useNavigate } from "react-router-dom";
import { ensureAnonAuth, signOutAndStayAnonymous } from "./firebase";

import { useAuth } from "./AuthProvider"; // ⬅️ read current user



const BUFFER_SIZE = 5;

export default function App() {
  const [selected, setSelected] = useState([]);
  const [idPool, setIdPool] = useState([]);
  const [cursor, setCursor] = useState(0);
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [actionLock, setActionLock] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    ensureAnonAuth().catch((e) => setErr(String(e)));
  }, []);

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
          const batch = await fetchBatchRandom(4);
          if (!cancelled) setMeals(batch);
          return;
        }
        const lists = await Promise.all(selected.map(getMealsByCategory));
        const flat = lists.flat();
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

  async function fillBuffer() {
    if (loading) return;
    if (selected.length === 0) return;
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

  useEffect(() => {
    if (selected.length > 0) fillBuffer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idPool, cursor, selected.length]);

  function advanceDeck() {
    setMeals((prev) => prev.slice(1));
    setTimeout(async () => {
      try {
        if (selected.length === 0) {
          const m = await getRandomMeal();
          if (m) setMeals((prev) => [...prev, m]);
        } else {
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
        advanceDeck();
        await likeMealFull(top);
      }
    } catch (e) {
      console.error(e);
      setErr(String(e));
    } 
  }

  const navigate = useNavigate();

  function handleAuthClick() {
    const isAnon = !user || user.isAnonymous;
    if (isAnon) {
      navigate("/login");
    } else {
      signOutAndStayAnonymous();
    }
  }

  const isAnon = !user || user.isAnonymous; // treat "no user yet" as guest
  const display = user?.displayName || user?.email || (isAnon ? "Guest" : "");
  const initial = (display?.[0] || "U").toUpperCase();



  return (
    <div className="min-h-screen bg-gray-50">
      {/* TOP BAR */}
      <header className="sticky top-0 z-50 bg-[#FFC0CB] border-b">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <LogoBitematch />
            <nav className="hidden md:flex items-center gap-1">
              <button className="px-3 py-1.5 rounded-lg hover:bg-pink-200">Om oss</button>
              <button className="px-3 py-1.5 rounded-lg hover:bg-pink-200">Kontakt</button>
              <button className="px-3 py-1.5 rounded-lg hover:bg-pink-200">FAQ</button>
            </nav>
          </div>

          {/* Right: user + login/logout */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-2 text-sm text-gray-800">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/70 border font-semibold">
                {initial}
              </span>
              <span className="max-w-[12rem] truncate">{display}</span>
            </span>
            <button
              onClick={handleAuthClick}
              className="px-3 py-1.5 rounded-lg border hover:bg-pink-100"
            >
              {isAnon ? "Log in" : "Log out"}
            </button>
          </div>
        </div>
      </header>


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

              <BrandOverCard />

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
            <ThisWeekPanel className="h-[640px] w-full" />
          </div>
        </div>
      </main>
    </div>
  );
}
