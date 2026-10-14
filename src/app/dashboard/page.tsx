"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users, CreditCard, CalendarCheck, AlertTriangle,
  ArrowRight, Plus, TrendingUp, CheckCircle2, Clock, WifiOff,
  ClipboardList, FileText, BookOpen, Award
} from "lucide-react";
import {
  collection, query, where, getDocs, orderBy, limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import Topbar from "@/components/layout/Topbar";
import { StatCard, SkeletonStatCard } from "@/components/ui/index";
import { formatNaira } from "@/lib/utils";
import type { FeePayment, Student, SchoolClass } from "@/types";

interface RecentStudent { id: string; name: string; className: string; date: string; }

export default function DashboardPage() {
  const { appUser, user } = useAuth();
  const schoolId = appUser?.schoolId ?? "";
  const isTeacher = appUser?.role === "teacher";

  const [studentCount, setStudentCount]   = useState<number | null>(null);
  const [classCount, setClassCount]       = useState<number | null>(null);
  const [feesCollected, setFeesCollected] = useState<number | null>(null);
  const [feesOutstanding, setFeesOutstanding] = useState<number | null>(null);
  const [debtorCount, setDebtorCount]     = useState<number | null>(null);
  const [examCount, setExamCount]         = useState<number | null>(null);
  const [recentStudents, setRecentStudents] = useState<RecentStudent[]>([]);
  const [loading, setLoading]             = useState(true);
  const [fetchError, setFetchError]       = useState(false);

  useEffect(() => {
    if (!schoolId) { setLoading(false); return; }
    setFetchError(false);

    const loadDashboard = async () => {
      try {
        // Fetch students safely with fallback
        const studentsPromise = getDocs(
          query(collection(db, "students"), where("schoolId", "==", schoolId), where("status", "==", "active"))
        ).catch((err) => {
          console.warn("Could not query active students, falling back to schoolId:", err);
          return getDocs(query(collection(db, "students"), where("schoolId", "==", schoolId)));
        }).catch((err) => {
          console.error("Students fetch failed:", err);
          return { docs: [] };
        });

        // Fetch classes safely
        const classesPromise = getDocs(
          query(collection(db, "classes"), where("schoolId", "==", schoolId))
        ).catch((err) => {
          console.error("Classes fetch failed:", err);
          return { docs: [] };
        });

        // Fetch fee payments safely (for non-teachers)
        const feesPromise = isTeacher
          ? Promise.resolve({ docs: [] })
          : getDocs(query(collection(db, "feePayments"), where("schoolId", "==", schoolId)))
              .catch((err) => {
                console.error("Fees fetch failed:", err);
                return { docs: [] };
              });

        // Fetch exams safely
        const examsPromise = getDocs(
          query(collection(db, "exams"), where("schoolId", "==", schoolId))
        ).catch((err) => {
          console.warn("Exams fetch fallback:", err);
          return { docs: [] };
        });

        const [studentsSnap, classesSnap, feesSnap, examsSnap] = await Promise.all([
          studentsPromise,
          classesPromise,
          feesPromise,
          examsPromise,
        ]);

        const studentDocs = (studentsSnap as any).docs || [];
        setStudentCount(studentDocs.length);

        const classDocs = (classesSnap as any).docs || [];
        setClassCount(classDocs.length);

        const examDocs = (examsSnap as any).docs || [];
        setExamCount(examDocs.length);

        if (!isTeacher) {
          const feeDocs = (feesSnap as any).docs || [];
          const payments = feeDocs.map((d: any) => d.data() as FeePayment);
          setFeesCollected(payments.reduce((s: number, p: FeePayment) => s + (p.totalPaid || 0), 0));
          setFeesOutstanding(payments.reduce((s: number, p: FeePayment) => s + (p.balance || 0), 0));
          setDebtorCount(payments.filter((p: FeePayment) => p.status !== "paid").length);
        }

        // Build class name map
        const classMap: Record<string, string> = {};
        classDocs.forEach((d: any) => {
          const c = d.data() as SchoolClass;
          classMap[d.id] = `${c.name}${c.arm ? ` ${c.arm}` : ""}`;
        });

        // Sort students safely
        const sortedRecent = studentDocs
          .map((d: any) => ({ id: d.id, ...d.data() } as Student))
          .sort((a: Student, b: Student) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
          .slice(0, 5);

        setRecentStudents(sortedRecent.map((s: Student) => ({
          id: s.id,
          name: `${s.firstName} ${s.lastName}`,
          className: classMap[s.classId] ?? s.classId ?? "—",
          date: s.createdAt,
        })));
      } catch (err) {
        console.error("Dashboard load error:", err);
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [schoolId, isTeacher]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar
        title={isTeacher ? `Teacher Workspace · ${greeting()} 👋` : `${greeting()}${user?.displayName ? `, ${user.displayName.split(" ")[0]}` : ""} 👋`}
        subtitle={isTeacher ? "Class records, student results, and report card portal" : "School overview & administration"}
        actions={
          <Link href="/students/new"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> Add student
          </Link>
        }
      />

      <div className="flex-1 p-6 space-y-6 animate-fade-in">

        {fetchError && (
          <div className="flex items-center gap-3 px-4 py-3.5 bg-red-50 border border-red-200 rounded-xl text-sm">
            <WifiOff className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span className="text-red-700 flex-1">Failed to load dashboard data.</span>
            <button onClick={() => window.location.reload()} className="text-red-700 font-medium underline text-xs">Retry</button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
          ) : isTeacher ? (
            <>
              <StatCard label="Total Students" value={String(studentCount ?? 0)}
                sub="in school roster" icon={Users} iconColor="text-blue-600" iconBg="bg-blue-50" />
              <StatCard label="School Classes" value={String(classCount ?? 0)}
                sub="active class arms" icon={BookOpen} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
              <StatCard label="Tests & Exams" value={String(examCount ?? 0)}
                sub="scheduled assessments" icon={ClipboardList} iconColor="text-purple-600" iconBg="bg-purple-50" />
              <StatCard label="Daily Register" value="Active"
                sub="ready for marking" icon={CalendarCheck} iconColor="text-amber-600" iconBg="bg-amber-50" />
            </>
          ) : (
            <>
              <StatCard label="Active students" value={String(studentCount ?? 0)}
                sub="enrolled this session" icon={Users} iconColor="text-blue-600" iconBg="bg-blue-50" />
              <StatCard label="Fees collected" value={formatNaira(feesCollected ?? 0)}
                sub="this term" icon={CreditCard} iconColor="text-brand-600" iconBg="bg-brand-50" />
              <StatCard label="Outstanding fees" value={formatNaira(feesOutstanding ?? 0)}
                sub={`${debtorCount ?? 0} students with balance`} icon={AlertTriangle} iconColor="text-amber-600" iconBg="bg-amber-50" />
              <StatCard label="Today's attendance" value="—"
                sub="Mark attendance to see rate" icon={CalendarCheck} iconColor="text-green-600" iconBg="bg-green-50" />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Recent admissions / Students list */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">
                {isTeacher ? "Student Roster (Quick Access)" : "Recent admissions"}
              </h2>
              <Link href="/students" className="text-xs text-brand-600 hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {loading ? (
              <div className="divide-y divide-gray-100">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 bg-gray-100 rounded w-32 animate-pulse" />
                      <div className="h-3 bg-gray-100 rounded w-20 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentStudents.length === 0 ? (
              <div className="py-12 flex flex-col items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-700">No students yet</p>
                <p className="text-xs text-muted-foreground">Start by admitting students</p>
                <Link href="/students/new" className="text-xs font-medium text-brand-600 hover:underline">
                  Add first student →
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentStudents.map(s => (
                  <div key={s.id}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-xs font-semibold text-brand-700 flex-shrink-0">
                        {s.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.className}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/results`}
                        className="px-2.5 py-1 text-xs font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-md transition-colors">
                        Enter Scores
                      </Link>
                      <Link href={`/students/${s.id}`}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions + Guide */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">
                {isTeacher ? "Teacher Actions" : "Quick actions"}
              </h2>
              <div className="space-y-2">
                {(isTeacher
                  ? [
                      { label: "Enter Results & Exam Marks", href: "/results",       icon: TrendingUp,    color: "text-purple-600", bg: "bg-purple-50" },
                      { label: "Generate Report Cards",      href: "/report-cards",  icon: FileText,      color: "text-brand-600",  bg: "bg-brand-50" },
                      { label: "Set Tests & Class Exams",    href: "/exams",         icon: ClipboardList, color: "text-amber-600",  bg: "bg-amber-50" },
                      { label: "Mark Daily Attendance",      href: "/attendance",    icon: CalendarCheck, color: "text-blue-600",   bg: "bg-blue-50" },
                      { label: "Register New Student",       href: "/students/new",  icon: Plus,          color: "text-emerald-600",bg: "bg-emerald-50" },
                    ]
                  : [
                      { label: "Add student",        href: "/students/new",  icon: Plus,          color: "text-brand-600",  bg: "bg-brand-50" },
                      { label: "Record fee payment", href: "/fees/new",      icon: CreditCard,    color: "text-green-600",  bg: "bg-green-50" },
                      { label: "Mark attendance",    href: "/attendance",    icon: CalendarCheck, color: "text-blue-600",   bg: "bg-blue-50" },
                      { label: "Enter results",      href: "/results",       icon: TrendingUp,    color: "text-purple-600", bg: "bg-purple-50" },
                      { label: "Set tests & exams",  href: "/exams",         icon: ClipboardList, color: "text-amber-600",  bg: "bg-amber-50" },
                    ]
                ).map(({ label, href, icon: Icon, color, bg }) => (
                  <Link key={href} href={href}
                    className="flex items-center gap-3 px-3.5 py-3 rounded-lg hover:bg-gray-50 border border-gray-100 transition-all">
                    <div className={`p-1.5 rounded-md ${bg}`}>
                      <Icon className={`w-3.5 h-3.5 ${color}`} />
                    </div>
                    <span className="text-sm text-gray-700">{label}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-400 ml-auto" />
                  </Link>
                ))}
              </div>
            </div>

            {isTeacher ? (
              <div className="bg-emerald-50/70 rounded-xl border border-emerald-100 p-4 space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 font-semibold text-xs">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>WAEC / NERDC Grading System</span>
                </div>
                <div className="text-[11px] text-emerald-800 space-y-1">
                  <div className="flex justify-between">
                    <span>Continuous Assessment (CA):</span>
                    <span className="font-semibold">Max 40 marks</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Terminal Exam:</span>
                    <span className="font-semibold">Max 60 marks</span>
                  </div>
                  <div className="flex justify-between border-t border-emerald-200/60 pt-1 mt-1">
                    <span>Total Score:</span>
                    <span className="font-semibold">100 marks</span>
                  </div>
                </div>
              </div>
            ) : (
              (studentCount === 0 || studentCount === null) && !loading && (
                <div className="bg-brand-50 rounded-xl border border-brand-100 p-5">
                  <h3 className="text-sm font-semibold text-brand-800 mb-3">Getting started</h3>
                  <div className="space-y-2.5">
                    {[
                      { label: "Set up classes in Settings", href: "/settings" },
                      { label: "Add subjects to classes",    href: "/settings" },
                      { label: "Admit your first student",   href: "/students/new" },
                      { label: "Record a fee payment",       href: "/fees/new" },
                      { label: "Add teaching staff",         href: "/staff/new" },
                    ].map(({ label, href }) => (
                      <Link key={label} href={href} className="flex items-center gap-2.5 text-sm">
                        <Clock className="w-4 h-4 text-brand-400 flex-shrink-0" />
                        <span className="text-brand-700">{label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
