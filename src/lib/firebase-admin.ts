import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import fs from "fs";
import path from "path";

if (!getApps().length) {
  try {
    const credPath = path.resolve(process.cwd(), "schoolng-de1f5-firebase-adminsdk-fbsvc-905f97c241.json");
    if (fs.existsSync(credPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(credPath, "utf-8"));
      initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id || "schoolng-de1f5",
      });
    } else {
      initializeApp({
        projectId: "schoolng-de1f5",
      });
    }
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
  }
}

export const adminDb = getFirestore();
export const adminAuth = getAuth();
