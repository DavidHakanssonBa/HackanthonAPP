import { useEffect, useMemo, useState } from "react";
import { auth, db } from "./firebase";
import { parseIngredients } from "./meal";
import { collection, onSnapshot, query, orderBy, limit as qLimit } from "firebase/firestore";
// --- utils reused by both the hook and your ShoppingList.jsx ---
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
// Turn aggregated items into plain text
export function formatShoppingPlain(list, { showNoMeasure = true, bullet = "• " } = {}) {
  if (!list?.length) return "";
  return list
    .map((it) => {
      const summary = summarizeMeasures(it.measures);
      const noMeasure = it.noMeasureCount > 0 && showNoMeasure ? `${it.noMeasureCount}× (no measure)` : "";
      const details = [summary, noMeasure].filter(Boolean).join(", ");
      return details ? `${bullet}${it.name} — ${details}` : `${bullet}${it.name}`;
    })
    .join("\n");
}
// Subscribe to last N liked meals
export function useThisWeekDocs(limit = 100) {
  const [docs, setDocs] = useState(null);     // null = loading
  const [error, setError] = useState("");
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) { setDocs([]); return; }
    const colRef = collection(db, "users", uid, "thisWeek");
    const q = query(colRef, orderBy("likedAt", "desc"), qLimit(limit));
    const unsub = onSnapshot(
      q,
      (snap) => setDocs(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => setError(err.message || String(err))
    );
    return () => unsub();
  }, [limit]);
  return { docs, error, loading: docs === null };
}
// Aggregate into shopping items: [{ key, name, measures[], noMeasureCount }]
export function useShoppingList(limit = 100) {
  const { docs, error, loading } = useThisWeekDocs(limit);
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
        if (measure && measure.trim()) entry.measures.push(measure.trim());
        else entry.noMeasureCount += 1;
      }
    }
    return Array.from(agg.values()).sort((a, b) => a.name.localeCompare(b.name, "sv"));
  }, [docs]);
  return { shopping, error, loading };
}
// One-liner for plain text
export function useShoppingListText(limit = 100, opts) {
  const { shopping, loading, error } = useShoppingList(limit);
  const text = useMemo(() => formatShoppingPlain(shopping, opts), [shopping, opts]);
  return { text, loading, error };
}









