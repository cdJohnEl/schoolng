"use client";
import { useState, useEffect } from "react";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import type { School, AcademicSession } from "@/types";

// Per-school in-memory cache — cleared when schoolId changes
let _cacheKey = "";
let _school: School | null = null;
let _session: AcademicSession | null = null;

export function useSchool() {
  const { appUser } = useAuth();
  const schoolId = appUser?.schoolId ?? "";

  // Reset cache when school changes
  if (schoolId && schoolId !== _cacheKey) {
    _cacheKey = schoolId;
    _school = null;
    _session = null;
  }

  const [school, setSchool]     = useState<School | null>(_school);
  const [session, setSession]   = useState<AcademicSession | null>(_session);
  const [loading, setLoading]   = useState(!_school && !!schoolId);

  useEffect(() => {
    if (!schoolId || _school) { setLoading(false); return; }
    setLoading(true);
    Promise.all([
      getDoc(doc(db, "schools", schoolId)),
      getDocs(query(
        collection(db, "sessions"),
        where("schoolId", "==", schoolId),
        where("isActive", "==", true),
      )),
    ])
      .then(([schoolSnap, sessionsSnap]) => {
        if (schoolSnap.exists()) {
          const s = { id: schoolSnap.id, ...schoolSnap.data() } as School;
          _school = s;
          setSchool(s);
        }
        if (!sessionsSnap.empty) {
          const sess = { id: sessionsSnap.docs[0].id, ...sessionsSnap.docs[0].data() } as AcademicSession;
          _session = sess;
          setSession(sess);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [schoolId]);

  // Expose a way to invalidate cache (used after session changes in Settings)
  const invalidate = () => {
    _school = null;
    _session = null;
  };

  return { school, session, loading, invalidate };
}
