import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { NIGERIAN_CLASSES, DEFAULT_NIGERIAN_SUBJECTS } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const snap = await adminDb.collection("schools").get();
    const schools: any[] = [];

    for (const doc of snap.docs) {
      const data = doc.data();
      const schoolId = doc.id;

      // Count students in this school
      const studentsSnap = await adminDb.collection("students").where("schoolId", "==", schoolId).count().get();
      const staffSnap = await adminDb.collection("staff").where("schoolId", "==", schoolId).count().get();
      const classesSnap = await adminDb.collection("classes").where("schoolId", "==", schoolId).count().get();
      const subjectsSnap = await adminDb.collection("subjects").where("schoolId", "==", schoolId).count().get();

      schools.push({
        id: schoolId,
        ...data,
        studentCount: studentsSnap.data().count,
        staffCount: staffSnap.data().count,
        classCount: classesSnap.data().count,
        subjectCount: subjectsSnap.data().count,
      });
    }

    // Sort newest first
    schools.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    return NextResponse.json({ success: true, schools });
  } catch (error: unknown) {
    console.error("Admin fetch schools error:", error);
    const msg = error instanceof Error ? error.message : "Failed to load schools";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      motto = "",
      address = "",
      phone = "",
      email = "",
      plan = "free",
      subscriptionStatus = "active",
      ownerEmail = "",
      ownerName = "Admin",
    } = body;

    if (!name) {
      return NextResponse.json({ error: "School name is required" }, { status: 400 });
    }

    const schoolRef = adminDb.collection("schools").doc();
    const schoolId = schoolRef.id;
    const now = new Date().toISOString();

    const newSchool = {
      id: schoolId,
      name,
      motto,
      address,
      phone,
      email: email || ownerEmail,
      ownerId: `owner_${schoolId}`,
      plan,
      subscriptionStatus,
      createdAt: now,
    };

    await schoolRef.set(newSchool);

    // Automatically pre-load standard Nigerian classes and 20 subjects
    const batch = adminDb.batch();

    // 1. Classes
    const createdClassIds: string[] = [];
    NIGERIAN_CLASSES.forEach((cTemplate) => {
      const classId = `cls_${schoolId}_${cTemplate.name.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
      createdClassIds.push(classId);
      const classRef = adminDb.collection("classes").doc(classId);
      batch.set(classRef, {
        id: classId,
        schoolId,
        name: cTemplate.name,
        arm: "A",
        level: cTemplate.level,
        subjectIds: [],
        order: cTemplate.order,
      });
    });

    // 2. 20 Standard Nigerian Subjects
    DEFAULT_NIGERIAN_SUBJECTS.forEach((subTemplate) => {
      const subId = `sub_${schoolId}_${subTemplate.name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8)}`;
      const subRef = adminDb.collection("subjects").doc(subId);
      batch.set(subRef, {
        id: subId,
        schoolId,
        name: subTemplate.name,
        code: subTemplate.code,
        classIds: createdClassIds,
      });
    });

    // 3. Default Academic Session
    const sessRef = adminDb.collection("sessions").doc(`sess_${schoolId}_2025_2026`);
    batch.set(sessRef, {
      id: `sess_${schoolId}_2025_2026`,
      schoolId,
      name: "2025/2026",
      currentTerm: "First Term",
      startDate: "2025-09-08",
      endDate: "2026-07-24",
      isActive: true,
      createdAt: now,
    });

    await batch.commit();

    return NextResponse.json({
      success: true,
      school: {
        ...newSchool,
        studentCount: 0,
        staffCount: 0,
        classCount: createdClassIds.length,
        subjectCount: DEFAULT_NIGERIAN_SUBJECTS.length,
      },
    });
  } catch (error: unknown) {
    console.error("Admin create school error:", error);
    const msg = error instanceof Error ? error.message : "Failed to create school";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
