"use client";

import { useState, useEffect } from "react";
import { CalendarCheck, Check, X, Clock, AlertCircle, Save, WifiOff } from "lucide-react";
import {
  collection, query, where, getDocs, addDoc, orderBy, doc, setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import Topbar from "@/components/layout/Topbar";
import { EmptyState } from "@/components/ui/index";
import { getInitials } from "@/lib/utils";
import { TERMS } from "@/types";
import { useSchool } from "@/hooks/useSchool";
import type { SchoolClass, Student, AttendanceStatus } from "@/types";
import { toast } from "@/components/ui/Toast";

interface AttendanceRow { student: Student; status: AttendanceStatus; note: string; }

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; icon: React.ReactNode; color: string }[] = [
  { value: "present", label: "P", icon: <Check className="w-3 h-3" />,        color: "bg-green-100 text-green-700 border-green-200" },
  { value: "absent",  label: "A", icon: <X className="w-3 h-3" />,            color: "bg-red-100 text-red-700 border-red-200" },
  { value: "late",    label: "L", icon: <Clock className="w-3 h-3" />,        color: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "excused", label: "E", icon: <AlertCircle className="w-3 h-3" />,  color: "bg-blue-100 text-blue-700 border-blue-200" },
];

export default function AttendancePage() {
  const { appUser } = useAuth();
  const { session } = useSchool();
  const schoolId = appUser?.schoolId ?? "";

  const [classes, setClasses]       = useState<SchoolClass[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDate, setSelectedDate]   = useState(new Date().toISOString().split("T")[0]);
  const [selectedTerm, setSelectedTerm]   = useState<string>(TERMS[0]);
  const [rows, setRows]             = useState<AttendanceRow[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    if (!schoolId) return;
    getDocs(query(collection(db, "classes"), where("schoolId", "==", schoolId), orderBy("order", "asc")))
      .then(snap => {
        const cls = snap.docs.map(d => ({ id: d.id, ...d.data() } as SchoolClass));
        setClasses(cls);
        if (cls.length > 0) setSelectedClass(cls[0].id);
      })
      .catch(() => setFetchError(true));
  }, [schoolId]);

  useEffect(() => {
    if (!selectedClass || !schoolId) return;
    setLoadingStudents(true); setFetchError(false);
    getDocs(query(
      collection(db, "students"),
      where("schoolId", "==", schoolId),
      where("classId", "==", selectedClass),
      where("status", "==", "active"),
      orderBy("lastName", "asc"),
    ))
      .then(snap => {
        const students = snap.docs.map(d => ({ id: d.id, ...d.data() } as Student));
        setRows(students.map(s => ({ student: s, status: "present", note: "" })));
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoadingStudents(false));
  }, [selectedClass, schoolId]);

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setRows(prev => prev.map(r => r.student.id === studentId ? { ...r, status } : r));
  };

  const handleSave = async () => {
    if (!selectedClass || rows.length === 0) return;
    setSaving(true);
    try {
      const docId = `${schoolId}_${selectedClass}_${selectedDate}`;
      await setDoc(doc(db, "attendance", docId), {
        id: docId, schoolId, classId: selectedClass,
        sessionId: session?.id ?? "", term: selectedTerm, date: selectedDate,
        markedBy: appUser?.uid ?? "",
        entries: rows.map(r => ({ studentId: r.student.id, status: r.status, note: r.note })),
        createdAt: new Date().toISOString(),
      });
      toast("Attendance saved successfully");
    } catch {
      toast("Failed to save attendance", "error");
    } finally {
      setSaving(false);
    }
  };

  const counts = {
    present: rows.filter(r => r.status === "present").length,
    absent:  rows.filter(r => r.status === "absent").length,
    late:    rows.filter(r => r.status === "late").length,
  };

  const cls = classes.find(c => c.id === selectedClass);
  const className = cls ? `${cls.name}${cls.arm ? ` ${cls.arm}` : ""}` : "";

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Attendance" subtitle="Mark daily class register"
        actions={
          rows.length > 0 && (
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
              <Save className="w-4 h-4" />
              {saving ? "Saving…" : "Save attendance"}
            </button>
          )
        }
      />

      <div className="flex-1 p-6 space-y-5 animate-fade-in">

        {fetchError && (
          <div className="flex items-center gap-3 px-4 py-3.5 bg-red-50 border border-red-200 rounded-xl text-sm">
            <WifiOff className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span className="text-red-700 flex-1">Failed to load data.</span>
            <button onClick={() => window.location.reload()} className="text-red-700 font-medium underline text-xs">Retry</button>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Class</label>
              <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}{c.arm ? ` ${c.arm}` : ""}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
              <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Term</label>
              <select value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                {TERMS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex flex-col justify-end">
              {rows.length > 0 && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-green-700 font-medium">{counts.present} present</span>
                  <span className="text-red-700 font-medium">{counts.absent} absent</span>
                  <span className="text-amber-700 font-medium">{counts.late} late</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {STATUS_OPTIONS.map(s => (
            <div key={s.value} className={`flex items-center gap-1.5 px-2 py-1 rounded border ${s.color}`}>
              {s.icon} {s.label} = {s.value}
            </div>
          ))}
        </div>

        {/* Register */}
        {loadingStudents ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100">
            <EmptyState icon={CalendarCheck} title="No students in this class"
              description="Add students to this class to mark attendance." />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">
                {className} — {new Date(selectedDate).toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </h2>
              <span className="text-xs text-muted-foreground">{rows.length} students</span>
            </div>
            <div className="divide-y divide-gray-100">
              {rows.map((row, idx) => (
                <div key={row.student.id} className="flex items-center gap-4 px-5 py-3">
                  <span className="text-xs text-muted-foreground w-6 text-right flex-shrink-0">{idx + 1}</span>
                  <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-xs font-semibold text-brand-700 flex-shrink-0">
                    {getInitials(`${row.student.firstName} ${row.student.lastName}`)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{row.student.lastName}, {row.student.firstName}</p>
                    <p className="text-xs text-muted-foreground">{row.student.admissionNumber}</p>
                  </div>
                  {/* Status buttons */}
                  <div className="flex items-center gap-1.5">
                    {STATUS_OPTIONS.map(s => (
                      <button key={s.value}
                        onClick={() => setStatus(row.student.id, s.value)}
                        className={`w-8 h-8 rounded-lg border text-xs font-semibold flex items-center justify-center transition-all
                          ${row.status === s.value ? s.color + " ring-1 ring-offset-1 ring-current" : "bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100"}`}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
