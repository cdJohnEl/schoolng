import { collection, writeBatch, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { NIGERIAN_CLASSES, DEFAULT_NIGERIAN_SUBJECTS, SchoolClass, Subject, AcademicSession } from "@/types";

export async function populateDefaultSchoolData(schoolId: string) {
  if (!schoolId) return;

  const batch = writeBatch(db);

  // 1. Create standard classes
  const createdClassIds: string[] = [];
  NIGERIAN_CLASSES.forEach((cTemplate) => {
    const classId = `cls_${schoolId}_${cTemplate.name.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
    createdClassIds.push(classId);
    const classRef = doc(db, "classes", classId);
    const newClass: SchoolClass = {
      id: classId,
      schoolId,
      name: cTemplate.name,
      arm: "A",
      level: cTemplate.level,
      subjectIds: [],
      order: cTemplate.order,
    };
    batch.set(classRef, newClass, { merge: true });
  });

  // 2. Create standard subjects
  DEFAULT_NIGERIAN_SUBJECTS.forEach((subTemplate) => {
    const subId = `sub_${schoolId}_${subTemplate.name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8)}`;
    const subRef = doc(db, "subjects", subId);
    const newSubject: Subject = {
      id: subId,
      schoolId,
      name: subTemplate.name,
      code: subTemplate.code,
      classIds: createdClassIds, // initially assigned to all standard classes
    };
    batch.set(subRef, newSubject, { merge: true });
  });

  // 3. Create default active academic session
  const sessionId = `sess_${schoolId}_2025_2026`;
  const sessRef = doc(db, "sessions", sessionId);
  const newSession: AcademicSession = {
    id: sessionId,
    schoolId,
    name: "2025/2026",
    currentTerm: "First Term",
    startDate: "2025-09-08",
    endDate: "2026-07-24",
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  batch.set(sessRef, newSession, { merge: true });

  await batch.commit();
}

export async function populateDefaultSubjectsOnly(schoolId: string) {
  if (!schoolId) return;

  const batch = writeBatch(db);
  DEFAULT_NIGERIAN_SUBJECTS.forEach((subTemplate) => {
    const subId = `sub_${schoolId}_${subTemplate.name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8)}`;
    const subRef = doc(db, "subjects", subId);
    const newSubject: Subject = {
      id: subId,
      schoolId,
      name: subTemplate.name,
      code: subTemplate.code,
      classIds: [], // available across all classes
    };
    batch.set(subRef, newSubject, { merge: true });
  });

  await batch.commit();
}
