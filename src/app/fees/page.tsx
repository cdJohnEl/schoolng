"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, CreditCard, AlertTriangle, CheckCircle2, WifiOff } from "lucide-react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import Topbar from "@/components/layout/Topbar";
import { EmptyState, Badge, paymentStatusBadge, SkeletonTable, StatCard } from "@/components/ui/index";
import { formatNaira } from "@/lib/utils";
import type { FeePayment, Student, SchoolClass } from "@/types";

export default function FeesPage() {
  const { appUser } = useAuth();
  const [payments, setPayments]       = useState<FeePayment[]>([]);
  const [studentMap, setStudentMap]   = useState<Record<string, Student>>({});
  const [classMap, setClassMap]       = useState<Record<string, string>>({});
  const [loading, setLoading]         = useState(true);
  const [fetchError, setFetchError]   = useState(false);
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [termFilter, setTermFilter]   = useState("all");

  const schoolId = appUser?.schoolId ?? "";

  useEffect(() => {
    if (!schoolId) { setLoading(false); return; }
    setFetchError(false);

    Promise.all([
      getDocs(query(collection(db, "feePayments"), where("schoolId", "==", schoolId), orderBy("createdAt", "desc"))),
      getDocs(query(collection(db, "students"), where("schoolId", "==", schoolId))),
      getDocs(query(collection(db, "classes"), where("schoolId", "==", schoolId))),
    ])
      .then(([paymentsSnap, studentsSnap, classesSnap]) => {
        setPayments(paymentsSnap.docs.map(d => ({ id: d.id, ...d.data() } as FeePayment)));

        const sMap: Record<string, Student> = {};
        studentsSnap.docs.forEach(d => { sMap[d.id] = { id: d.id, ...d.data() } as Student; });
        setStudentMap(sMap);

        const cMap: Record<string, string> = {};
        classesSnap.docs.forEach(d => {
          const c = d.data() as SchoolClass;
          cMap[d.id] = `${c.name}${c.arm ? ` ${c.arm}` : ""}`;
        });
        setClassMap(cMap);
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, [schoolId]);

  const terms = ["all", ...Array.from(new Set(payments.map(p => p.term)))];

  const filtered = payments.filter(p => {
    const student = studentMap[p.studentId];
    const name = student ? `${student.firstName} ${student.lastName}`.toLowerCase() : "";
    const matchSearch = !search || name.includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    const matchTerm   = termFilter === "all" || p.term === termFilter;
    return matchSearch && matchStatus && matchTerm;
  });

  const totalCollected   = payments.reduce((s, p) => s + p.totalPaid, 0);
  const totalOutstanding = payments.reduce((s, p) => s + p.balance, 0);
  const debtors          = payments.filter(p => p.status !== "paid").length;
  const fullyPaid        = payments.filter(p => p.status === "paid").length;

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Fee management" subtitle="Track school fee collection and outstanding balances"
        actions={
          <Link href="/fees/new"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> Record payment
          </Link>
        }
      />

      <div className="flex-1 p-6 space-y-5 animate-fade-in">
        {fetchError && (
          <div className="flex items-center gap-3 px-4 py-3.5 bg-red-50 border border-red-200 rounded-xl text-sm">
            <WifiOff className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span className="text-red-700 flex-1">Failed to load fee data.</span>
            <button onClick={() => window.location.reload()} className="text-red-700 font-medium underline text-xs">Retry</button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total collected"  value={loading ? "—" : formatNaira(totalCollected)}  sub="this term"               icon={CheckCircle2} iconColor="text-green-600" iconBg="bg-green-50" />
          <StatCard label="Outstanding"      value={loading ? "—" : formatNaira(totalOutstanding)} sub={`from ${debtors} students`} icon={AlertTriangle} iconColor="text-amber-600" iconBg="bg-amber-50" />
          <StatCard label="Fully paid"       value={loading ? "—" : String(fullyPaid)}              sub="students"               icon={CreditCard}   iconColor="text-brand-600" iconBg="bg-brand-50" />
          <StatCard label="Debtors"          value={loading ? "—" : String(debtors)}                sub="outstanding balance"     icon={AlertTriangle} iconColor="text-red-600"   iconBg="bg-red-50" />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search student name…"
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white" />
          </div>
          <select value={termFilter} onChange={e => setTermFilter(e.target.value)}
            className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500">
            {terms.map(t => <option key={t} value={t}>{t === "all" ? "All terms" : t}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="all">All statuses</option>
            <option value="paid">Fully paid</option>
            <option value="partial">Partial</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <SkeletonTable rows={6} cols={7} />
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100">
            <EmptyState icon={CreditCard} title="No fee records"
              description="Record a fee payment to start tracking collections."
              action={
                <Link href="/fees/new"
                  className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors">
                  <Plus className="w-4 h-4" /> Record first payment
                </Link>
              }
            />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {["Student","Class","Term","Expected","Paid","Balance","Status",""].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(p => {
                  const student = studentMap[p.studentId];
                  const studentName = student
                    ? `${student.firstName} ${student.lastName}`
                    : `Student (${p.studentId.slice(0, 6)}…)`;
                  const className = classMap[p.classId] ?? p.classId;
                  return (
                    <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${p.status === "unpaid" ? "bg-red-50/20" : ""}`}>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-gray-900">{studentName}</p>
                        {student && <p className="text-xs text-muted-foreground">{student.admissionNumber}</p>}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">{className}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">{p.term}</td>
                      <td className="px-5 py-3.5 text-sm font-mono text-gray-900">{formatNaira(p.totalExpected)}</td>
                      <td className="px-5 py-3.5 text-sm font-mono text-green-700">{formatNaira(p.totalPaid)}</td>
                      <td className="px-5 py-3.5 text-sm font-mono font-medium text-red-600">{formatNaira(p.balance)}</td>
                      <td className="px-5 py-3.5">
                        <Badge variant={paymentStatusBadge(p.status)}>{p.status}</Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <Link href={`/fees/${p.id}`} className="text-xs text-brand-600 hover:underline font-medium">View</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
              <p className="text-xs text-muted-foreground">Showing {filtered.length} of {payments.length} records</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
