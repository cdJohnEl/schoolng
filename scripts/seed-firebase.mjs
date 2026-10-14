import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import fs from "fs";
import path from "path";

const credPath = path.resolve("./schoolng-de1f5-firebase-adminsdk-fbsvc-905f97c241.json");
const serviceAccount = JSON.parse(fs.readFileSync(credPath, "utf-8"));

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
}

const db = getFirestore();
const auth = getAuth();

async function seed() {
  console.log("Starting Firebase seeding for project:", serviceAccount.project_id);

  // 1. Create or ensure Auth users
  let adminUid = "";
  try {
    const adminUser = await auth.getUserByEmail("admin@schoolng.com");
    adminUid = adminUser.uid;
    console.log("Found existing admin user:", adminUid);
  } catch (e) {
    const newUser = await auth.createUser({
      email: "admin@schoolng.com",
      password: "password123",
      displayName: "Dr. Adaeze Okonkwo",
    });
    adminUid = newUser.uid;
    console.log("Created admin user:", adminUid);
  }

  // Also update password for tester@testing.com if exists
  try {
    const testerUser = await auth.getUserByEmail("tester@testing.com");
    await auth.updateUser(testerUser.uid, {
      password: "password123",
      displayName: "Demo Administrator",
    });
    console.log("Updated tester@testing.com password to password123");
  } catch (e) {
    console.log("tester user not found or error:", e.message);
  }

  const schoolId = "school_brightstar";

  // 2. Users Collection
  const users = [
    {
      uid: adminUid,
      email: "admin@schoolng.com",
      displayName: "Dr. Adaeze Okonkwo",
      schoolId,
      role: "proprietor",
      createdAt: new Date().toISOString(),
    },
    {
      uid: "T1G7hDs4DEMBYMngjZQtv0QbbSu2",
      email: "tester@testing.com",
      displayName: "Demo Administrator",
      schoolId,
      role: "proprietor",
      createdAt: new Date().toISOString(),
    },
  ];

  for (const u of users) {
    await db.collection("users").doc(u.uid).set(u, { merge: true });
  }
  console.log("Seeded users");

  // 3. School document
  const school = {
    id: schoolId,
    name: "Brightstar International Academy",
    motto: "Knowledge, Character, and Excellence",
    address: "25 Admiralty Way, Lekki Phase 1, Lagos State, Nigeria",
    phone: "0803 456 7890",
    email: "info@brightstar.edu.ng",
    ownerId: adminUid,
    plan: "growth",
    subscriptionStatus: "active",
    createdAt: new Date().toISOString(),
  };
  await db.collection("schools").doc(schoolId).set(school, { merge: true });
  console.log("Seeded school");

  // 4. Academic Session
  const sessionId = "sess_2025_2026";
  const session = {
    id: sessionId,
    schoolId,
    name: "2025/2026",
    currentTerm: "First Term",
    startDate: "2025-09-08",
    endDate: "2026-07-24",
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  await db.collection("sessions").doc(sessionId).set(session, { merge: true });
  console.log("Seeded academic session");

  // 5. Classes
  const classDefs = [
    { id: "cls_jss1a", name: "JSS 1", arm: "A", level: "secondary", order: 9 },
    { id: "cls_jss1b", name: "JSS 1", arm: "B", level: "secondary", order: 9 },
    { id: "cls_jss2a", name: "JSS 2", arm: "A", level: "secondary", order: 10 },
    { id: "cls_jss3a", name: "JSS 3", arm: "A", level: "secondary", order: 11 },
    { id: "cls_ss1a",  name: "SS 1",  arm: "A", level: "secondary", order: 12 },
    { id: "cls_ss2a",  name: "SS 2",  arm: "A", level: "secondary", order: 13 },
    { id: "cls_ss3a",  name: "SS 3",  arm: "A", level: "secondary", order: 14 },
  ];

  for (const c of classDefs) {
    await db.collection("classes").doc(c.id).set({
      ...c,
      schoolId,
      subjectIds: [],
    }, { merge: true });
  }
  console.log("Seeded classes");

  // 6. Subjects
  const allClassIds = classDefs.map(c => c.id);
  const subjectDefs = [
    { id: "sub_mth", name: "Mathematics", code: "MTH", classIds: allClassIds },
    { id: "sub_eng", name: "English Language", code: "ENG", classIds: allClassIds },
    { id: "sub_bsc", name: "Basic Science", code: "BSC", classIds: ["cls_jss1a", "cls_jss1b", "cls_jss2a", "cls_jss3a"] },
    { id: "sub_civ", name: "Civic Education", code: "CIV", classIds: allClassIds },
    { id: "sub_phy", name: "Physics", code: "PHY", classIds: ["cls_ss1a", "cls_ss2a", "cls_ss3a"] },
    { id: "sub_chm", name: "Chemistry", code: "CHM", classIds: ["cls_ss1a", "cls_ss2a", "cls_ss3a"] },
    { id: "sub_bio", name: "Biology", code: "BIO", classIds: ["cls_ss1a", "cls_ss2a", "cls_ss3a"] },
    { id: "sub_eco", name: "Economics", code: "ECO", classIds: ["cls_ss1a", "cls_ss2a", "cls_ss3a"] },
  ];

  for (const s of subjectDefs) {
    await db.collection("subjects").doc(s.id).set({
      ...s,
      schoolId,
    }, { merge: true });
  }
  console.log("Seeded subjects");

  // 7. Students
  const studentDefs = [
    {
      id: "std_001",
      admissionNumber: "BIA/2025/001",
      firstName: "Chinedu",
      lastName: "Okafor",
      gender: "male",
      dateOfBirth: "2013-05-14",
      classId: "cls_jss1a",
      parentName: "Mr. Chukwuma Okafor",
      parentPhone: "0803 111 2233",
      parentEmail: "chuks.okafor@gmail.com",
      relationship: "father",
      homeAddress: "12 Bode Thomas Street, Surulere, Lagos",
    },
    {
      id: "std_002",
      admissionNumber: "BIA/2025/002",
      firstName: "Fatima",
      lastName: "Abubakar",
      gender: "female",
      dateOfBirth: "2013-08-20",
      classId: "cls_jss1a",
      parentName: "Hajiya Zainab Abubakar",
      parentPhone: "0802 333 4455",
      parentEmail: "zainab.abubakar@yahoo.com",
      relationship: "mother",
      homeAddress: "45 Bourdillon Road, Ikoyi, Lagos",
    },
    {
      id: "std_003",
      admissionNumber: "BIA/2025/003",
      firstName: "Babatunde",
      lastName: "Adeyemi",
      gender: "male",
      dateOfBirth: "2012-11-03",
      classId: "cls_jss1a",
      parentName: "Dr. Olumide Adeyemi",
      parentPhone: "0805 777 8899",
      parentEmail: "olumide.adeyemi@consult.ng",
      relationship: "father",
      homeAddress: "8 Isaac John Street, GRA Ikeja, Lagos",
    },
    {
      id: "std_004",
      admissionNumber: "BIA/2025/004",
      firstName: "Ngozi",
      lastName: "Eze",
      gender: "female",
      dateOfBirth: "2013-02-17",
      classId: "cls_jss1a",
      parentName: "Mrs. Ifeoma Eze",
      parentPhone: "0809 222 3344",
      relationship: "mother",
      homeAddress: "22 Marine Road, Apapa, Lagos",
    },
    {
      id: "std_005",
      admissionNumber: "BIA/2025/005",
      firstName: "Emmanuel",
      lastName: "Danjuma",
      gender: "male",
      dateOfBirth: "2012-09-12",
      classId: "cls_jss1a",
      parentName: "Col. Yakubu Danjuma (Rtd)",
      parentPhone: "0806 888 9900",
      relationship: "father",
      homeAddress: "5 Victoria Garden City, Lekki, Lagos",
    },
    {
      id: "std_006",
      admissionNumber: "BIA/2024/015",
      firstName: "Amina",
      lastName: "Bello",
      gender: "female",
      dateOfBirth: "2011-04-09",
      classId: "cls_jss2a",
      parentName: "Alhaji Musa Bello",
      parentPhone: "0803 555 6677",
      relationship: "father",
      homeAddress: "16 Opebi Road, Ikeja, Lagos",
    },
    {
      id: "std_007",
      admissionNumber: "BIA/2023/020",
      firstName: "Kelechi",
      lastName: "Nwachukwu",
      gender: "male",
      dateOfBirth: "2009-07-25",
      classId: "cls_ss1a",
      parentName: "Chief Patrick Nwachukwu",
      parentPhone: "0802 444 5566",
      relationship: "father",
      homeAddress: "3 Banana Island Road, Ikoyi, Lagos",
    },
    {
      id: "std_008",
      admissionNumber: "BIA/2022/008",
      firstName: "Zainab",
      lastName: "Ogunleye",
      gender: "female",
      dateOfBirth: "2008-12-01",
      classId: "cls_ss2a",
      parentName: "Engr. Femi Ogunleye",
      parentPhone: "0807 111 9922",
      relationship: "father",
      homeAddress: "10 Agungi Road, Lekki, Lagos",
    },
  ];

  for (const s of studentDefs) {
    await db.collection("students").doc(s.id).set({
      ...s,
      schoolId,
      sessionId,
      status: "active",
      admissionDate: "2025-09-10",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  }
  console.log("Seeded students");

  // 8. Fee Structures
  const feeItems = [
    { category: "tuition", label: "Tuition Fee", amount: 75000, mandatory: true },
    { category: "books", label: "Books & Stationery", amount: 15000, mandatory: true },
    { category: "development", label: "Development Levy", amount: 10000, mandatory: true },
    { category: "exam", label: "Examination Levy", amount: 5000, mandatory: true },
  ];
  const totalAmount = feeItems.reduce((acc, i) => acc + i.amount, 0);

  for (const c of classDefs) {
    const key = `${c.id}_First Term`;
    await db.collection("feeStructures").doc(key).set({
      id: key,
      schoolId,
      sessionId,
      classId: c.id,
      term: "First Term",
      items: feeItems,
      totalAmount,
      createdAt: new Date().toISOString(),
    }, { merge: true });
  }
  console.log("Seeded fee structures");

  // 9. Fee Payments
  const feePayments = [
    {
      id: "pay_001",
      studentId: "std_001",
      classId: "cls_jss1a",
      totalExpected: totalAmount,
      totalPaid: totalAmount,
      balance: 0,
      status: "paid",
      transactions: [{
        id: "tx_1", date: "2025-09-12T10:00:00.000Z",
        amount: totalAmount, method: "bank_transfer", reference: "TRX-998811",
        receivedBy: "Mrs. Folake Bursar", note: "Full First Term Payment"
      }],
    },
    {
      id: "pay_002",
      studentId: "std_002",
      classId: "cls_jss1a",
      totalExpected: totalAmount,
      totalPaid: 60000,
      balance: 45000,
      status: "partial",
      transactions: [{
        id: "tx_2", date: "2025-09-15T11:30:00.000Z",
        amount: 60000, method: "bank_transfer", reference: "TRX-776655",
        receivedBy: "Mrs. Folake Bursar", note: "Part payment, balance in Oct"
      }],
    },
    {
      id: "pay_003",
      studentId: "std_003",
      classId: "cls_jss1a",
      totalExpected: totalAmount,
      totalPaid: totalAmount,
      balance: 0,
      status: "paid",
      transactions: [{
        id: "tx_3", date: "2025-09-10T09:15:00.000Z",
        amount: totalAmount, method: "pos", reference: "POS-104928",
        receivedBy: "Mrs. Folake Bursar", note: "Card payment at school reception"
      }],
    },
    {
      id: "pay_004",
      studentId: "std_004",
      classId: "cls_jss1a",
      totalExpected: totalAmount,
      totalPaid: 0,
      balance: totalAmount,
      status: "unpaid",
      transactions: [],
    },
  ];

  for (const fp of feePayments) {
    await db.collection("feePayments").doc(fp.id).set({
      ...fp,
      schoolId,
      sessionId,
      term: "First Term",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  }
  console.log("Seeded fee payments");

  // 10. Attendance Record
  const today = new Date().toISOString().split("T")[0];
  const attendanceDocId = `${schoolId}_cls_jss1a_${today}`;
  await db.collection("attendance").doc(attendanceDocId).set({
    id: attendanceDocId,
    schoolId,
    classId: "cls_jss1a",
    sessionId,
    term: "First Term",
    date: today,
    markedBy: adminUid,
    entries: [
      { studentId: "std_001", status: "present", note: "" },
      { studentId: "std_002", status: "present", note: "" },
      { studentId: "std_003", status: "late", note: "Traffic on Lekki Expressway" },
      { studentId: "std_004", status: "present", note: "" },
      { studentId: "std_005", status: "excused", note: "Dental appointment" },
    ],
    createdAt: new Date().toISOString(),
  }, { merge: true });
  console.log("Seeded attendance");

  // 11. Subject Results
  const resultData = [
    { studentId: "std_001", subjectId: "sub_mth", subjectName: "Mathematics", ca: 36, exam: 54 },
    { studentId: "std_001", subjectId: "sub_eng", subjectName: "English Language", ca: 32, exam: 50 },
    { studentId: "std_001", subjectId: "sub_bsc", subjectName: "Basic Science", ca: 35, exam: 55 },
    { studentId: "std_002", subjectId: "sub_mth", subjectName: "Mathematics", ca: 30, exam: 48 },
    { studentId: "std_002", subjectId: "sub_eng", subjectName: "English Language", ca: 37, exam: 56 },
    { studentId: "std_002", subjectId: "sub_bsc", subjectName: "Basic Science", ca: 31, exam: 51 },
    { studentId: "std_003", subjectId: "sub_mth", subjectName: "Mathematics", ca: 28, exam: 42 },
    { studentId: "std_003", subjectId: "sub_eng", subjectName: "English Language", ca: 29, exam: 45 },
    { studentId: "std_003", subjectId: "sub_bsc", subjectName: "Basic Science", ca: 27, exam: 44 },
    { studentId: "std_004", subjectId: "sub_mth", subjectName: "Mathematics", ca: 34, exam: 51 },
    { studentId: "std_004", subjectId: "sub_eng", subjectName: "English Language", ca: 35, exam: 53 },
    { studentId: "std_004", subjectId: "sub_bsc", subjectName: "Basic Science", ca: 33, exam: 52 },
    { studentId: "std_005", subjectId: "sub_mth", subjectName: "Mathematics", ca: 25, exam: 38 },
    { studentId: "std_005", subjectId: "sub_eng", subjectName: "English Language", ca: 27, exam: 41 },
    { studentId: "std_005", subjectId: "sub_bsc", subjectName: "Basic Science", ca: 26, exam: 40 },
  ];

  function getGrade(total) {
    if (total >= 75) return { grade: "A1", remark: "Excellent" };
    if (total >= 70) return { grade: "B2", remark: "Very Good" };
    if (total >= 65) return { grade: "B3", remark: "Good" };
    if (total >= 60) return { grade: "C4", remark: "Credit" };
    if (total >= 55) return { grade: "C5", remark: "Credit" };
    if (total >= 50) return { grade: "C6", remark: "Credit" };
    if (total >= 45) return { grade: "D7", remark: "Pass" };
    if (total >= 40) return { grade: "E8", remark: "Pass" };
    return { grade: "F9", remark: "Fail" };
  }

  for (const r of resultData) {
    const total = r.ca + r.exam;
    const { grade, remark } = getGrade(total);
    const docId = `${schoolId}_${r.studentId}_${r.subjectId}_First Term`;
    await db.collection("subjectResults").doc(docId).set({
      id: docId,
      schoolId,
      studentId: r.studentId,
      classId: "cls_jss1a",
      subjectId: r.subjectId,
      subjectName: r.subjectName,
      sessionId,
      term: "First Term",
      ca: r.ca,
      exam: r.exam,
      total,
      grade,
      remark,
      createdAt: new Date().toISOString(),
    }, { merge: true });
  }
  console.log("Seeded results");

  // 12. Staff
  const staffMembers = [
    {
      id: "stf_001",
      firstName: "Babajide",
      lastName: "Sanusi",
      email: "b.sanusi@brightstar.edu.ng",
      phone: "0803 777 1122",
      role: "teacher",
      status: "active",
      qualification: "B.Sc (Ed) Mathematics",
      subjectIds: ["sub_mth"],
      classIds: ["cls_jss1a", "cls_jss1b", "cls_jss2a"],
      joinDate: "2023-01-15",
    },
    {
      id: "stf_002",
      firstName: "Chinelo",
      lastName: "Obi",
      email: "c.obi@brightstar.edu.ng",
      phone: "0802 888 2233",
      role: "teacher",
      status: "active",
      qualification: "B.A (Ed) English Literature",
      subjectIds: ["sub_eng"],
      classIds: ["cls_jss1a", "cls_jss1b", "cls_ss1a"],
      joinDate: "2022-09-01",
    },
    {
      id: "stf_003",
      firstName: "Folake",
      lastName: "Alabi",
      email: "f.alabi@brightstar.edu.ng",
      phone: "0805 999 3344",
      role: "bursar",
      status: "active",
      qualification: "HND Accounting, ACA",
      subjectIds: [],
      classIds: [],
      joinDate: "2021-08-10",
    },
  ];

  for (const st of staffMembers) {
    await db.collection("staff").doc(st.id).set({
      ...st,
      schoolId,
      createdAt: new Date().toISOString(),
    }, { merge: true });
  }
  console.log("Seeded staff");

  // 13. Messages
  const messages = [
    {
      id: "msg_001",
      schoolId,
      type: "in_app",
      target: "all",
      body: "Welcome to First Term 2025/2026 academic session! Resumption time is strictly 7:45 AM. School bus begins operation immediately.",
      sentBy: adminUid,
      recipientCount: 8,
      status: "sent",
      createdAt: "2025-09-08T07:30:00.000Z",
    },
    {
      id: "msg_002",
      schoolId,
      type: "in_app",
      target: "debtors",
      body: "Dear Parent, this is a gentle reminder that outstanding school fees for the term are due this Friday. Please clear via bank transfer or bursary POS.",
      sentBy: adminUid,
      recipientCount: 2,
      status: "sent",
      createdAt: "2025-09-18T12:00:00.000Z",
    },
  ];

  for (const m of messages) {
    await db.collection("messages").doc(m.id).set(m, { merge: true });
  }
  console.log("Seeded messages");

  console.log("✅ Seeding completed successfully!");
}

seed().catch(err => {
  console.error("Seeding error:", err);
  process.exit(1);
});
