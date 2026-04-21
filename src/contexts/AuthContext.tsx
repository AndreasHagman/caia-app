"use client";

import { auth, db } from "@/lib/firebase";
import type { AppUser } from "@/types";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut, type User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isOwner: boolean;
  isFamily: boolean;
  canEdit: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchOrCreateUserDoc(firebaseUser: User): Promise<AppUser> {
  const ref = doc(db, "users", firebaseUser.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    return snap.data() as AppUser;
  }

  const newUser: AppUser = {
    uid: firebaseUser.uid,
    email: firebaseUser.email ?? "",
    role: "family",
    ...(firebaseUser.displayName && { displayName: firebaseUser.displayName }),
  };
  await setDoc(ref, newUser);
  return newUser;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const appUser = await fetchOrCreateUserDoc(firebaseUser);
        setUser(appUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function signIn(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function signOut() {
    await firebaseSignOut(auth);
    setUser(null);
  }

  const isOwner = user?.role === "owner";
  const isFamily = user?.role === "family";
  const canEdit = isOwner || isFamily;

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, isOwner, isFamily, canEdit }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
