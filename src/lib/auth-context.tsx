"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User, onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { AppUser } from "@/types";

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendReset: (email: string) => Promise<void>;
  refreshAppUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const snap = await getDoc(doc(db, "users", firebaseUser.uid));
          if (snap.exists()) {
            setAppUser(snap.data() as AppUser);
          } else {
            console.error("User doc missing in Firestore. Signing out.");
            await firebaseSignOut(auth);
            setAppUser(null);
            setUser(null);
          }
        } catch (error) {
          console.error("Error fetching app user:", error);
          await firebaseSignOut(auth);
          setAppUser(null);
          setUser(null);
        }
      } else {
        setAppUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });
    const newUser: AppUser = {
      uid: cred.user.uid, email, displayName,
      schoolId: "", role: "proprietor", createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, "users", cred.user.uid), newUser);
    setAppUser(newUser);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setAppUser(null);
  };

  const sendReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  // Call this after school setup to sync the in-memory appUser with Firestore
  const refreshAppUser = async () => {
    if (!user) return;
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) setAppUser(snap.data() as AppUser);
  };

  return (
    <AuthContext.Provider value={{ user, appUser, loading, signIn, signUp, signOut, sendReset, refreshAppUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
