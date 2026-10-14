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
            // If user doc not found yet (e.g. during signup race condition), create default user profile
            const defaultUser: AppUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              displayName: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split("@")[0] : "Admin"),
              schoolId: "",
              role: "proprietor",
              createdAt: new Date().toISOString(),
            };
            try {
              await setDoc(doc(db, "users", firebaseUser.uid), defaultUser, { merge: true });
              setAppUser(defaultUser);
            } catch (err) {
              console.warn("Could not save initial user doc, using memory default:", err);
              setAppUser(defaultUser);
            }
          }
        } catch (error) {
          console.warn("Error fetching app user profile:", error);
          setAppUser(null);
        }
      } else {
        setAppUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signIn = async (email: string, password: string) => {
    // 1. Authenticate via server proxy (immune to client-side ad-blockers / iframe restrictions)
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Invalid email or password");
    }

    // 2. Sign into client-side Firebase Auth with custom token so Firestore rules receive auth context
    if (data.customToken) {
      try {
        const { signInWithCustomToken } = await import("firebase/auth");
        await signInWithCustomToken(auth, data.customToken);
      } catch (clientErr) {
        console.warn("Client custom token signin note:", clientErr);
        try {
          await signInWithEmailAndPassword(auth, email, password);
        } catch {
          // If browser client fails (e.g. adblocker), continue with server authentication state
        }
      }
    }

    // 3. Immediately sync user and appUser state
    if (auth.currentUser) {
      setUser(auth.currentUser);
    } else {
      setUser(data.user as User);
    }
    setAppUser(data.appUser);
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
