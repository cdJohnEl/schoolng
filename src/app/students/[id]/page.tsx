"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Trash2, AlertCircle, User, BookOpen, Phone } from "lucide-react";
import { doc, getDoc, updateDoc, deleteDoc, getDocs, query, collection, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import Topbar from "@/components/layout/Topbar";
import { Badge, studentStatusBadge } from "@/components/ui/index";
import { formatDate, getInitials } from "@/lib/utils";
import type { Student, SchoolClass, FeePayment } from "@/types";

const INPUT = "w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder:text-gray-400 bg-white";
const LABEL = "block text-sm font-medium text-gray-700 mb-1.5";

type Tab = "profile" | "fees" | "results";

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { appUser } = useAuth();
  const router = useRouter();

  const [student, setStudent]     = useState<Student | null>(null);
  const [classes, setClasses]     = useState<SchoolClass[]>([]);
  const [fees, setFees]           = useState<FeePayment[]>([]);
  const [loading, setLoading]     = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [error, setError]         = useState("");
  const [tab, setTab]             = useState<Tab>("profile");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      getDoc(doc(db, "students", id)),
      getDocs(query(collection(db, "classes"), where("schoolId", "==", appUser?.schoolId ?? ""))),
      getDocs(query(collection(db, "feePayments"), where("studentId", "==", id))),
    ])
      .then(([studentSnap, classesSnap, feesSnap]) => {
        if (studentSnap.exists()) setStudent({ id: studentSnap.id, ...studentSnap.data() } as Student);
        setClasses(classesSnap.docs.map(d => ({ id: d.id, ...d.data() } as SchoolClass)));
        setFees(feesSnap.docs.map(d => ({ id: d.id, ...d.data() } as FeePayment)));
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, [id, appUser?.schoolId]);

  const set = (k: keyof Student, v: string) => setStudent(s => s ? { ...s, [k]: v } : s);

  const handleSave = async () => {
    if (!id || !student) return;
    setSaving(true); setError("");
    try {
      await updateDoc(doc(db, "students", id), { ...student, updatedAt: new Date().toISOString() });
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch { setError("Failed to save. Try again."); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!id) return;
    await deleteDoc(doc(db, "students", id));
    router.push("/students");
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (fetchError || !student) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-3">
      <AlertCircle className="w-8 h-8 text-gray-400" />
      <p className="text-sm text-muted-foreground">{fetchError ? "Failed to load student." : "Student not found."}</p>
      <Link href="/students" className="text-sm text-brand-600 hover:underline">← Back to students</Link>
    </div>
  );

  const className = classes.find(c => c.id === student.classId);
  const displayClass = className ? `${className.name}${className.arm ? ` ${className.arm}` : ""}` : student.classId;

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "profile", label: "Profile", icon: <User className="w-3.5 h-3.5" /> },
    { key: "fees",    label: "Fees",    icon: <BookOpen className="w-3.5 h-3.5" /> },
    { key: "results", label: "Results", icon: <Phone className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar
        title={`${student.firstName} ${student.lastName}`}
        subtitle={`${displayClass} · ${student.admissionNumber}`}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
              <Save className="w-4 h-4" />
              {saving ? "Saving…" : "Save"}
            </button>
            <Link href="/students" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
          </div>
        }
      />

      <div className="flex-1 p-6 animate-fade-in">
        <div className="max-w-3xl">

          {/* Profile card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-5 flex items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center text-lg font-bold text-brand-700 flex-shrink-0">
              {getInitials(`${student.firstName} ${student.lastName}`)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-base font-semibold text-gray-900">{student.firstName} {student.lastName}</h2>
                <Badge variant={studentStatusBadge(student.status)}>{student.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{displayClass} · {student.gender} · DOB: {formatDate(student.dateOfBirth)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Admitted {formatDate(student.admissionDate)}</p>
            </div>
          </div>

          {(error || saved) && (
            <div className={`mb-4 px-4 py-3 rounded-lg text-sm border ${saved ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
              {saved ? "Changes saved." : error}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 mb-5 border-b border-gray-200">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors
                  ${tab === t.key ? "border-brand-600 text-brand-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>

          {tab === "profile" && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Personal information</h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div><label className={LABEL}>First name</label>
                    <input className={INPUT} value={student.firstName} onChange={e => set("firstName", e.target.value)} /></div>
                  <div><label className={LABEL}>Last name</label>
                    <input className={INPUT} value={student.lastName} onChange={e => set("lastName", e.target.value)} /></div>
                  <div><label className={LABEL}>Other name</label>
                    <input className={INPUT} value={student.otherName ?? ""} onChange={e => set("otherName", e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div><label className={LABEL}>Gender</label>
                    <select className={INPUT} value={student.gender} onChange={e => set("gender", e.target.value)}>
                      <option value="male">Male</option><option value="female">Female</option>
                    </select></div>
                  <div><label className={LABEL}>Date of birth</label>
                    <input type="date" className={INPUT} value={student.dateOfBirth} onChange={e => set("dateOfBirth", e.target.value)} /></div>
                  <div><label className={LABEL}>Status</label>
                    <select className={INPUT} value={student.status} onChange={e => set("status", e.target.value)}>
                      <option value="active">Active</option>
                      <option value="graduated">Graduated</option>
                      <option value="withdrawn">Withdrawn</option>
                      <option value="suspended">Suspended</option>
                    </select></div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Class & admission</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div><label className={LABEL}>Class</label>
                    <select className={INPUT} value={student.classId} onChange={e => set("classId", e.target.value)}>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}{c.arm ? ` ${c.arm}` : ""}</option>)}
                    </select></div>
                  <div><label className={LABEL}>Admission number</label>
                    <input className={INPUT} value={student.admissionNumber} onChange={e => set("admissionNumber", e.target.value)} /></div>
                  <div><label className={LABEL}>Admission date</label>
                    <input type="date" className={INPUT} value={student.admissionDate} onChange={e => set("admissionDate", e.target.value)} /></div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Parent / guardian</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div><label className={LABEL}>Full name</label>
                    <input className={INPUT} value={student.parentName} onChange={e => set("parentName", e.target.value)} /></div>
                  <div><label className={LABEL}>Relationship</label>
                    <select className={INPUT} value={student.relationship} onChange={e => set("relationship", e.target.value)}>
                      <option value="father">Father</option><option value="mother">Mother</option><option value="guardian">Guardian</option>
                    </select></div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div><label className={LABEL}>Primary phone</label>
                    <input className={INPUT} value={student.parentPhone} onChange={e => set("parentPhone", e.target.value)} /></div>
                  <div><label className={LABEL}>Alt. phone</label>
                    <input className={INPUT} value={student.parentPhone2 ?? ""} onChange={e => set("parentPhone2", e.target.value)} /></div>
                </div>
                <div><label className={LABEL}>Home address</label>
                  <input className={INPUT} value={student.homeAddress} onChange={e => set("homeAddress", e.target.value)} /></div>
              </div>

              {/* Danger zone */}
              <div className="bg-white rounded-xl border border-red-100 p-5">
                <h3 className="text-sm font-semibold text-red-700 mb-1">Danger zone</h3>
                <p className="text-xs text-muted-foreground mb-3">Deleting a student is permanent. All fee and result records are retained.</p>
                {confirmDelete ? (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-700">Are you sure?</span>
                    <button onClick={handleDelete} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors">
                      Yes, delete
                    </button>
                    <button onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDelete(true)}
                    className="flex items-center gap-2 px-3.5 py-2 border border-red-200 hover:bg-red-50 text-sm font-medium text-red-600 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Delete student
                  </button>
                )}
              </div>
            </div>
          )}

          {tab === "fees" && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              {fees.length === 0 ? (
                <div className="py-14 text-center">
                  <p className="text-sm text-muted-foreground">No fee records for this student.</p>
                  <Link href="/fees" className="text-xs text-brand-600 hover:underline mt-2 block">Go to fee management →</Link>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50/50 border-b border-gray-100">
                    {["Term", "Expected", "Paid", "Balance", "Status"].map(h => (
                      <th key={h} className="px-5 py-2.5 text-left text-xs font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {fees.map(f => (
                      <tr key={f.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3 font-medium">{f.term}</td>
                        <td className="px-5 py-3 font-mono">₦{f.totalExpected.toLocaleString()}</td>
                        <td className="px-5 py-3 font-mono text-green-700">₦{f.totalPaid.toLocaleString()}</td>
                        <td className="px-5 py-3 font-mono text-red-600">₦{f.balance.toLocaleString()}</td>
                        <td className="px-5 py-3">
                          <Badge variant={f.status === "paid" ? "success" : f.status === "partial" ? "warning" : "danger"}>
                            {f.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {tab === "results" && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
              <p className="text-sm text-muted-foreground">Results for this student will appear here after they are entered in the Results module.</p>
              <Link href="/results" className="text-xs text-brand-600 hover:underline mt-2 block">Go to results →</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
