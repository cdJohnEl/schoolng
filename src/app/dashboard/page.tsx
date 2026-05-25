"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users, CreditCard, CalendarCheck, AlertTriangle,
  ArrowRight, Plus, TrendingUp, CheckCircle2, Clock, WifiOff,
} from "lucide-react";
import {
  collection, query, where, getDocs, orderBy, limit, getCountFromServer,
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

  const [studentCount, setStudentCount]   = useState<number | null>(null);
  const [feesCollected, setFeesCollected] = useState<number | null>(null);
  const [feesOutstanding, setFeesOutstanding] = useState<number | null>(null);
  const [debtorCount, setDebtorCount]     = useState<number | null>(null);
  const [recentStudents, setRecentStudents] = useState<RecentStudent[]>([]);
  const [loading, setLoading]             = useState(true);
  const [fetchError, setFetchError]       = useState(false);

  useEffect(() => {
    if (!schoolId) { setLoading(false); return; }
    setFetchError(false);

    Promise.all([
      getCountFromServer(query(collection(db, "students"), where("schoolId", "==", schoolId), where("status", "==", "active"))),
      getDocs(query(collection(db, "feePayments"), where("schoolId", "==", schoolId))),
      getDocs(query(collection(db, "students"), where("schoolId", "==", schoolId), where("status", "==", "active"), orderBy("createdAt", "desc"), limit(5))),
      getDocs(query(collection(db, "classes"), where("schoolId", "==", schoolId))),
    ])
      .then(([countSnap, feesSnap, studentsSnap, classesSnap]) => {
        setStudentCount(countSnap.data().count);

        const payments = feesSnap.docs.map(d => d.data() as FeePayment);
        setFeesCollected(payments.reduce((s, p) => s + p.totalPaid, 0));
        setFeesOutstanding(payments.reduce((s, p) => s + p.balance, 0));
        setDebtorCount(payments.filter(p => p.status !== "paid").length);

        // Build class name map
        const classMap: Record<string, string> = {};
        classesSnap.docs.forEach(d => {
          const c = d.data() as SchoolClass;
          classMap[d.id] = `${c.name}${c.arm ? ` ${c.arm}` : ""}`;
        });

        setRecentStudents(studentsSnap.docs.map(d => {
          const s = d.data() as Student;
          return {
            id: d.id,
            name: `${s.firstName} ${s.lastName}`,
            className: classMap[s.classId] ?? s.classId ?? "—",
            date: s.createdAt,
          };
        }));
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, [schoolId]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar
        title={`${greeting()}${user?.displayName ? `, ${user.displayName.split(" ")[0]}` : ""} 👋`}
        subtitle="School overview"
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
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
            : <>
              <StatCard label="Active students" value={String(studentCount ?? 0)}
                sub="enrolled this session" icon={Users} iconColor="text-blue-600" iconBg="bg-blue-50" />
              <StatCard label="Fees collected" value={formatNaira(feesCollected ?? 0)}
                sub="this term" icon={CreditCard} iconColor="text-brand-600" iconBg="bg-brand-50" />
              <StatCard label="Outstanding fees" value={formatNaira(feesOutstanding ?? 0)}
                sub={`${debtorCount ?? 0} students with balance`} icon={AlertTriangle} iconColor="text-amber-600" iconBg="bg-amber-50" />
              <StatCard label="Today's attendance" value="—"
                sub="Mark attendance to see rate" icon={CalendarCheck} iconColor="text-green-600" iconBg="bg-green-50" />
            </>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Recent admissions */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Recent admissions</h2>
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
                <p className="text-xs text-muted-foreground">Start by setting up classes in Settings, then add students</p>
                <Link href="/students/new" className="text-xs font-medium text-brand-600 hover:underline">
                  Add first student →
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentStudents.map(s => (
                  <Link key={s.id} href={`/students/${s.id}`}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-xs font-semibold text-brand-700 flex-shrink-0">
                      {s.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.className}</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions + checklist */}
          <div className="space-y-3">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Quick actions</h2>
              <div className="space-y-2">
                {[
                  { label: "Add student",        href: "/students/new",  icon: Plus,          color: "text-brand-600",  bg: "bg-brand-50" },
                  { label: "Record fee payment", href: "/fees/new",      icon: CreditCard,    color: "text-green-600",  bg: "bg-green-50" },
                  { label: "Mark attendance",    href: "/attendance",    icon: CalendarCheck, color: "text-blue-600",   bg: "bg-blue-50" },
                  { label: "Enter results",      href: "/results",       icon: TrendingUp,    color: "text-purple-600", bg: "bg-purple-50" },
                ].map(({ label, href, icon: Icon, color, bg }) => (
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

            {(studentCount === 0 || studentCount === null) && !loading && (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
