"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Users, WifiOff } from "lucide-react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import Topbar from "@/components/layout/Topbar";
import { EmptyState, Badge, studentStatusBadge, SkeletonTable } from "@/components/ui/index";
import { getInitials, formatDate } from "@/lib/utils";
import type { Student, SchoolClass } from "@/types";

export default function StudentsPage() {
  const { appUser } = useAuth();
  const [students, setStudents]     = useState<Student[]>([]);
  const [classMap, setClassMap]     = useState<Record<string, string>>({});
  const [loading, setLoading]       = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [search, setSearch]         = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");

  const schoolId = appUser?.schoolId ?? "";

  useEffect(() => {
    if (!schoolId) { setLoading(false); return; }
    setFetchError(false);
    Promise.all([
      getDocs(query(collection(db, "students"), where("schoolId", "==", schoolId))),
      getDocs(query(collection(db, "classes"), where("schoolId", "==", schoolId))),
    ])
      .then(([studentsSnap, classesSnap]) => {
        const sList = studentsSnap.docs
          .map(d => ({ id: d.id, ...d.data() } as Student))
          .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setStudents(sList);
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

  const classIds = Array.from(new Set(students.map(s => s.classId).filter(Boolean)));
  const classOptions = [{ id: "all", name: "All classes" }, ...classIds.map(id => ({ id, name: classMap[id] ?? id }))];

  const filtered = students.filter(s => {
    const name = `${s.firstName} ${s.lastName} ${s.admissionNumber}`.toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase());
    const matchClass  = classFilter === "all" || s.classId === classFilter;
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    return matchSearch && matchClass && matchStatus;
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar
        title="Students"
        subtitle={`${students.filter(s => s.status === "active").length} active students`}
        actions={
          <Link href="/students/new"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> Admit student
          </Link>
        }
      />

      <div className="flex-1 p-6 animate-fade-in">

        {fetchError && (
          <div className="flex items-center gap-3 px-4 py-3.5 mb-5 bg-red-50 border border-red-200 rounded-xl text-sm">
            <WifiOff className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span className="text-red-700 flex-1">Failed to load students.</span>
            <button onClick={() => window.location.reload()} className="text-red-700 font-medium underline text-xs">Retry</button>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or admission no…"
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="graduated">Graduated</option>
            <option value="withdrawn">Withdrawn</option>
            <option value="suspended">Suspended</option>
          </select>
          <select value={classFilter} onChange={e => setClassFilter(e.target.value)}
            className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500">
            {classOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <SkeletonTable rows={6} cols={6} />
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100">
            <EmptyState icon={Users} title="No students found"
              description={students.length === 0
                ? "Start by admitting your first student."
                : "Try adjusting your search or filters."}
              action={students.length === 0 ? (
                <Link href="/students/new"
                  className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors">
                  <Plus className="w-4 h-4" /> Admit first student
                </Link>
              ) : undefined}
            />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {["Student", "Admission No.", "Class", "Gender", "Parent contact", "Status", "Admitted", ""].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(student => (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-xs font-semibold text-brand-700 flex-shrink-0">
                          {getInitials(`${student.firstName} ${student.lastName}`)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{student.firstName} {student.lastName}</p>
                          {student.otherName && <p className="text-xs text-muted-foreground">{student.otherName}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-mono text-gray-600">{student.admissionNumber}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-700">{classMap[student.classId] ?? student.classId ?? "—"}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-600 capitalize">{student.gender}</td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm text-gray-700">{student.parentName}</p>
                      <p className="text-xs text-muted-foreground">{student.parentPhone}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={studentStatusBadge(student.status)}>{student.status}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground">{formatDate(student.admissionDate)}</td>
                    <td className="px-5 py-3.5">
                      <Link href={`/students/${student.id}`} className="text-xs font-medium text-brand-600 hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
              <p className="text-xs text-muted-foreground">Showing {filtered.length} of {students.length} students</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
