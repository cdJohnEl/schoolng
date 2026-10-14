"use client";

import { useState, useEffect, useRef } from "react";
import { FileText, Printer, Users, WifiOff, ChevronDown } from "lucide-react";
import { collection, query, where, getDocs, orderBy, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import Topbar from "@/components/layout/Topbar";
import { EmptyState, Badge, gradeBadge } from "@/components/ui/index";
import { getInitials, formatDate, ordinal } from "@/lib/utils";
import { TERMS, computeGrade, gradeRemark, TEACHER_REMARKS, PRINCIPAL_REMARKS } from "@/types";
import type { SchoolClass, Student, School } from "@/types";

interface SubjectScore {
  subjectName: string;
  ca: number; exam: number; total: number; grade: string; remark: string;
  position: number;
}

interface StudentReport {
  student: Student;
  scores: SubjectScore[];
  average: number;
  position: number;
}

export default function ReportCardsPage() {
  const { appUser } = useAuth();
  const schoolId = appUser?.schoolId ?? "";
  const printRef = useRef<HTMLDivElement>(null);

  const [school, setSchool]           = useState<School | null>(null);
  const [classes, setClasses]         = useState<SchoolClass[]>([]);
  const [classId, setClassId]         = useState("");
  const [term, setTerm]               = useState<string>(TERMS[0]);
  const [reports, setReports]         = useState<StudentReport[]>([]);
  const [selected, setSelected]       = useState<StudentReport | null>(null);
  const [loading, setLoading]         = useState(false);
  const [fetchError, setFetchError]   = useState(false);
  const [nextTermDate, setNextTermDate] = useState("");

  useEffect(() => {
    if (!schoolId) return;
    Promise.all([
      getDocs(query(collection(db, "classes"), where("schoolId", "==", schoolId))),
      getDoc(doc(db, "schools", schoolId)),
    ])
      .then(([cls, schoolSnap]) => {
        const c = cls.docs
          .map(d => ({ id: d.id, ...d.data() } as SchoolClass))
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setClasses(c);
        if (c.length > 0) setClassId(c[0].id);
        if (schoolSnap.exists()) setSchool(schoolSnap.data() as School);
      })
      .catch(() => setFetchError(true));
  }, [schoolId]);

  const loadReports = async () => {
    if (!classId) return;
    setLoading(true); setFetchError(false);
    try {
      const [studentsSnap, scoresSnap] = await Promise.all([
        getDocs(query(collection(db, "students"), where("schoolId", "==", schoolId), where("classId", "==", classId), where("status", "==", "active"))),
        getDocs(query(collection(db, "subjectResults"), where("schoolId", "==", schoolId), where("classId", "==", classId), where("term", "==", term))),
      ]);

      const students = studentsSnap.docs
        .map(d => ({ id: d.id, ...d.data() } as Student))
        .sort((a, b) => (a.lastName || "").localeCompare(b.lastName || ""));
      const allScores = scoresSnap.docs.map(d => d.data() as {
        studentId: string;
        subjectName: string;
        ca: number;
        exam: number;
        total: number;
        grade?: string;
        remark?: string;
      });

      const studentReports: StudentReport[] = students.map(student => {
        const studentScores = allScores
          .filter(s => s.studentId === student.id)
          .map(s => ({
            subjectName: s.subjectName,
            ca: s.ca, exam: s.exam, total: s.total,
            grade: s.grade || computeGrade(s.total),
            remark: s.remark || gradeRemark(computeGrade(s.total)),
            position: 0,
          }));
        const total = studentScores.reduce((sum, s) => sum + s.total, 0);
        const average = studentScores.length > 0 ? total / studentScores.length : 0;
        return { student, scores: studentScores, average, position: 0 };
      });

      // Compute overall class position
      const sorted = [...studentReports].sort((a, b) => b.average - a.average);
      sorted.forEach((r, i) => { r.position = i + 1; });

      // Compute per-subject position across the class
      const subjectNames = Array.from(new Set(allScores.map(s => s.subjectName)));
      subjectNames.forEach(subName => {
        const subScores = studentReports
          .map(r => ({ report: r, score: r.scores.find(s => s.subjectName === subName) }))
          .filter(x => x.score);
        subScores.sort((a, b) => (b.score?.total ?? 0) - (a.score?.total ?? 0));
        subScores.forEach(({ score }, i) => { if (score) score.position = i + 1; });
      });

      setReports(studentReports);
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = (report: StudentReport) => {
    setSelected(report);
    setTimeout(() => {
      const content = printRef.current?.innerHTML;
      if (!content) return;
      const w = window.open("", "_blank");
      if (!w) return;
      w.document.write(`<!DOCTYPE html><html><head>
        <title>Report Card — ${report.student.firstName} ${report.student.lastName}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; font-size: 12px; padding: 20px; color: #111; }
          .header { text-align: center; border-bottom: 2px solid #4338ca; padding-bottom: 12px; margin-bottom: 16px; }
          .school-name { font-size: 18px; font-weight: bold; color: #4338ca; }
          .motto { font-size: 11px; color: #666; font-style: italic; margin-top: 2px; }
          .student-info { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; background: #f8f8ff; padding: 12px; border-radius: 6px; }
          .info-item { display: flex; gap: 6px; } .info-label { font-weight: bold; min-width: 100px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 11px; }
          th { background: #4338ca; color: white; padding: 6px 8px; text-align: left; }
          td { padding: 5px 8px; border-bottom: 1px solid #eee; }
          tr:nth-child(even) td { background: #f9f9ff; }
          .total-row td { font-weight: bold; background: #eef2ff !important; }
          .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 16px; }
          .summary-box { text-align: center; border: 1px solid #e0e7ff; border-radius: 6px; padding: 8px; }
          .summary-label { font-size: 10px; color: #666; }
          .summary-value { font-size: 16px; font-weight: bold; color: #4338ca; }
          .remarks { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
          .remark-box { border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px; }
          .remark-label { font-size: 10px; font-weight: bold; color: #666; margin-bottom: 4px; }
          .footer { text-align: center; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 8px; }
          .grade-A1,.grade-B2,.grade-B3 { color: green; font-weight: bold; }
          .grade-C4,.grade-C5,.grade-C6 { color: blue; font-weight: bold; }
          .grade-D7,.grade-E8 { color: orange; font-weight: bold; }
          .grade-F9 { color: red; font-weight: bold; }
        </style>
      </head><body>${content}</body></html>`);
      w.document.close(); w.focus();
      setTimeout(() => { w.print(); w.close(); }, 300);
    }, 100);
  };

  const cls = classes.find(c => c.id === classId);
  const className = cls ? `${cls.name}${cls.arm ? ` ${cls.arm}` : ""}` : "";

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Report cards" subtitle="Generate and print term report cards" />

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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Class</label>
              <select value={classId} onChange={e => setClassId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}{c.arm ? ` ${c.arm}` : ""}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Term</label>
              <select value={term} onChange={e => setTerm(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                {TERMS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Next term begins</label>
              <input type="date" value={nextTermDate} onChange={e => setNextTermDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <button onClick={loadReports} disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
              <FileText className="w-4 h-4" />
              {loading ? "Loading…" : "Load report cards"}
            </button>
          </div>
        </div>

        {/* Report cards list */}
        {reports.length === 0 && !loading ? (
          <div className="bg-white rounded-xl border border-gray-100">
            <EmptyState icon={FileText} title="No report cards yet"
              description="Select a class and term, then click 'Load report cards'. Make sure results have been entered first." />
          </div>
        ) : loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">{className} — {term}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{reports.length} students · click any row to preview and print</p>
                </div>
                <button onClick={() => reports.forEach((r, i) => setTimeout(() => handlePrint(r), i * 500))}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 hover:bg-gray-50 text-sm text-gray-700 rounded-lg transition-colors">
                  <Printer className="w-3.5 h-3.5" /> Print all ({reports.length})
                </button>
              </div>
              <div className="divide-y divide-gray-100">
                {reports.map(r => (
                  <div key={r.student.id}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handlePrint(r)}>
                    <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-xs font-semibold text-brand-700 flex-shrink-0">
                      {getInitials(`${r.student.firstName} ${r.student.lastName}`)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{r.student.lastName}, {r.student.firstName}</p>
                      <p className="text-xs text-muted-foreground">{r.student.admissionNumber} · {r.scores.length} subjects</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Average</p>
                        <p className="font-semibold font-mono text-gray-900">{r.average.toFixed(1)}%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Position</p>
                        <p className="font-semibold text-brand-700">{ordinal(r.position)}</p>
                      </div>
                      <Badge variant={r.average >= 70 ? "success" : r.average >= 50 ? "info" : "danger"}>
                        {computeGrade(r.average)}
                      </Badge>
                    </div>
                    <Printer className="w-4 h-4 text-gray-400" />
                  </div>
                ))}
              </div>
            </div>

            {/* Hidden print template */}
            {selected && (
              <div ref={printRef} style={{ display: "none" }}>
                <div className="header">
                  <div className="school-name">{school?.name ?? "My School"}</div>
                  <div className="motto">{school?.motto ?? ""}</div>
                  <div style={{ fontSize: "11px", marginTop: "4px" }}>{school?.address}</div>
                  <div style={{ fontSize: "13px", fontWeight: "bold", marginTop: "6px", color: "#4338ca" }}>
                    STUDENT REPORT CARD — {term.toUpperCase()}
                  </div>
                </div>

                <div className="student-info">
                  {[
                    ["Student name:", `${selected.student.lastName}, ${selected.student.firstName} ${selected.student.otherName ?? ""}`],
                    ["Admission no.:", selected.student.admissionNumber],
                    ["Class:", className],
                    ["Gender:", selected.student.gender],
                    ["Position:", `${ordinal(selected.position)} out of ${reports.length}`],
                    ["Average:", `${selected.average.toFixed(1)}%`],
                  ].map(([label, value]) => (
                    <div key={label} className="info-item">
                      <span className="info-label">{label}</span>
                      <span>{value}</span>
                    </div>
                  ))}
                </div>

                <table>
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>CA (40)</th>
                      <th>Exam (60)</th>
                      <th>Total (100)</th>
                      <th>Grade</th>
                      <th>Position</th>
                      <th>Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.scores.map(s => (
                      <tr key={s.subjectName}>
                        <td>{s.subjectName}</td>
                        <td style={{ textAlign: "center" }}>{s.ca}</td>
                        <td style={{ textAlign: "center" }}>{s.exam}</td>
                        <td style={{ textAlign: "center", fontWeight: "bold" }}>{s.total}</td>
                        <td style={{ textAlign: "center" }} className={`grade-${s.grade}`}>{s.grade}</td>
                        <td style={{ textAlign: "center" }}>{s.position > 0 ? ordinal(s.position) : "—"}</td>
                        <td>{s.remark}</td>
                      </tr>
                    ))}
                    <tr className="total-row">
                      <td>Average</td>
                      <td colSpan={2}></td>
                      <td style={{ textAlign: "center" }}>{selected.average.toFixed(1)}</td>
                      <td style={{ textAlign: "center" }} className={`grade-${computeGrade(selected.average)}`}>{computeGrade(selected.average)}</td>
                      <td>{gradeRemark(computeGrade(selected.average))}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="summary">
                  {[
                    ["Position", `${ordinal(selected.position)} / ${reports.length}`],
                    ["Average", `${selected.average.toFixed(1)}%`],
                    ["Subjects", String(selected.scores.length)],
                    ["Overall grade", computeGrade(selected.average)],
                  ].map(([label, value]) => (
                    <div key={label} className="summary-box">
                      <div className="summary-label">{label}</div>
                      <div className="summary-value">{value}</div>
                    </div>
                  ))}
                </div>

                <div className="remarks">
                  <div className="remark-box">
                    <div className="remark-label">CLASS TEACHER&apos;S REMARK</div>
                    <div>{TEACHER_REMARKS[Math.min(Math.floor((100 - selected.average) / 17), TEACHER_REMARKS.length - 1)]}</div>
                    <div style={{ marginTop: "16px", borderTop: "1px solid #eee", paddingTop: "8px", fontSize: "10px", color: "#999" }}>
                      Signature: _________________ Date: _____________
                    </div>
                  </div>
                  <div className="remark-box">
                    <div className="remark-label">PRINCIPAL&apos;S REMARK</div>
                    <div>{PRINCIPAL_REMARKS[Math.min(Math.floor((100 - selected.average) / 20), PRINCIPAL_REMARKS.length - 1)]}</div>
                    <div style={{ marginTop: "16px", borderTop: "1px solid #eee", paddingTop: "8px", fontSize: "10px", color: "#999" }}>
                      Signature: _________________ Date: _____________
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: "center", padding: "8px", background: "#eef2ff", borderRadius: "6px", marginBottom: "12px", fontSize: "12px", fontWeight: "bold" }}>
                  Next term begins: {nextTermDate ? formatDate(nextTermDate) : "___________________"}
                </div>

                <div className="footer">
                  This report card is computer-generated. · {school?.name} · {new Date().getFullYear()}
                </div>
              </div>
            )}
          </>
        )}

        {/* Grading key */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">WAEC grading scale reference</h3>
          <div className="flex flex-wrap gap-2">
            {[
              { grade: "A1", range: "75–100", color: "text-green-700 bg-green-50" },
              { grade: "B2", range: "70–74",  color: "text-green-700 bg-green-50" },
              { grade: "B3", range: "65–69",  color: "text-green-700 bg-green-50" },
              { grade: "C4", range: "60–64",  color: "text-blue-700 bg-blue-50" },
              { grade: "C5", range: "55–59",  color: "text-blue-700 bg-blue-50" },
              { grade: "C6", range: "50–54",  color: "text-blue-700 bg-blue-50" },
              { grade: "D7", range: "45–49",  color: "text-amber-700 bg-amber-50" },
              { grade: "E8", range: "40–44",  color: "text-amber-700 bg-amber-50" },
              { grade: "F9", range: "0–39",   color: "text-red-700 bg-red-50" },
            ].map(g => (
              <div key={g.grade} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${g.color}`}>
                <span className="font-bold">{g.grade}</span> = {g.range}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
