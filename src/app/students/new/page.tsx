"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { collection, addDoc, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import Topbar from "@/components/layout/Topbar";
import { useSchool } from "@/hooks/useSchool";
import type { Student, SchoolClass } from "@/types";

const INPUT = "w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder:text-gray-400 bg-white";
const LABEL = "block text-sm font-medium text-gray-700 mb-1.5";
const SECTION = "bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-4";

export default function NewStudentPage() {
  const { appUser } = useAuth();
  const { session } = useSchool();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  const [classes, setClasses] = useState<SchoolClass[]>([]);

  const schoolId = appUser?.schoolId ?? "";

  useEffect(() => {
    if (!schoolId) return;
    getDocs(query(collection(db, "classes"), where("schoolId", "==", schoolId), orderBy("order", "asc")))
      .then(snap => setClasses(snap.docs.map(d => ({ id: d.id, ...d.data() } as SchoolClass))))
      .catch(() => {});
  }, [schoolId]);

  const [form, setForm] = useState({
    firstName: "", lastName: "", otherName: "", gender: "male",
    dateOfBirth: "", admissionNumber: "", admissionDate: new Date().toISOString().split("T")[0],
    classId: "", previousSchool: "",
    parentName: "", parentPhone: "", parentPhone2: "", parentEmail: "",
    relationship: "father", homeAddress: "",
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolId) return;
    setError(""); setSaving(true);
    try {
      const student: Omit<Student, "id"> = {
        schoolId,
        admissionNumber: form.admissionNumber,
        firstName:   form.firstName,
        lastName:    form.lastName,
        otherName:   form.otherName || undefined,
        gender:      form.gender as Student["gender"],
        dateOfBirth: form.dateOfBirth,
        classId:     form.classId,
        sessionId:   session?.id ?? "",
        status:      "active",
        admissionDate: form.admissionDate,
        previousSchool: form.previousSchool || undefined,
        parentName:  form.parentName,
        parentPhone: form.parentPhone,
        parentPhone2: form.parentPhone2 || undefined,
        parentEmail: form.parentEmail || undefined,
        relationship: form.relationship as Student["relationship"],
        homeAddress: form.homeAddress,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await addDoc(collection(db, "students"), student);
      router.push("/students");
    } catch {
      setError("Failed to save student. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Admit student" subtitle="Fill in the student&apos;s details"
        actions={
          <Link href="/students" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="flex-1 p-6 max-w-3xl animate-fade-in">
        {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

        {/* Personal details */}
        <div className={SECTION}>
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Personal information</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className={LABEL}>First name *</label>
              <input required className={INPUT} value={form.firstName} onChange={e => set("firstName", e.target.value)} placeholder="Chidi" />
            </div>
            <div>
              <label className={LABEL}>Last name *</label>
              <input required className={INPUT} value={form.lastName} onChange={e => set("lastName", e.target.value)} placeholder="Okonkwo" />
            </div>
            <div>
              <label className={LABEL}>Other name</label>
              <input className={INPUT} value={form.otherName} onChange={e => set("otherName", e.target.value)} placeholder="Emmanuel" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Gender *</label>
              <select required className={INPUT} value={form.gender} onChange={e => set("gender", e.target.value)}>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div>
              <label className={LABEL}>Date of birth *</label>
              <input required type="date" className={INPUT} value={form.dateOfBirth} onChange={e => set("dateOfBirth", e.target.value)} />
            </div>
          </div>
        </div>

        {/* Admission details */}
        <div className={SECTION}>
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Admission details</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className={LABEL}>Admission number *</label>
              <input required className={INPUT} value={form.admissionNumber} onChange={e => set("admissionNumber", e.target.value)} placeholder="BSA/2025/001" />
            </div>
            <div>
              <label className={LABEL}>Admission date *</label>
              <input required type="date" className={INPUT} value={form.admissionDate} onChange={e => set("admissionDate", e.target.value)} />
            </div>
            <div>
              <label className={LABEL}>Class *</label>
              <select required className={INPUT} value={form.classId} onChange={e => set("classId", e.target.value)}>
                <option value="">Select class…</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.arm ? ` ${c.arm}` : ""}
                  </option>
                ))}
              </select>
              {classes.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  <Link href="/settings" className="underline">Set up classes</Link> in Settings first
                </p>
              )}
            </div>
          </div>
          <div>
            <label className={LABEL}>Previous school</label>
            <input className={INPUT} value={form.previousSchool} onChange={e => set("previousSchool", e.target.value)} placeholder="Government Primary School, Lagos" />
          </div>
        </div>

        {/* Parent / guardian */}
        <div className={SECTION}>
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Parent / guardian</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className={LABEL}>Full name *</label>
              <input required className={INPUT} value={form.parentName} onChange={e => set("parentName", e.target.value)} placeholder="Mr. John Okonkwo" />
            </div>
            <div>
              <label className={LABEL}>Relationship *</label>
              <select required className={INPUT} value={form.relationship} onChange={e => set("relationship", e.target.value)}>
                <option value="father">Father</option>
                <option value="mother">Mother</option>
                <option value="guardian">Guardian</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className={LABEL}>Phone number *</label>
              <input required className={INPUT} value={form.parentPhone} onChange={e => set("parentPhone", e.target.value)} placeholder="0801 234 5678" />
            </div>
            <div>
              <label className={LABEL}>Alt. phone number</label>
              <input className={INPUT} value={form.parentPhone2} onChange={e => set("parentPhone2", e.target.value)} placeholder="0802 345 6789" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Email address</label>
              <input type="email" className={INPUT} value={form.parentEmail} onChange={e => set("parentEmail", e.target.value)} placeholder="parent@email.com" />
            </div>
            <div>
              <label className={LABEL}>Home address *</label>
              <input required className={INPUT} value={form.homeAddress} onChange={e => set("homeAddress", e.target.value)} placeholder="5 Palm Street, Lagos" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
            <Save className="w-4 h-4" />
            {saving ? "Saving…" : "Admit student"}
          </button>
          <Link href="/students" className="text-sm text-gray-500 hover:text-gray-700">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
