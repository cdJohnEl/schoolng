import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  browserLocalPersistence,
  browserSessionPersistence,
  indexedDBLocalPersistence,
  inMemoryPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const realApiKey = "AIzaSyDurJbvr0MB_JcC0wgjAm86s0xGrKM-Myo";
const realAuthDomain = "schoolng-de1f5.firebaseapp.com";
const realProjectId = "schoolng-de1f5";
const realStorageBucket = "schoolng-de1f5.firebasestorage.app";
const realMessagingSenderId = "423904020955";
const realAppId = "1:423904020955:web:e7e2d26bdae5cb4dc83ffe";

function getValidConfigValue(val: string | undefined, fallback: string): string {
  if (!val || val.startsWith("your_") || val.includes("mock") || val === "your_api_key" || val === "your_project_id") {
    return fallback;
  }
  return val;
}

const firebaseConfig = {
  apiKey:            getValidConfigValue(process.env.NEXT_PUBLIC_FIREBASE_API_KEY, realApiKey),
  authDomain:        getValidConfigValue(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, realAuthDomain),
  projectId:         getValidConfigValue(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, realProjectId),
  storageBucket:     getValidConfigValue(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, realStorageBucket),
  messagingSenderId: getValidConfigValue(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, realMessagingSenderId),
  appId:             getValidConfigValue(process.env.NEXT_PUBLIC_FIREBASE_APP_ID, realAppId),
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let authInstance;
try {
  authInstance = initializeAuth(app, {
    persistence: [indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence, inMemoryPersistence],
  });
} catch {
  authInstance = getAuth(app);
}

export const auth = authInstance;
export const db   = getFirestore(app);
export default app;
