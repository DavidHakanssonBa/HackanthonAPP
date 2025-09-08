import { useEffect, useState } from 'react';
import { getRandomMeal, parseIngredients } from './meal';

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

  useEffect(() => { load(); }, []);

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

  const ingredients = parseIngredients(meal);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-bold text-xl">MealSwipe MVP</h1>
          <button onClick={load} className="px-3 py-1.5 rounded-lg border hover:bg-gray-100">
            Ny slumpad rätt
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4">
        <article className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="aspect-[16/9] w-full bg-gray-200">
            <img
              src={meal.strMealThumb}
              alt={meal.strMeal}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          <div className="p-5 md:p-6">
            <h2 className="text-2xl md:text-3xl font-bold">{meal.strMeal}</h2>
            <p className="mt-1 text-sm text-gray-500">
              {meal.strArea ? `${meal.strArea}` : ''}{meal.strCategory ? ` · ${meal.strCategory}` : ''}
            </p>

            <h3 className="mt-6 mb-2 text-lg font-semibold">Ingredienser</h3>
            <ul className="space-y-1">
              {ingredients.map((it, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-gray-400"></span>
                  <span className="text-gray-800">
                    <span className="font-medium">{it.ingredient}</span>
                    {it.measure && <span className="text-gray-600"> — {it.measure}</span>}
                  </span>
                </li>
              ))}
            </ul>

            {/* Valfritt: instruktioner i en kollapsbar sektion */}
            {meal.strInstructions && (
              <>
                <h3 className="mt-6 mb-2 text-lg font-semibold">Instruktioner</h3>
                <p className="whitespace-pre-line leading-relaxed text-gray-800">
                  {meal.strInstructions}
                </p>
              </>
            )}

            {/* Valfritt: YouTube-länk */}
            {meal.strYoutube && (
              <a
                className="inline-block mt-6 px-4 py-2 rounded-lg bg-red-600 text-white"
                href={meal.strYoutube}
                target="_blank"
                rel="noreferrer"
              >
                Visa på YouTube
              </a>
            )}
          </div>
        </article>
      </main>
    </div>
  );
}
