import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

const realApiKey = "AIzaSyDurJbvr0MB_JcC0wgjAm86s0xGrKM-Myo";

function getValidApiKey(val: string | undefined): string {
  if (!val || val.startsWith("your_") || val.includes("mock") || val === "your_api_key") {
    return realApiKey;
  }
  return val;
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email or username and password are required" }, { status: 400 });
    }

    let targetEmail = String(email).trim();
    if (!targetEmail.includes("@")) {
      // Look up username in users or staff collection
      const userByUsername = await adminDb.collection("users").where("username", "==", targetEmail.toLowerCase()).get();
      if (!userByUsername.empty) {
        targetEmail = userByUsername.docs[0].data().email;
      } else {
        const staffByUsername = await adminDb.collection("staff").where("username", "==", targetEmail.toLowerCase()).get();
        if (!staffByUsername.empty) {
          targetEmail = staffByUsername.docs[0].data().email;
        } else {
          targetEmail = `${targetEmail.toLowerCase()}@schoolng.internal`;
        }
      }
    }

    const apiKey = getValidApiKey(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);

    // Verify credentials via Firebase Identity Toolkit
    const verifyRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, password, returnSecureToken: true }),
      }
    );

    const verifyData = await verifyRes.json();

    if (!verifyRes.ok || !verifyData.localId) {
      const rawMsg = verifyData?.error?.message || "Invalid email or password";
      const userFriendlyMsg =
        rawMsg === "INVALID_LOGIN_CREDENTIALS" || rawMsg === "EMAIL_NOT_FOUND" || rawMsg === "INVALID_PASSWORD"
          ? "Invalid email or password"
          : rawMsg;
      return NextResponse.json({ error: userFriendlyMsg }, { status: 401 });
    }

    const uid = verifyData.localId;

    // Fetch user document from Firestore
    const userDocSnap = await adminDb.collection("users").doc(uid).get();
    let appUser = userDocSnap.exists ? userDocSnap.data() : null;

    const isPlatformOwner = targetEmail.toLowerCase() === "easykelchimdikejohn@gmail.com";

    if (!appUser) {
      // If user profile is missing, create it
      appUser = {
        uid,
        email: verifyData.email,
        displayName: verifyData.displayName || (verifyData.email ? verifyData.email.split("@")[0] : "Admin"),
        schoolId: isPlatformOwner ? "school_brightstar" : "school_brightstar",
        role: isPlatformOwner ? "super_admin" : "proprietor",
        createdAt: new Date().toISOString(),
      };
      await adminDb.collection("users").doc(uid).set(appUser, { merge: true });
    } else if (isPlatformOwner && appUser.role !== "super_admin") {
      appUser.role = "super_admin";
      await adminDb.collection("users").doc(uid).update({ role: "super_admin" });
    }

    // Generate Firebase custom token with claims for client-side authentication
    let customToken = "";
    try {
      customToken = await adminAuth.createCustomToken(uid, {
        email: verifyData.email || targetEmail,
        role: appUser?.role || "proprietor",
        schoolId: appUser?.schoolId || "",
      });
    } catch (tokenErr) {
      console.warn("Could not generate custom token:", tokenErr);
    }

    const userPayload = {
      uid,
      email: verifyData.email,
      displayName: appUser?.displayName || verifyData.displayName || "Admin",
      idToken: verifyData.idToken,
    };

    return NextResponse.json({
      success: true,
      user: userPayload,
      appUser,
      customToken,
    });
  } catch (error: unknown) {
    console.error("API login error:", error);
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
