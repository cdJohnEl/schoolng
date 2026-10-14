import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const examId = searchParams.get("id");
    const schoolId = searchParams.get("schoolId");

    // Single exam fetch
    if (examId) {
      const docSnap = await adminDb.collection("exams").doc(examId).get();
      if (!docSnap.exists) {
        return NextResponse.json({ error: "Exam not found" }, { status: 404 });
      }
      return NextResponse.json({ exam: { id: docSnap.id, ...docSnap.data() } });
    }

    if (!schoolId) {
      return NextResponse.json({ exams: [], classes: [], subjects: [] });
    }

    const [examsSnap, classesSnap, subjectsSnap] = await Promise.all([
      adminDb.collection("exams").where("schoolId", "==", schoolId).get(),
      adminDb.collection("classes").where("schoolId", "==", schoolId).get(),
      adminDb.collection("subjects").where("schoolId", "==", schoolId).get(),
    ]);

    const exams = examsSnap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a: any, b: any) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

    const classes = classesSnap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));

    const subjects = subjectsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    return NextResponse.json({ exams, classes, subjects });
  } catch (error: any) {
    console.error("Error in /api/exams GET:", error);
    return NextResponse.json({ error: error.message || "Failed to load exams" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      schoolId,
      title,
      type = "ca",
      questionMode = "both",
      classId,
      className,
      subjectId,
      subjectName,
      date,
      duration = "1 hour",
      maxScore = 40,
      instructions = "",
      questions = [],
      createdBy = "Teacher",
    } = body;

    if (!schoolId || !title || !classId || !subjectId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newDoc = {
      schoolId,
      title,
      type,
      questionMode,
      classId,
      className: className || classId,
      subjectId,
      subjectName: subjectName || subjectId,
      date: date || new Date().toISOString().split("T")[0],
      duration,
      maxScore: Number(maxScore),
      instructions,
      questions: Array.isArray(questions) ? questions : [],
      totalQuestions: Array.isArray(questions) ? questions.length : 0,
      createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await adminDb.collection("exams").add(newDoc);
    return NextResponse.json({ success: true, id: docRef.id, exam: { id: docRef.id, ...newDoc } });
  } catch (error: any) {
    console.error("Error in /api/exams POST:", error);
    return NextResponse.json({ error: error.message || "Failed to create exam" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing exam ID" }, { status: 400 });
    }

    if (updates.maxScore !== undefined) {
      updates.maxScore = Number(updates.maxScore);
    }
    if (Array.isArray(updates.questions)) {
      updates.totalQuestions = updates.questions.length;
    }
    updates.updatedAt = new Date().toISOString();

    await adminDb.collection("exams").doc(id).update(updates);
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error("Error in /api/exams PUT:", error);
    return NextResponse.json({ error: error.message || "Failed to update exam" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing exam ID" }, { status: 400 });
    }

    await adminDb.collection("exams").doc(id).delete();
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error("Error in /api/exams DELETE:", error);
    return NextResponse.json({ error: error.message || "Failed to delete exam" }, { status: 500 });
  }
}
