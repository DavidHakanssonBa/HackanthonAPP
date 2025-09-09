// src/firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth, onAuthStateChanged, signInAnonymously, setPersistence,
  browserLocalPersistence, signOut, updateProfile,
  GoogleAuthProvider, signInWithPopup, linkWithPopup,
  EmailAuthProvider, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, linkWithCredential,
  sendPasswordResetEmail,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey:        import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:     import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:         import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export async function initAuthPersistence() {
  await setPersistence(auth, browserLocalPersistence);
}

// Ensure there’s always a user (guest) so your current code keeps working
export function ensureAnonAuth() {
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        try { await signInAnonymously(auth); }
        catch (e) { reject(e); return; }
      }
      unsub();
      resolve();
    });
  });
}

// --- Sign-in / Up (link if anonymous to preserve UID) ---
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  const user = auth.currentUser;
  if (user && user.isAnonymous) {
    const res = await linkWithPopup(user, provider); // upgrade
    return res.user;
  }
  const res = await signInWithPopup(auth, provider);
  return res.user;
}

export async function signInEmail(email, password) {
  const user = auth.currentUser;
  if (user && user.isAnonymous) {
    // upgrade guest -> email/password
    const cred = EmailAuthProvider.credential(email, password);
    const res = await linkWithCredential(user, cred);
    return res.user;
  }
  const res = await signInWithEmailAndPassword(auth, email, password);
  return res.user;
}

export async function registerEmail({ name, email, password }) {
  const user = auth.currentUser;
  if (user && user.isAnonymous) {
    const cred = EmailAuthProvider.credential(email, password);
    const res = await linkWithCredential(user, cred);
    if (name) await updateProfile(res.user, { displayName: name });
    return res.user;
  }
  const res = await createUserWithEmailAndPassword(auth, email, password);
  if (name) await updateProfile(res.user, { displayName: name });
  return res.user;
}

export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

export async function signOutAndStayAnonymous() {
  await signOut(auth);
  await signInAnonymously(auth);
}
