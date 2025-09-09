// src/firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth, onAuthStateChanged, signInAnonymously, setPersistence,
  browserLocalPersistence, browserSessionPersistence, inMemoryPersistence,
  signOut, updateProfile, fetchSignInMethodsForEmail,
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

/** Pick persistence mode via env:
 *  VITE_AUTH_PERSISTENCE = 'local' | 'session' | 'none' (default: local)
 *  - local: stays after browser close (default Firebase behavior)
 *  - session: clears when the tab/window closes
 *  - none: in-memory (clears on refresh)
 */
export async function initAuthPersistence() {
  const mode = (import.meta.env.VITE_AUTH_PERSISTENCE || "local").toLowerCase();
  const p =
    mode === "session" ? browserSessionPersistence :
    mode === "none"    ? inMemoryPersistence :
                         browserLocalPersistence;
  await setPersistence(auth, p);
}

// Keep anonymous user available so your app flows work pre-login
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

// --------- Sign-in helpers (conflict-safe) ---------

export async function signInEmail(email, password) {
  const current = auth.currentUser;
  if (current?.isAnonymous) {
    // Try to sign in to an existing account first.
    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      // NOTE: This replaces the anonymous user. Anonymous data on this device won't be auto-merged.
      // If you need merging, we can add a migration step (requires rules/Cloud Functions).
      return res.user;
    } catch (e) {
      if (e.code === "auth/user-not-found") {
        // No existing account → link (upgrade) to PRESERVE the current UID/data
        const cred = EmailAuthProvider.credential(email, password);
        const res = await linkWithCredential(current, cred);
        return res.user;
      }
      throw e;
    }
  } else {
    // Not anonymous → normal sign-in
    const res = await signInWithEmailAndPassword(auth, email, password);
    return res.user;
  }
}

export async function registerEmail({ name, email, password }) {
  const current = auth.currentUser;
  if (current?.isAnonymous) {
    // If email exists, linking will throw; check first to keep UX clean
    const methods = await fetchSignInMethodsForEmail(auth, email);
    if (methods.length > 0) {
      // Account already exists → ask user to sign in instead
      throw new Error("An account with that email already exists. Please sign in.");
    }
    const cred = EmailAuthProvider.credential(email, password);
    const res = await linkWithCredential(current, cred);
    if (name) await updateProfile(res.user, { displayName: name });
    return res.user;
  } else {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    if (name) await updateProfile(res.user, { displayName: name });
    return res.user;
  }
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  const current = auth.currentUser;

  if (current?.isAnonymous) {
    try {
      // Try upgrading the anonymous user (preserves UID)
      const res = await linkWithPopup(current, provider);
      return res.user;
    } catch (e) {
      // If that Google account/email already exists elsewhere, fall back to sign-in
      if (
        e.code === "auth/credential-already-in-use" ||
        e.code === "auth/account-exists-with-different-credential" ||
        e.code === "auth/email-already-in-use"
      ) {
        const res = await signInWithPopup(auth, provider);
        return res.user;
      }
      throw e;
    }
  } else {
    const res = await signInWithPopup(auth, provider);
    return res.user;
  }
}

export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

export async function signOutAndStayAnonymous() {
  await signOut(auth);
  await signInAnonymously(auth);
}
