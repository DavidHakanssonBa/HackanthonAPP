// App.jsx
import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { getRandomMeal } from './meal';
import MealCard from './MealCard';
import { ensureAnonAuth } from './firebase';
import { likeMealFull } from './likes';
import ThisWeekPanel from "./ThisWeekPanel";


export default function App() {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  async function fetchBatch(n = 4) {
    const batch = await Promise.all(Array.from({ length: n }, () => getRandomMeal()));
    return batch.filter(Boolean);
  }

  async function loadInitial() {
    try {
      setErr('');
      setLoading(true);
      const batch = await fetchBatch(4); // 3–4 kort i stacken
      setMeals(batch);
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove() {
    // ta bort toppkortet så #2 promotas mjukt
    setMeals(prev => prev.slice(1));

    // hämta nytt kort lite efter (minskar blink)
    setTimeout(async () => {
      try {
        const newMeal = await getRandomMeal();
        if (newMeal) setMeals(prev => [...prev, newMeal]);
      } catch (e) {
        console.error('Failed to fetch replacement meal', e);
      }
    }, 200);
  }

  useEffect(() => { loadInitial(); }, []);

  if (loading) {
    return <div className="min-h-screen grid place-items-center text-gray-600">Laddar...</div>;
  }

  if (err || meals.length === 0) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="p-6 rounded-xl border bg-white shadow max-w-md w-full text-center">
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md h-[640px]">
        <AnimatePresence>
          {meals.map((meal, i) => (
            <MealCard
              key={meal.idMeal ?? `${i}-${meal.strMeal}`}  
              meal={meal}
              index={i}
              isTop={i === 0}
              onDislike={handleRemove}
              onLike={handleRemove}
            />
          ))}
        </AnimatePresence>
        
      </div>
    </div>
  );
}
