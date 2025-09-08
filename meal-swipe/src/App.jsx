import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { getRandomMeal } from './meal';
import MealCard from './MealCard';
import { ensureAnonAuth } from './firebase';
import { likeMealFull } from './likes';
import ThisWeekPanel from "./ThisWeekPanel";
import FilterPanel from "./FilterPanel";

export default function App() {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [actionLock, setActionLock] = useState(false);

  async function fetchBatch(n = 4) {
    const batch = await Promise.all(Array.from({ length: n }, () => getRandomMeal()));
    return batch.filter(Boolean);
  }

  async function loadInitial() {
    try {
      setErr('');
      setLoading(true);
      const batch = await fetchBatch(4);
      setMeals(batch);
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }

  function advanceDeck() {
    setMeals(prev => prev.slice(1));
    setTimeout(async () => {
      try {
        const newMeal = await getRandomMeal();
        if (newMeal) setMeals(prev => [...prev, newMeal]);
      } catch (e) {
        console.error('Failed to fetch replacement meal', e);
      } finally {
        setActionLock(false);
      }
    }, 200);
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

  useEffect(() => {
    ensureAnonAuth()
      .then(loadInitial)
      .catch(e => setErr(String(e)));
  }, []);

  if (loading) {
    return <div className="min-h-screen grid place-items-center text-gray-600">Laddar...</div>;
  }

  if (err || meals.length === 0) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="p-6 rounded-2xl border bg-white shadow max-w-md w-full text-center">
          <p className="mb-4 font-semibold">Kunde inte hämta recept 😕</p>
          <button onClick={loadInitial} className="px-4 py-2 rounded-lg bg-gray-900 text-white">
            Försök igen
          </button>
          {err && <p className="mt-3 text-xs text-gray-500">{err}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-6xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch min-h-[640px]">
          {/* Vänster panel */}
          <div className="order-3 lg:order-1 lg:col-span-3 flex">
            <div className="flex-1 flex flex-col">
              <FilterPanel />
            </div>
          </div>

          {/* Kortstack i mitten */}
          <div className="order-1 lg:order-2 lg:col-span-6 flex items-center justify-center">
            <div className="relative w-full max-w-md h-[640px]">
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
            </div>
          </div>

          {/* Höger panel */}
          <div className="order-2 lg:order-3 lg:col-span-3 flex">
            <div className="flex-1 flex flex-col">
              <ThisWeekPanel />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
