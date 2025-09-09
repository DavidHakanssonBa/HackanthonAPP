import { useEffect, useMemo, useState } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, query, orderBy, limit as qLimit } from "firebase/firestore";
import { parseIngredients } from "./meal";

/* utils unchanged */
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

/** Subscribe to last N liked meals, but only after auth is known */
export function useThisWeekDocs(limit = 1) {
  // uid: undefined = auth loading, null = signed out, string = uid
  const [uid, setUid] = useState(undefined);
  const [docs, setDocs] = useState(null); // null = loading, [] = empty
  const [error, setError] = useState("");

  // 1) Watch auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUid(user ? user.uid : null);
    });
    return unsub;
  }, []);

  // 2) When uid is known, subscribe to Firestore
  useEffect(() => {
    if (uid === undefined) {
      // still loading auth
      setDocs(null);
      return;
    }
    if (uid === null) {
      // signed out -> no items
      setDocs([]);
      return;
    }
    const colRef = collection(db, "users", uid, "thisWeek");
    const q = query(colRef, orderBy("likedAt", "desc"), qLimit(limit));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setDocs(data);
        // quick debug:
        // console.log("thisWeek docs:", data.length);
      },
      (err) => setError(err.message || String(err))
    );
    return unsub;
  }, [uid, limit]);

  return { docs, error, loading: docs === null || uid === undefined };
}

/** Aggregate into shopping items */
export function useShoppingList(limit = 1) {
  const { docs, error, loading } = useThisWeekDocs(limit);
  const shopping = useMemo(() => {
    if (docs == null) return null; // still loading
    const agg = new Map();
    for (const { meal } of docs) {
      if (!meal) continue;
      const ings = parseIngredients(meal) || [];
      for (const { ingredient, measure } of ings) {
        const key = normKey(ingredient);
        if (!key) continue;
        if (!agg.has(key)) {
          const display =
            (ingredient && String(ingredient).trim()) ||
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

/** Plain text helper */
export function useShoppingListText(limit = 1, opts) {
  const { shopping, loading, error } = useShoppingList(limit);
  const text = useMemo(() => formatShoppingPlain(shopping, opts), [shopping, opts]);
  // Debug to confirm:
  // console.log("shopping items:", shopping?.length, "text length:", text?.length);
  return { text, loading, error };
}
