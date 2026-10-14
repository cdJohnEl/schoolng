import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const docSnap = await adminDb.collection("schools").doc(id).get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    const studentsSnap = await adminDb.collection("students").where("schoolId", "==", id).count().get();
    const staffSnap = await adminDb.collection("staff").where("schoolId", "==", id).count().get();

    return NextResponse.json({
      success: true,
      school: {
        id: docSnap.id,
        ...docSnap.data(),
        studentCount: studentsSnap.data().count,
        staffCount: staffSnap.data().count,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error fetching school";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const {
      name,
      motto,
      address,
      phone,
      email,
      plan,
      subscriptionStatus,
    } = body;

    const docRef = adminDb.collection("schools").doc(id);
    const existing = await docRef.get();

    if (!existing.exists) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    const updatePayload: Record<string, any> = {};
    if (name !== undefined) updatePayload.name = name;
    if (motto !== undefined) updatePayload.motto = motto;
    if (address !== undefined) updatePayload.address = address;
    if (phone !== undefined) updatePayload.phone = phone;
    if (email !== undefined) updatePayload.email = email;
    if (plan !== undefined) updatePayload.plan = plan;
    if (subscriptionStatus !== undefined) updatePayload.subscriptionStatus = subscriptionStatus;
    updatePayload.updatedAt = new Date().toISOString();

    await docRef.update(updatePayload);

    return NextResponse.json({
      success: true,
      school: { id, ...existing.data(), ...updatePayload },
    });
  } catch (error: unknown) {
    console.error("Error updating school:", error);
    const msg = error instanceof Error ? error.message : "Failed to update school";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const docRef = adminDb.collection("schools").doc(id);
    const existing = await docRef.get();

    if (!existing.exists) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    await docRef.delete();

    return NextResponse.json({ success: true, message: `School ${id} deleted successfully` });
  } catch (error: unknown) {
    console.error("Error deleting school:", error);
    const msg = error instanceof Error ? error.message : "Failed to delete school";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
