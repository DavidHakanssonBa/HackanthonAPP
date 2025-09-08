// App.jsx
import { useEffect, useState } from 'react';
import { getRandomMeal } from './meal';
import MealCard from './MealCard';
import { ensureAnonAuth } from './firebase';
import { likeMealFull } from './likes';
import ThisWeekPanel from "./ThisWeekPanel";


export default function App() {
  const [meal, setMeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  async function load() {
    try {
      setErr('');
      setLoading(true);
      const m = await getRandomMeal();
      setMeal(m);
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // se till att vi har en anonym användare, sen ladda första receptet
    ensureAnonAuth().then(load).catch(e => setErr(String(e)));
  }, []);

  async function handleLike() {
    try {
      if (meal) await likeMealFull(meal);
    } catch (e) {
      console.error(e);
      setErr(String(e));
    } finally {
      // ladda nästa kort oavsett (kan justera enligt UX)
      load();
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-gray-600">
        Laddar slumpad rätt…
      </div>
    );
  }

  if (err || !meal) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="p-6 rounded-xl border bg-white shadow max-w-md w-full text-center">
          <p className="mb-4 font-semibold">Kunde inte hämta recept 😕</p>
          <button onClick={load} className="px-4 py-2 rounded-lg bg-gray-900 text-white">
            Försök igen
          </button>
          {err && <p className="mt-3 text-xs text-gray-500">{err}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-3xl mx-auto p-4">
        <MealCard
          meal={meal}
          onDislike={load}
          onLike={handleLike}
        />
        <ThisWeekPanel />

      </main>
    </div>
  );
}
