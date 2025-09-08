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
  const [items, setItems] = useState(null);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const colRef = collection(db, "users", uid, "thisWeek");
    const q5 = query(colRef, orderBy("likedAt", "desc"), limit(20));

    const unsub = onSnapshot(q5, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setItems(data);
    });

    return () => unsub();
  }, []);

  return (
    <aside className="w-full flex-1 flex flex-col">
      <div className="flex-1 flex flex-col rounded-2xl bg-white shadow-xl border overflow-hidden">
        <header className="px-5 py-4 border-b bg-gray-50 shrink-0">
          <h3 className="text-lg font-semibold">Veckans matplan</h3>
          <p className="text-xs text-gray-500">Senaste gillade rätter</p>
        </header>

        <div className="p-3 flex-1 overflow-y-auto">
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
                    className="flex items-center gap-3 p-2 rounded-xl border bg-white shadow-sm"
                    title={meal?.strMeal}
                  >
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
  );
}
