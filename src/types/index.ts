// ─── School ────────────────────────────────────────────────────────────────
export interface School {
  id: string;
  name: string;
  motto: string;
  address: string;
  phone: string;
  email: string;
  logoUrl?: string;
  ownerId: string;
  plan: "starter" | "growth" | "group" | "free";
  subscriptionStatus?: "active" | "cancelled" | "past_due";
  paystackReference?: string;
  createdAt: string;
}

// ─── Academic structure ────────────────────────────────────────────────────
export type SchoolLevel = "nursery" | "primary" | "secondary";
export type Term       = "First Term" | "Second Term" | "Third Term";

export interface AcademicSession {
  id: string;
  schoolId: string;
  name: string;           // e.g. "2025/2026"
  currentTerm: Term;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

export interface SchoolClass {
  id: string;
  schoolId: string;
  name: string;           // e.g. "JSS 1", "Basic 4", "Nursery 2"
  arm: string;            // e.g. "A", "B", "C" — or "" if no arms
  level: SchoolLevel;
  classTeacherId?: string;
  subjectIds: string[];
  order: number;          // for sorting: Nursery 1=1, Basic 1=4, JSS1=10 etc.
}

export interface Subject {
  id: string;
  schoolId: string;
  name: string;           // e.g. "Mathematics", "English Language"
  code?: string;          // e.g. "MTH", "ENG"
  classIds: string[];     // which classes offer this subject
}

// ─── Student ───────────────────────────────────────────────────────────────
export type StudentStatus = "active" | "graduated" | "withdrawn" | "suspended";
export type Gender       = "male" | "female";

export interface Student {
  id: string;
  schoolId: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  otherName?: string;
  gender: Gender;
  dateOfBirth: string;
  photoUrl?: string;
  classId: string;
  sessionId: string;
  status: StudentStatus;
  admissionDate: string;
  previousSchool?: string;

  // Parent / guardian
  parentName: string;
  parentPhone: string;
  parentPhone2?: string;
  parentEmail?: string;
  relationship: "father" | "mother" | "guardian";
  homeAddress: string;

