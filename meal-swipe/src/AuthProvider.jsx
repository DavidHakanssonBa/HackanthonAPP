// src/AuthProvider.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { auth, initAuthPersistence, ensureAnonAuth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    (async () => {
      await initAuthPersistence();
      await ensureAnonAuth(); // keep guest if not signed in
      const unsub = onAuthStateChanged(auth, (u) => {
        setUser(u);
        setInitializing(false);
      });
      return () => unsub();
    })();
  }, []);

  return (
    <AuthCtx.Provider value={{ user, initializing }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}
