import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      schoolId,
      firstName,
      lastName,
      email,
      username,
      password,
      phone,
      role = "teacher",
      qualification = "",
      joinDate = new Date().toISOString().split("T")[0],
      subjectIds = [],
      classIds = [],
    } = body;

    if (!schoolId || !firstName || !lastName) {
      return NextResponse.json({ error: "Missing required fields (schoolId, firstName, lastName)" }, { status: 400 });
    }

    const cleanUsername = (username || `${firstName.toLowerCase().replace(/[^a-z0-9]/g, "")}.${lastName.toLowerCase().replace(/[^a-z0-9]/g, "")}`).trim();
    const authEmail = email && email.includes("@") ? email.trim() : `${cleanUsername}@schoolng.internal`;

    let userId = "";

    // If password provided, create Firebase Auth user for the teacher
    if (password && password.length >= 6) {
      try {
        // Check if user already exists
        try {
          const existingUser = await adminAuth.getUserByEmail(authEmail);
          userId = existingUser.uid;
          await adminAuth.updateUser(userId, {
            password,
            displayName: `${firstName} ${lastName}`,
          });
        } catch {
          // Create new user
          const newUser = await adminAuth.createUser({
            email: authEmail,
            password,
            displayName: `${firstName} ${lastName}`,
          });
          userId = newUser.uid;
        }

        // Create or update users record
        await adminDb.collection("users").doc(userId).set({
          uid: userId,
          email: authEmail,
          username: cleanUsername,
          displayName: `${firstName} ${lastName}`,
          schoolId,
          role: role === "proprietor" ? "proprietor" : role === "admin" ? "admin" : role === "bursar" ? "bursar" : "teacher",
          createdAt: new Date().toISOString(),
        }, { merge: true });
      } catch (authErr: unknown) {
        console.warn("Could not create Firebase Auth account for staff:", authErr);
      }
    }

    // Create staff document
    const staffRef = adminDb.collection("staff").doc();
    const staffData = {
      id: staffRef.id,
      schoolId,
      userId: userId || undefined,
      username: cleanUsername,
      firstName,
      lastName,
      email: email || authEmail,
      phone: phone || "",
      role,
      status: "active",
      qualification,
      subjectIds,
      classIds,
      joinDate,
      createdAt: new Date().toISOString(),
    };

    await staffRef.set(staffData);

    return NextResponse.json({
      success: true,
      staff: staffData,
      loginCredentials: password ? { username: cleanUsername, email: authEmail } : null,
    });
  } catch (error: unknown) {
    console.error("Staff creation error:", error);
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const schoolId = searchParams.get("schoolId");

    if (!schoolId) {
      return NextResponse.json({ error: "schoolId required" }, { status: 400 });
    }

    const snap = await adminDb.collection("staff").where("schoolId", "==", schoolId).get();
    const staffList = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    return NextResponse.json({ staff: staffList });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
