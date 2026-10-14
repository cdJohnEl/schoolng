"use client";

import { useState, useEffect } from "react";
import { Save, BarChart3, CheckCircle2, WifiOff, RefreshCw } from "lucide-react";
import { collection, query, where, getDocs, doc, setDoc, getDoc, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import Topbar from "@/components/layout/Topbar";
import { EmptyState, Badge, gradeBadge } from "@/components/ui/index";
import { computeGrade, gradeRemark, TERMS } from "@/types";
import { toast } from "@/components/ui/Toast";
import { useSchool } from "@/hooks/useSchool";
import type { SchoolClass, Student, Subject } from "@/types";

interface ScoreRow {
  student: Student;
  ca: string;
  exam: string;
  total: number;
  grade: string;
  hasExisting: boolean;
}

export default function ResultsPage() {
  const { appUser } = useAuth();
  const { session } = useSchool();
  const schoolId = appUser?.schoolId ?? "";

  const [classes, setClasses]     = useState<SchoolClass[]>([]);
  const [subjects, setSubjects]   = useState<Subject[]>([]);
  const [classId, setClassId]     = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [term, setTerm]           = useState<string>(TERMS[0]);
  const [rows, setRows]           = useState<ScoreRow[]>([]);
  const [loading, setLoading]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [savedOk, setSavedOk]     = useState(false);

  useEffect(() => {
    if (!schoolId) return;
    Promise.all([
      getDocs(query(collection(db, "classes"),  where("schoolId", "==", schoolId))),
      getDocs(query(collection(db, "subjects"), where("schoolId", "==", schoolId))),
    ])
      .then(([cls, subs]) => {
        const c = cls.docs
          .map(d => ({ id: d.id, ...d.data() } as SchoolClass))
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        const s = subs.docs.map(d => ({ id: d.id, ...d.data() } as Subject));
        setClasses(c);
        setSubjects(s);
        if (c.length > 0) setClassId(c[0].id);
      })
      .catch(() => setFetchError(true));
  }, [schoolId]);

  // Load students AND pre-load existing scores when class/subject/term changes
  useEffect(() => {
    if (!classId || !schoolId) return;
    setLoading(true); setRows([]);
    setFetchError(false);

    getDocs(query(
      collection(db, "students"),
      where("schoolId", "==", schoolId),
      where("classId", "==", classId),
      where("status", "==", "active"),
    ))
      .then(async snap => {
        const students = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as Student))
          .sort((a, b) => (a.lastName || "").localeCompare(b.lastName || ""));

        // Pre-load existing scores if subject is selected
        let existingMap: Record<string, { ca: number; exam: number }> = {};
        if (subjectId) {
          const existingSnap = await getDocs(query(
            collection(db, "subjectResults"),
            where("schoolId", "==", schoolId),
            where("classId", "==", classId),
            where("subjectId", "==", subjectId),
            where("term", "==", term),
          ));
          existingSnap.docs.forEach(d => {
            const data = d.data();
            existingMap[data.studentId] = { ca: data.ca ?? 0, exam: data.exam ?? 0 };
          });
        }

        setRows(students.map(s => {
          const existing = existingMap[s.id];
          const ca   = existing ? String(existing.ca)   : "";
          const exam = existing ? String(existing.exam) : "";
          const caNum   = parseFloat(ca)   || 0;
          const examNum = parseFloat(exam) || 0;
          const total = caNum + examNum;
          return {
            student: s, ca, exam, total,
            grade: total > 0 ? computeGrade(total) : "",
            hasExisting: !!existing,
          };
        }));
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, [classId, subjectId, term, schoolId]);

  // Show subjects assigned to this class, fall back to all
  const classSubjects = subjects.filter(s => s.classIds.length === 0 || s.classIds.includes(classId));

  const updateScore = (studentId: string, field: "ca" | "exam", value: string) => {
    setRows(prev => prev.map(r => {
      if (r.student.id !== studentId) return r;
      const updated = { ...r, [field]: value };
      const ca   = Math.min(40, parseFloat(updated.ca)   || 0);
      const exam = Math.min(60, parseFloat(updated.exam) || 0);
      const total = ca + exam;
      return { ...updated, total, grade: total > 0 ? computeGrade(total) : "" };
    }));
  };

  const handleSave = async () => {
    if (!classId || !subjectId || rows.length === 0) {
      toast("Select a class and subject first", "warning");
      return;
    }
    setSaving(true);
    try {
      const subjectName = subjects.find(s => s.id === subjectId)?.name ?? "";
      await Promise.all(rows.map(row => {
        const docId = `${schoolId}_${row.student.id}_${subjectId}_${term}`;
        return setDoc(doc(db, "subjectResults", docId), {
          schoolId, studentId: row.student.id, classId, subjectId, subjectName,
          sessionId: session?.id ?? "",
          term,
          ca:    parseFloat(row.ca)   || 0,
          exam:  parseFloat(row.exam) || 0,
          total: row.total,
          grade: row.grade || computeGrade(row.total),
          remark: gradeRemark(computeGrade(row.total)),
          createdAt: new Date().toISOString(),
        });
      }));
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 3000);
      // Mark all rows as existing
      setRows(prev => prev.map(r => ({ ...r, hasExisting: r.total > 0 })));
      toast(`Results saved for ${rows.length} students`);
    } catch {
      toast("Failed to save results", "error");
    } finally {
      setSaving(false);
    }
  };

  const cls = classes.find(c => c.id === classId);
  const className = cls ? `${cls.name}${cls.arm ? ` ${cls.arm}` : ""}` : "";
  const subjectName = subjects.find(s => s.id === subjectId)?.name ?? "";
  const hasAnyScores = rows.some(r => r.hasExisting);

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Results entry" subtitle="Enter CA and exam scores per class and subject"
        actions={
          rows.length > 0 && (
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
              {savedOk ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving…" : savedOk ? "Saved!" : "Save scores"}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Class</label>
              <select value={classId} onChange={e => setClassId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}{c.arm ? ` ${c.arm}` : ""}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
              <select value={subjectId} onChange={e => setSubjectId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                <option value="">Select subject…</option>
                {classSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              {classSubjects.length === 0 && classId && (
                <p className="text-xs text-amber-600 mt-1">No subjects found. Add and assign subjects in Settings.</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Term</label>
              <select value={term} onChange={e => setTerm(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                {TERMS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          {hasAnyScores && (
            <div className="mt-3 flex items-center gap-2 text-xs text-brand-700 bg-brand-50 rounded-lg px-3 py-2">
              <RefreshCw className="w-3.5 h-3.5" />
              Existing scores pre-loaded. Edit and save to update.
            </div>
          )}
        </div>

        {/* Score entry table */}
        {!subjectId ? (
          <div className="bg-white rounded-xl border border-gray-100 flex items-center justify-center py-16">
            <p className="text-sm text-muted-foreground">Select a class and subject to begin entering scores</p>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100">
            <EmptyState icon={BarChart3} title="No students in this class"
              description="Add students to this class first." />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  {className} — {subjectName}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">{term} · CA max 40 · Exam max 60 · Total 100</p>
              </div>
              <span className="text-xs text-muted-foreground">{rows.length} students</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-5 py-2.5 text-left text-xs font-medium text-muted-foreground w-8">#</th>
                    <th className="px-5 py-2.5 text-left text-xs font-medium text-muted-foreground">Student</th>
                    <th className="px-5 py-2.5 text-left text-xs font-medium text-muted-foreground w-28">CA (max 40)</th>
                    <th className="px-5 py-2.5 text-left text-xs font-medium text-muted-foreground w-28">Exam (max 60)</th>
                    <th className="px-5 py-2.5 text-left text-xs font-medium text-muted-foreground w-20">Total</th>
                    <th className="px-5 py-2.5 text-left text-xs font-medium text-muted-foreground w-20">Grade</th>
                    <th className="px-5 py-2.5 text-left text-xs font-medium text-muted-foreground w-16">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((row, idx) => (
                    <tr key={row.student.id} className={`hover:bg-gray-50 ${row.hasExisting ? "bg-green-50/20" : ""}`}>
                      <td className="px-5 py-2.5 text-xs text-muted-foreground">{idx + 1}</td>
                      <td className="px-5 py-2.5">
                        <p className="font-medium text-gray-900">{row.student.lastName}, {row.student.firstName}</p>
                        <p className="text-xs text-muted-foreground">{row.student.admissionNumber}</p>
                      </td>
                      <td className="px-5 py-2.5">
                        <input type="number" min="0" max="40" step="0.5"
                          value={row.ca} onChange={e => updateScore(row.student.id, "ca", e.target.value)}
                          placeholder="—"
                          className="w-20 px-2.5 py-1.5 rounded-lg border border-gray-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono" />
                      </td>
                      <td className="px-5 py-2.5">
                        <input type="number" min="0" max="60" step="0.5"
                          value={row.exam} onChange={e => updateScore(row.student.id, "exam", e.target.value)}
                          placeholder="—"
                          className="w-20 px-2.5 py-1.5 rounded-lg border border-gray-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono" />
                      </td>
                      <td className="px-5 py-2.5">
                        <span className={`text-sm font-semibold font-mono ${row.total >= 50 ? "text-gray-900" : row.total > 0 ? "text-red-600" : "text-gray-400"}`}>
                          {row.total > 0 ? row.total : "—"}
                        </span>
                      </td>
                      <td className="px-5 py-2.5">
                        {row.grade ? <Badge variant={gradeBadge(row.grade)}>{row.grade}</Badge> : <span className="text-xs text-gray-400">—</span>}
                      </td>
                      <td className="px-5 py-2.5">
                        {row.hasExisting
                          ? <span className="text-xs text-green-600 font-medium">Saved</span>
                          : <span className="text-xs text-gray-400">New</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
