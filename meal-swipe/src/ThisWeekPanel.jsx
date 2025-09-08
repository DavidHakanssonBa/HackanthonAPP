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

export default function ThisWeekPanel() {
  const [items, setItems] = useState(null); // null = loading, [] = empty
  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) return;

    const colRef = collection(db, "users", uid, "thisWeek");
    const q5 = query(colRef, orderBy("likedAt", "desc"), limit(5));

    const unsub = onSnapshot(q5, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setItems(data);
    });

    return () => unsub();
  }, [uid]);

  // 🔥 delete function
  const handleRemove = async (id) => {
    if (!uid) return;
    const ref = doc(db, "users", uid, "thisWeek", id);
    await deleteDoc(ref);
    // no need to call setItems manually, onSnapshot updates automatically
  };

  return (
    <aside className="w-full">
      <div className="rounded-2xl bg-white shadow-xl border overflow-hidden">
        <header className="px-5 py-4 border-b bg-gray-50">
          <h3 className="text-lg font-semibold">Veckans matplan</h3>
          <p className="text-xs text-gray-500">Senaste 5 gillade rätter</p>
        </header>

        <div className="p-4">
          {/* Loading skeleton */}
          {items === null && (
            <div className="grid grid-cols-1 gap-3">
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

          {/* List of cards */}
          {items && items.length > 0 && (
            <div className="grid grid-cols-1 gap-3">
              {items.map(({ id, meal }) => {
                const thumb =
                  meal?.strMealThumb ? `${meal.strMealThumb}/small` : undefined;
                return (
                  <article
                    key={id}
                    className="rounded-xl border overflow-hidden bg-white shadow relative"
                    title={meal?.strMeal}
                  >
                    {/* delete button in corner */}
                    <button
                      onClick={() => handleRemove(id)}
                      className="absolute top-2 right-2 bg-white/80 hover:bg-red-100 text-red-600 text-xs px-2 py-1 rounded"
                    >
                      ✕
                    </button>

                    <div className="aspect-[4/3] bg-gray-100">
                      <img
                        src={thumb}
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
                );
              })}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
