import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { parseIngredients } from "./meal";

export default function MealCard({ meal, onDislike, onLike, isTop = false, index = 0 }) {
  const [swipe, setSwipe] = useState(null);      // "left" | "right" | null
  const [flipped, setFlipped] = useState(false); // true = visa baksidan
  const ingredients = useMemo(() => parseIngredients(meal), [meal]);

  function handleSwipe(dir, cb) {
    if (!isTop) return;
    setSwipe(dir);
    setTimeout(() => {
      cb?.();
      setSwipe(null);
      setFlipped(false);
    }, 450);
  }

  // stack-look
  const scale = 1 - Math.min(index * 0.03, 0.12);
  const yOffset = index * 12;

  // swipe-anim (ligger på motion.div; INGEN perspective här)
  const x = swipe === "left" ? -520 : swipe === "right" ? 520 : 0;
  const rotate = swipe === "left" ? -18 : swipe === "right" ? 18 : 0;

  const area = meal?.strArea || "";
  const category = meal?.strCategory || "";
  const tags = (meal?.strTags || "").split(",").map(t => t.trim()).filter(Boolean);

  // --- 3D FLIP: rotera SIDORNA individuellt (inte containern) ---
  const faceBase = {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
    overflow: "hidden",
    borderRadius: "1rem",
    background: "white",
    transformStyle: "preserve-3d",
    WebkitTransformStyle: "preserve-3d",
    transition: "transform 600ms",
    willChange: "transform",
  };

  // Front: 0deg → 180deg
  const frontStyle = {
    ...faceBase,
    transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
  };

  // Back: -180deg → 0deg (aldrig spegelvänd)
  const backStyle = {
    ...faceBase,
    transform: flipped ? "rotateY(0deg)" : "rotateY(-180deg)",
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale, y: yOffset }}
      animate={{ opacity: swipe ? 0 : 1, x, rotate, scale, y: yOffset }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45 }}
      style={{
        position: "absolute",
        margin: "0 auto",
        zIndex: 100 - index,
        pointerEvents: isTop ? "auto" : "none",
      }}
      className="w-full max-w-md"
    >
      {/* STATISK wrapper med endast perspective */}
      <div className="scene w-full h-full">
        <div
          className="relative shadow-xl bg-white overflow-hidden rounded-2xl"
          style={{ minHeight: 560 }}
        >
          {/* -------- FRONT -------- */}
          <article style={frontStyle}>
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
                {area}{area && category ? " · " : ""}{category}
              </p>

              {isTop ? (
                <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                  <button
                    onClick={() => handleSwipe("left", onDislike)}
                    className="flex-1 py-3 rounded-xl border border-red-500 text-red-600 font-semibold hover:bg-red-50 active:scale-[0.98] transition"
                    aria-label="Dislike"
                    title="Passa (hämta ny)"
                  >
                    ❌ Pass
                  </button>

                  <button
                    onClick={() => setFlipped(f => !f)}
                    className="px-4 py-3 rounded-xl border font-medium hover:bg-gray-50 active:scale-[0.98] transition"
                    aria-label="Visa detaljer"
                    title="Visa ingredienser & instruktioner"
                  >
                    Details
                  </button>

                  <button
                    onClick={() => handleSwipe("right", onLike)}
                    className="flex-1 py-3 rounded-xl bg-green-600 text-white font-semibold hover:brightness-110 active:scale-[0.98] transition"
                    aria-label="Like"
                    title="Gilla"
                  >
                    ❤️ Like
                  </button>
                </div>
              ) : (
                <div className="mt-auto h-[56px]" />
              )}
            </div>
          </article>

          {/* -------- BACK -------- */}
          <article style={backStyle}>
            <div className="p-5 border-b bg-gray-50 flex items-center justify-between">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold truncate">{meal.strMeal}</h3>
                <p className="text-xs text-gray-500 truncate">
                  {area}{area && category ? " · " : ""}{category}
                </p>
              </div>
              <button
                onClick={() => setFlipped(false)}
                className="px-3 py-1.5 rounded-lg border hover:bg-white active:scale-[0.98] transition"
                aria-label="Stäng detaljer"
              >
                To front
              </button>
            </div>

            {/* Scrollbart innehåll */}
            <div className="p-5 flex-1 overflow-y-auto">
              {/* Tags */}
              {(meal?.strTags || "").split(",").map(t=>t.trim()).filter(Boolean).length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {(meal?.strTags || "").split(",").map(t=>t.trim()).filter(Boolean).map((t, i) => (
                    <span key={i} className="text-xs bg-gray-100 border rounded-full px-2 py-1">
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {/* Ingredienser */}
              <h4 className="text-base font-semibold mb-2">Ingredienser</h4>
              <ul className="space-y-1 mb-5">
                {ingredients.map((it, i) => (
                  <li key={i} className="text-sm text-gray-800">
                    <span className="font-medium">{it.ingredient}</span>
                    {it.measure && <span className="text-gray-600"> — {it.measure}</span>}
                  </li>
                ))}
              </ul>

              {/* Instruktioner */}
              {meal.strInstructions && (
                <>
                  <h4 className="text-base font-semibold mb-2">Instruktioner</h4>
                  <p className="whitespace-pre-line leading-relaxed text-gray-800 text-sm">
                    {meal.strInstructions}
                  </p>
                </>
              )}

              {/* Länkar */}
              {(meal.strSource || meal.strYoutube) && (
                <div className="mt-5 flex flex-wrap gap-3">
                  {meal.strSource && (
                    <a href={meal.strSource} target="_blank" rel="noreferrer" className="text-sm underline text-gray-700">
                      Source
                    </a>
                  )}
                  {meal.strYoutube && (
                    <a href={meal.strYoutube} target="_blank" rel="noreferrer" className="text-sm underline text-gray-700">
                      YouTube-video
                    </a>
                  )}
                </div>
              )}

              {isTop && (
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => handleSwipe("left", onDislike)}
                    className="flex-1 py-2 rounded-xl border border-red-500 text-red-600 font-semibold hover:bg-red-50 active:scale-[0.98] transition"
                  >
                    ❌ Pass
                  </button>
                  <button
                    onClick={() => handleSwipe("right", onLike)}
                    className="flex-1 py-2 rounded-xl bg-green-600 text-white font-semibold hover:brightness-110 active:scale-[0.98] transition"
                  >
                    ❤️ Like
                  </button>
                </div>
              )}
            </div>
          </article>
        </div>
      </div>
    </motion.div>
  );
}