  createdAt: string;
  updatedAt: string;
}

// ─── Staff ─────────────────────────────────────────────────────────────────
export type StaffRole   = "admin" | "teacher" | "bursar" | "proprietor";
export type StaffStatus = "active" | "inactive";

export interface Staff {
  id: string;
  schoolId: string;
  userId?: string;        // Firebase uid if they have login access
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: StaffRole;
  status: StaffStatus;
  qualification: string;
  subjectIds: string[];   // subjects they teach
  classIds: string[];     // classes they're assigned to
  photoUrl?: string;
  joinDate: string;
  createdAt: string;
}

// ─── Fees ──────────────────────────────────────────────────────────────────
export type FeeCategory = "tuition" | "bus" | "uniform" | "books" | "exam" | "development" | "other";
export type PaymentMethod = "cash" | "bank_transfer" | "paystack" | "pos";
export type PaymentStatus = "paid" | "partial" | "unpaid";

export interface FeeStructure {
  id: string;
  schoolId: string;
  sessionId: string;
  term: Term;
  classId: string;        // which class this applies to
  items: FeeItem[];
  totalAmount: number;
  createdAt: string;
}

export interface FeeItem {
  category: FeeCategory;
  label: string;
  amount: number;
  mandatory: boolean;
}

export interface FeePayment {
  id: string;
  schoolId: string;
  studentId: string;
  sessionId: string;
  term: Term;
  classId: string;
  totalExpected: number;
  totalPaid: number;
  balance: number;
  status: PaymentStatus;
  transactions: FeeTransaction[];
  createdAt: string;
  updatedAt: string;
}

export interface FeeTransaction {
  id: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;     // Paystack reference or bank teller number
  receivedBy: string;     // staff name
  note?: string;
}

// ─── Attendance ────────────────────────────────────────────────────────────
export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export interface AttendanceRecord {
  id: string;
  schoolId: string;
  classId: string;
  sessionId: string;
  term: Term;
  date: string;           // ISO date string YYYY-MM-DD
  markedBy: string;       // staff id
  entries: AttendanceEntry[];
  createdAt: string;
}

export interface AttendanceEntry {
  studentId: string;
  status: AttendanceStatus;
  note?: string;
}

// ─── Results ───────────────────────────────────────────────────────────────
export type GradeLabel = "A1" | "B2" | "B3" | "C4" | "C5" | "C6" | "D7" | "E8" | "F9";

export interface ResultRecord {
  id: string;
  schoolId: string;
  studentId: string;
  classId: string;
  sessionId: string;
  term: Term;
  subjectResults: SubjectResult[];
  totalScore: number;
  average: number;
  position: number;
  classSize: number;
  teacherRemark: string;
  principalRemark: string;
  nextTermBegins: string;
  daysSchoolOpened: number;
  daysPresent: number;
  psychomotor: PsychomotorScores;
  affective: AffectiveScores;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubjectResult {
  subjectId: string;
  subjectName: string;
  ca: number;             // max 40
  exam: number;           // max 60
  total: number;          // ca + exam, max 100
  grade: GradeLabel;
  position: number;       // position in class for this subject
  remark: string;         // "Excellent" | "Good" | "Pass" | "Fail"
}

export interface PsychomotorScores {
  handwriting: 1 | 2 | 3 | 4 | 5;
  drawing: 1 | 2 | 3 | 4 | 5;
  sport: 1 | 2 | 3 | 4 | 5;
  handwork: 1 | 2 | 3 | 4 | 5;
}

export interface AffectiveScores {
  punctuality: 1 | 2 | 3 | 4 | 5;
  neatness: 1 | 2 | 3 | 4 | 5;
  politeness: 1 | 2 | 3 | 4 | 5;
  honesty: 1 | 2 | 3 | 4 | 5;
  attentiveness: 1 | 2 | 3 | 4 | 5;
  initiative: 1 | 2 | 3 | 4 | 5;
}

// ─── Communications ────────────────────────────────────────────────────────
export type MessageType = "sms" | "in_app";
export type MessageTarget = "all" | "class" | "individual" | "debtors";

export interface Message {
  id: string;
  schoolId: string;
  type: MessageType;
  target: MessageTarget;
  targetClassId?: string;
  targetStudentIds?: string[];
  subject?: string;
  body: string;
  sentBy: string;
  recipientCount: number;
  status: "sent" | "failed" | "pending";
  createdAt: string;
}

// ─── Auth / User ───────────────────────────────────────────────────────────
export type UserRole = "proprietor" | "admin" | "teacher" | "bursar";

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  schoolId: string;
  role: UserRole;
  staffId?: string;
  createdAt: string;
}

// ─── Nigerian school helpers ────────────────────────────────────────────────
export const NIGERIAN_CLASSES: { name: string; level: SchoolLevel; order: number }[] = [
  // Nursery
  { name: "Nursery 1",   level: "nursery",   order: 1 },
  { name: "Nursery 2",   level: "nursery",   order: 2 },
  // Primary / Basic
  { name: "Basic 1",     level: "primary",   order: 3 },
  { name: "Basic 2",     level: "primary",   order: 4 },
  { name: "Basic 3",     level: "primary",   order: 5 },
  { name: "Basic 4",     level: "primary",   order: 6 },
  { name: "Basic 5",     level: "primary",   order: 7 },
  { name: "Basic 6",     level: "primary",   order: 8 },
  // JSS
  { name: "JSS 1",       level: "secondary", order: 9  },
  { name: "JSS 2",       level: "secondary", order: 10 },
  { name: "JSS 3",       level: "secondary", order: 11 },
  // SSS
  { name: "SS 1",        level: "secondary", order: 12 },
  { name: "SS 2",        level: "secondary", order: 13 },
  { name: "SS 3",        level: "secondary", order: 14 },
];

export const CLASS_ARMS = ["A", "B", "C", "D", "E"];
export const TERMS: Term[] = ["First Term", "Second Term", "Third Term"];

// WAEC grading scale
export function computeGrade(total: number): GradeLabel {
  if (total >= 75) return "A1";
  if (total >= 70) return "B2";
  if (total >= 65) return "B3";
  if (total >= 60) return "C4";
  if (total >= 55) return "C5";
  if (total >= 50) return "C6";
  if (total >= 45) return "D7";
  if (total >= 40) return "E8";
  return "F9";
}

export function gradeRemark(grade: GradeLabel): string {
  const map: Record<GradeLabel, string> = {
    A1: "Excellent", B2: "Very Good", B3: "Good",
    C4: "Credit", C5: "Credit", C6: "Credit",
    D7: "Pass", E8: "Pass", F9: "Fail",
  };
  return map[grade];
}

export const TEACHER_REMARKS = [
  "Excellent performance. Keep it up!",
  "Very good performance. Improve on weak areas.",
  "Good performance. More effort needed.",
  "Average performance. Must work harder.",
  "Below average. Needs serious improvement.",
  "Poor performance. Parent's attention required.",
];

export const PRINCIPAL_REMARKS = [
  "A brilliant student. Keep up the good work!",
  "A good student with great potential.",
  "Satisfactory. More dedication is required.",
  "Must be more serious with studies.",
  "Performance is below expectation. See me.",
];
