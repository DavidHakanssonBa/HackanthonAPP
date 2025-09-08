// src/likes.js
import {
  collection, doc, setDoc, serverTimestamp,
  addDoc, getDocs, query, orderBy, limit, deleteDoc
} from "firebase/firestore";
import { db, auth } from "./firebase";

function userPath(uid, sub) {
  return collection(db, "users", uid, sub);
}

// Spara fulla meal-objektet i users/{uid}/likes
export async function likeMealFull(meal) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("No user signed in");

  // 1) Spara i "likes" med id = idMeal (idempotent); likedAt uppdateras
  const likeRef = doc(db, "users", uid, "likes", meal.idMeal);
  await setDoc(likeRef, {
    idMeal: meal.idMeal,
    likedAt: serverTimestamp(),
    meal   : meal
  }, { merge: true });

  // 2) Lägg till i "thisWeek" och trimma till 5 senaste
  const twCol = userPath(uid, "thisWeek");
  // Skapa nytt dokument (auto-id) med payload
  await addDoc(twCol, {
    idMeal: meal.idMeal,
    likedAt: serverTimestamp(),
    meal   : meal
  });

  // Hämta de senaste 5 och ta bort resten
  const q5 = query(twCol, orderBy("likedAt", "desc"), limit(500));
  const snap5 = await getDocs(q5);
  const keepIds = new Set(snap5.docs.map(d => d.id));

  // Hämta ALLA i thisWeek och rensa de som inte är med i ny topp-5
  const allSnap = await getDocs(twCol);
  const deletions = [];
  allSnap.forEach(d => {
    if (!keepIds.has(d.id)) {
      deletions.push(deleteDoc(doc(db, "users", uid, "thisWeek", d.id)));
    }
  });
  await Promise.all(deletions);
}

// Hämta de fem senaste (för rendering)
export async function getThisWeeksMeals() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("No user signed in");

  const twCol = userPath(uid, "thisWeek");
  const q5 = query(twCol, orderBy("likedAt", "desc"), limit(500));
  const snap = await getDocs(q5);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
