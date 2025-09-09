// src/ThisWeekPanel.jsx
import { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  deleteDoc,
  doc,
} from "firebase/firestore";
import ShoppingListModal from "./ShoppingListModal";
import MealDetailsModal from "./MealDetailsModal"; // ⬅️ NEW
import CookModeModal from "./CookModeModal";


export default function ThisWeekPanel({ className = "" }) {
  const [items, setItems] = useState(null);
  const [open, setOpen] = useState(false);
  const [detailsMeal, setDetailsMeal] = useState(null); // ⬅️ NEW
  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) return;

    const colRef = collection(db, "users", uid, "thisWeek");
    const q5 = query(colRef, orderBy("likedAt", "desc"), limit(20));

    const unsub = onSnapshot(q5, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setItems(data);
    });

    return () => unsub();
  }, [uid]);

  const handleRemove = async (id) => {
    if (!uid) return;
    const ref = doc(db, "users", uid, "thisWeek", id);
    await deleteDoc(ref);
  };

  const likedCount = items?.length ?? 0;

  return (
    <>
      <aside className={`flex flex-col ${className}`}>
        <div className="flex-1 flex flex-col rounded-2xl bg-white shadow-xl border overflow-hidden">
          {/* Header */}
          <header className="px-5 py-4 border-b bg-gray-50 shrink-0 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Weekly meal plan</h3>
              <p className="text-xs text-gray-500">Recently liked dishes</p>
            </div>

            <div className="flex items-center gap-4">
              {/* Hjärt-ikon + badge */}
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20" className="w-6 h-6 text-red-500">
                  <path
                    fillRule="evenodd"
                    d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 18.657l-6.828-6.829a4 4 0 010-5.656z"
                    clipRule="evenodd"
                  />
                </svg>
                {likedCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full">
                    {likedCount}
                  </span>
                )}
              </div>

              {/* Visa inköpslista-knapp */}
              <button
                onClick={() => setOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium shadow hover:bg-indigo-700 transition"
                title="Visa inköpslistan"
              >
                Show shopping list
              </button>
            </div>
          </header>

          {/* Scrollbart innehåll */}
          <div className="flex-1 overflow-y-auto p-3">
            {items === null && (
              <ul className="space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <li key={i} className="flex items-center gap-3 p-2 rounded-xl bg-gray-100 animate-pulse">
                    <div className="w-16 h-12 rounded-md bg-gray-200" />
                    <div className="flex-1 space-y-1">
                      <div className="h-3 w-2/3 bg-gray-200 rounded" />
                      <div className="h-3 w-1/3 bg-gray-200 rounded" />
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {items?.length === 0 && (
              <div className="text-center text-sm text-gray-600 py-8">
                You do not have any saved dishes yet.
              </div>
            )}

            {items && items.length > 0 && (
              <ul className="space-y-2">
                {items.map(({ id, meal }) => {
                  const thumb = meal?.strMealThumb;
                  return (
                    <li
                      key={id}
                      className="flex items-center gap-3 p-2 rounded-xl border bg-white shadow-sm relative"
                    >
                      {/* Remove */}
                      <button
                        onClick={() => handleRemove(id)}
                        className="absolute top-2 right-2 bg-white/90 hover:bg-red-100 text-red-600 text-xs px-2 py-1 rounded"
                        title="Ta bort från veckan"
                      >
                        ✕
                      </button>

                      {/* ⬇️ CLICKABLE THUMBNAIL -> opens details modal */}
                      <button
                        type="button"
                        onClick={() => setDetailsMeal(meal)}
                        className="w-16 h-12 bg-gray-100 overflow-hidden rounded-md shrink-0 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        title="Visa detaljer"
                      >
                        <img
                          src={thumb}
                          alt={meal?.strMeal || "Meal"}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </button>

                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-semibold leading-snug line-clamp-1">
                          {meal?.strMeal ?? "–"}
                        </h4>
                        <p className="text-[11px] text-gray-600 leading-tight line-clamp-1">
                          {(meal?.strArea || "") +
                            (meal?.strArea && meal?.strCategory ? " · " : "") +
                            (meal?.strCategory || "")}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </aside>

      {/* Modals */}
      
      <ShoppingListModal open={open} onClose={() => setOpen(false)} />
      <MealDetailsModal
        open={!!detailsMeal}
        onClose={() => setDetailsMeal(null)}
        meal={detailsMeal}
      />
    </>
  );
}
