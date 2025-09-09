// src/ShoppingList.jsx
import { useEffect, useMemo, useState } from "react";
import { auth, db } from "./firebase";
import { parseIngredients } from "./meal";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { getFunctions, httpsCallable, connectFunctionsEmulator } from "firebase/functions";

const functions = getFunctions(undefined, "europe-west1");
connectFunctionsEmulator(functions, "localhost", 5001); // bara lokalt test

export async function sendCustomSms(to, message) {
  const fn = httpsCallable(functions, "sendSms");
  return (await fn({ to, body: message })).data;
}

// ⬇️ Ny prop: hideHeader (default false)
export default function ShoppingList({ hideHeader = false }) {
  const [docs, setDocs] = useState(null); // null = loading
  const [checked, setChecked] = useState(() => new Set());

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const colRef = collection(db, "users", uid, "thisWeek");
    const q5 = query(colRef, orderBy("likedAt", "desc"), limit(5));
    const unsub = onSnapshot(q5, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setDocs(data);
    });
    return () => unsub();
  }, []);

  function normKey(name) {
    return (name || "").trim().toLowerCase().replace(/\s+/g, " ");
  }

  function summarizeMeasures(measures) {
    const freq = new Map();
    for (const m of measures) {
      const k = (m || "").trim().replace(/\s+/g, " ");
      if (!k) continue;
      freq.set(k, (freq.get(k) || 0) + 1);
    }
    return Array.from(freq.entries())
      .map(([m, n]) => (n > 1 ? `${n}× ${m}` : m))
      .join(", ");
  }

  const shopping = useMemo(() => {
    if (!docs) return null;
    const agg = new Map();

    for (const { meal } of docs) {
      if (!meal) continue;
      const ings = parseIngredients(meal);
      for (const { ingredient, measure } of ings) {
        const key = normKey(ingredient);
        if (!key) continue;
        if (!agg.has(key)) {
          const display =
            ingredient?.trim() ||
            ingredient?.toString() ||
            key.charAt(0).toUpperCase() + key.slice(1);
          agg.set(key, { key, name: display, measures: [], noMeasureCount: 0 });
        }
        const entry = agg.get(key);
        if (measure && measure.trim()) {
          entry.measures.push(measure.trim());
        } else {
          entry.noMeasureCount += 1;
        }
      }
    }

    const list = Array.from(agg.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "sv")
    );
    return list;
  }, [docs]);

  function toggle(key) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <aside className="w-full">
      <div className="rounded-2xl bg-white shadow-xl border overflow-hidden">
        {/* Rendera headern bara om vi INTE är i modalens header */}
        {!hideHeader && (
          <header className="px-5 py-4 border-b bg-gray-50">
            <h3 className="text-lg font-semibold">Shopping List</h3>
            <p className="text-xs text-gray-500">
              Combined ingredients from the 5 most recently liked meals
            </p>
          </header>
        )}

        <div className="p-4">
          {/* Loading */}
          {shopping === null && (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 rounded-lg bg-gray-200 animate-pulse" />
              ))}
            </div>
          )}

          {/* Empty */}
          {shopping?.length === 0 && (
            <div className="text-center text-sm text-gray-600 py-8">
              No ingredients yet. Like some meals first!
            </div>
          )}

          {/* List */}
          {shopping && shopping.length > 0 && (
            <ul className="divide-y">
              {shopping.map((it) => {
                const summary = summarizeMeasures(it.measures);
                const noMeasure =
                  it.noMeasureCount > 0 ? `${it.noMeasureCount}× (no measure)` : "";
                const details = [summary, noMeasure].filter(Boolean).join(", ");

                return (
                  <li key={it.key} className="py-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-gray-300"
                        checked={checked.has(it.key)}
                        onChange={() => toggle(it.key)}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{it.name}</div>
                        {details && (
                          <div className="text-xs text-gray-600 mt-0.5">{details}</div>
                        )}
                      </div>
                    </label>
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
