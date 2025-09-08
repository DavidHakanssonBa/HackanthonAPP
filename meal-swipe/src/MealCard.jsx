import { useState } from "react";
import { parseIngredients } from "./meal";

export default function MealCard({ meal, onDislike, onLike }) {
  const [flipped, setFlipped] = useState(false);
  const ingredients = parseIngredients(meal);

  return (
    <div className="scene mx-auto w-full max-w-md">
      <div
        className={
          "flip-card relative w-full rounded-2xl shadow-xl bg-white " +
          (flipped ? "is-flipped" : "")
        }
        style={{ minHeight: 520 }}
      >
        {/* Front */}
        <article className="flip-face absolute inset-0 rounded-2xl overflow-hidden flex flex-col">
          <div className="aspect-[4/3] w-full bg-gray-200">
            <img
              src={meal.strMealThumb}
              alt={meal.strMeal}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          <div className="p-5 flex-1 flex flex-col">
            <h2 className="text-2xl font-bold">{meal.strMeal}</h2>
            <p className="mt-1 text-sm text-gray-500">
              {meal.strArea ? meal.strArea : ""}
              {meal.strArea && meal.strCategory ? " · " : ""}
              {meal.strCategory ? meal.strCategory : ""}
            </p>

            <div className="mt-auto flex items-center justify-between gap-3 pt-4">
              {/* Dislike (X) */}
              <button
                onClick={onDislike}
                className="flex-1 py-3 rounded-xl border border-red-500 text-red-600 font-semibold hover:bg-red-50 active:scale-[0.98] transition"
                aria-label="Dislike"
                title="Passa (hämta ny)"
              >
                {/* Red Cross SVG */}
                <span className="inline-flex items-center justify-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Pass
                </span>
              </button>

              {/* Flip */}
              <button
                onClick={() => setFlipped((f) => !f)}
                className="px-4 py-3 rounded-xl border font-medium hover:bg-gray-50 active:scale-[0.98] transition"
                aria-label="Visa detaljer"
                title="Visa ingredienser & instruktioner"
              >
                Visa detaljer
              </button>

              {/* Like (❤️) */}
              <button
                onClick={onLike}
                className="flex-1 py-3 rounded-xl bg-green-600 text-white font-semibold hover:brightness-110 active:scale-[0.98] transition"
                aria-label="Like"
                title="Gilla"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M12 21s-6.716-4.297-9.428-7.01C.86 12.278.5 10.64.5 9.5 .5 7.015 2.515 5 5 5c1.657 0 3.156.896 4 2.236C9.844 5.896 11.343 5 13 5c2.485 0 4.5 2.015 4.5 4.5 0 1.14-.36 2.778-2.072 4.49C18.716 16.703 12 21 12 21z"/>
                  </svg>
                  Gilla
                </span>
              </button>
            </div>
          </div>
        </article>

        {/* Back */}
        <article className="flip-face flip-back absolute inset-0 rounded-2xl overflow-hidden bg-white">
          <div className="h-full flex flex-col">
            <div className="p-5 border-b bg-gray-50 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Detaljer</h3>
              <button
                onClick={() => setFlipped(false)}
                className="px-3 py-1.5 rounded-lg border hover:bg-white"
                aria-label="Stäng detaljer"
              >
                Stäng
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto">
              <h4 className="text-base font-semibold mb-2">Ingredienser</h4>
              <ul className="space-y-1 mb-5">
                {ingredients.map((it, i) => (
                  <li key={i} className="text-sm text-gray-800">
                    <span className="font-medium">{it.ingredient}</span>
                    {it.measure && <span className="text-gray-600"> — {it.measure}</span>}
                  </li>
                ))}
              </ul>

              {meal.strInstructions && (
                <>
                  <h4 className="text-base font-semibold mb-2">Instruktioner</h4>
                  <p className="whitespace-pre-line leading-relaxed text-gray-800 text-sm">
                    {meal.strInstructions}
                  </p>
                </>
              )}
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
