import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";

export async function POST() {
  try {
    // Check if school already exists
    const schoolSnap = await adminDb.collection("schools").doc("school_brightstar").get();
    if (!schoolSnap.exists) {
      return NextResponse.json({ error: "Seed data missing. Run seed script." }, { status: 400 });
    }
    return NextResponse.json({ success: true, message: "Database is configured and populated" });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
