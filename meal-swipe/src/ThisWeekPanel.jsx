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

export default function ThisWeekPanel({ className = "" }) {
  const [items, setItems] = useState(null);
  const [open, setOpen] = useState(false); // ⬅️ modal state
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

  return (
    <>
      <aside className={`flex flex-col ${className}`}>
        <div className="flex-1 flex flex-col rounded-2xl bg-white shadow-xl border overflow-hidden">
          <header className="px-5 py-4 border-b bg-gray-50 shrink-0 flex items-center gap-3">
            <div className="flex-1">
              <h3 className="text-lg font-semibold">Veckans matplan</h3>
              <p className="text-xs text-gray-500">Senaste gillade rätter</p>
            </div>
            <button
              onClick={() => setOpen(true)}
              className="text-xs font-medium text-indigo-600 hover:underline whitespace-nowrap"
              title="Visa inköpslistan"
            >
              Visa inköpslista
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-3">
            {items === null && (
              <ul className="space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 p-2 rounded-xl bg-gray-100 animate-pulse"
                  >
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
                Du har inga gillade rätter ännu.
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
                      <button
                        onClick={() => handleRemove(id)}
                        className="absolute top-2 right-2 bg-white/90 hover:bg-red-100 text-red-600 text-xs px-2 py-1 rounded"
                      >
                        ✕
                      </button>

                      <div className="w-16 h-12 bg-gray-100 overflow-hidden rounded-md shrink-0">
                        <img
                          src={thumb}
                          alt={meal?.strMeal || "Meal"}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>

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

      {/* Modal overlay */}
      <ShoppingListModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
