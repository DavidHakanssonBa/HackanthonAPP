// src/MealDetailsModal.jsx
import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { parseIngredients } from "./meal";

export default function MealDetailsModal({ open, onClose, meal }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const ingredients = useMemo(() => (meal ? parseIngredients(meal) : []), [meal]);
  const area = meal?.strArea || "";
  const category = meal?.strCategory || "";
  const tags = (meal?.strTags || "").split(",").map(t => t.trim()).filter(Boolean);
  const bg = meal?.strMealThumb;

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[1000] bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          aria-hidden
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            className="absolute inset-x-4 top-6 bottom-6 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[760px] max-h-[85vh] overflow-y-auto"
            initial={{ y: 20, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 12, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute right-3 top-3 z-10 inline-flex items-center justify-center h-9 w-9 rounded-full bg-white/90 border shadow hover:bg-white"
              aria-label="Close"
              title="Close"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            {/* Card with blurred background image */}
            <div className="relative rounded-2xl overflow-hidden bg-white shadow-xl border">
              {/* Background image layer */}
              {bg ? (
                <>
                  <img
                    src={bg}
                    alt=""
                    aria-hidden
                    className="absolute inset-0 w-full h-full object-cover blur-sm opacity-40 scale-[1.05]"
                  />
                  {/* Soft overlay to keep text readable */}
                  <div className="absolute inset-0 bg-white/40" />
                </>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100" />
              )}

              {/* Foreground content */}
              <div className="relative">
                <div className="p-5 border-b bg-white/70 backdrop-blur-sm flex items-center justify-between">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold truncate">{meal?.strMeal}</h3>
                    <p className="text-xs text-gray-700 truncate">
                      {area}{area && category ? " · " : ""}{category}
                    </p>
                  </div>
                </div>

                <div className="p-5 flex-1 overflow-y-auto">
                  {/* Tags */}
                  {tags.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {tags.map((t, i) => (
                        <span key={i} className="text-xs bg-white/70 backdrop-blur-sm border rounded-full px-2 py-1">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Ingredients */}
                  <h4 className="text-base font-semibold mb-2">Ingredients</h4>
                  <ul className="space-y-1 mb-5">
                    {ingredients.map((it, i) => (
                      <li key={i} className="text-sm text-gray-900">
                        <span className="font-medium">{it.ingredient}</span>
                        {it.measure && <span className="text-gray-700"> — {it.measure}</span>}
                      </li>
                    ))}
                  </ul>

                  {/* Instructions */}
                  {meal?.strInstructions && (
                    <>
                      <h4 className="text-base font-semibold mb-2">Instructions</h4>
                      <p className="whitespace-pre-line leading-relaxed text-gray-900 text-sm">
                        {meal.strInstructions}
                      </p>
                    </>
                  )}

                  {/* Links */}
                  {(meal?.strSource || meal?.strYoutube) && (
                    <div className="mt-5 flex flex-wrap gap-3">
                      {meal.strSource && (
                        <a
                          href={meal.strSource}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm underline text-gray-800 bg-white/60 backdrop-blur-sm rounded px-1.5 py-0.5"
                        >
                          Source
                        </a>
                      )}
                      {meal.strYoutube && (
                        <a
                          href={meal.strYoutube}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm underline text-gray-800 bg-white/60 backdrop-blur-sm rounded px-1.5 py-0.5"
                        >
                          YouTube-video
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
