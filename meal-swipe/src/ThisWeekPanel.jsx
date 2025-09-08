// src/ThisWeekPanel.jsx
import { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
} from "firebase/firestore";

export default function ThisWeekPanel() {
  const [items, setItems] = useState(null); // null = loading, [] = empty

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return; // ensureAnonAuth runs before this component mounts

    const colRef = collection(db, "users", uid, "thisWeek");
    const q5 = query(colRef, orderBy("likedAt", "desc"), limit(5));

    const unsub = onSnapshot(q5, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setItems(data);
    });

    return () => unsub();
  }, []);

  return (
    <aside className="w-full">
      <div className="rounded-2xl bg-white shadow-xl border overflow-hidden">
        <header className="px-5 py-4 border-b bg-gray-50">
          <h3 className="text-lg font-semibold">Veckans matplan</h3>
          <p className="text-xs text-gray-500">Senaste 5 gillade rätter</p>
        </header>

        {/* Content */}
        <div className="p-4">
          {/* Loading skeleton */}
          {items === null && (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl bg-gray-200 animate-pulse aspect-[4/3]"
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {items?.length === 0 && (
            <div className="text-center text-sm text-gray-600 py-8">
              Du har inga gillade rätter ännu. Gilla något för att bygga veckan!
            </div>
          )}

          {/* Grid of cards */}
          {items && items.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {items.map(({ id, meal }) => (
                <article
                  key={id}
                  className="rounded-xl border overflow-hidden bg-white shadow"
                  title={meal?.strMeal}
                >
                  <div className="aspect-[4/3] bg-gray-100">
                    <img
                      src={meal?.strMealThumb}
                      alt={meal?.strMeal || "Meal"}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-3">
                    <h4 className="text-sm font-semibold line-clamp-2">
                      {meal?.strMeal ?? "–"}
                    </h4>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {(meal?.strArea || "") +
                        (meal?.strArea && meal?.strCategory ? " · " : "") +
                        (meal?.strCategory || "")}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
