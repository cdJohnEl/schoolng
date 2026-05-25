"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, UserCog, WifiOff } from "lucide-react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import Topbar from "@/components/layout/Topbar";
import { EmptyState, Badge, SkeletonTable } from "@/components/ui/index";
import { getInitials } from "@/lib/utils";
import type { Staff } from "@/types";

export default function StaffPage() {
  const { appUser } = useAuth();
  const [staff, setStaff]           = useState<Staff[]>([]);
  const [loading, setLoading]       = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const schoolId = appUser?.schoolId ?? "";

  useEffect(() => {
    if (!schoolId) { setLoading(false); return; }
    getDocs(query(collection(db, "staff"), where("schoolId", "==", schoolId), orderBy("createdAt", "desc")))
      .then(snap => setStaff(snap.docs.map(d => ({ id: d.id, ...d.data() } as Staff))))
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, [schoolId]);

  const ROLE_BADGE: Record<string, string> = {
    admin: "bg-purple-50 text-purple-700", teacher: "bg-blue-50 text-blue-700",
    bursar: "bg-amber-50 text-amber-700", proprietor: "bg-brand-50 text-brand-700",
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Staff" subtitle={`${staff.filter(s => s.status === "active").length} active staff members`}
        actions={
          <Link href="/staff/new" className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> Add staff
          </Link>
        }
      />
      <div className="flex-1 p-6 animate-fade-in">
        {fetchError && (
          <div className="flex items-center gap-3 px-4 py-3.5 mb-5 bg-red-50 border border-red-200 rounded-xl text-sm">
            <WifiOff className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span className="text-red-700 flex-1">Failed to load staff.</span>
            <button onClick={() => window.location.reload()} className="text-red-700 font-medium underline text-xs">Retry</button>
          </div>
        )}
        {loading ? (
          <SkeletonTable rows={5} cols={6} />
        ) : staff.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100">
            <EmptyState icon={UserCog} title="No staff added yet"
              description="Add teaching and support staff to manage their access and assignments."
              action={
                <Link href="/staff/new" className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors">
                  <Plus className="w-4 h-4" /> Add first staff member
                </Link>
              }
            />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {["Staff member","Role","Phone","Email","Subjects","Status",""].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {staff.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-xs font-semibold text-purple-700 flex-shrink-0">
                          {getInitials(`${s.firstName} ${s.lastName}`)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{s.firstName} {s.lastName}</p>
                          <p className="text-xs text-muted-foreground">{s.qualification}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_BADGE[s.role] ?? "bg-gray-100 text-gray-700"}`}>
                        {s.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{s.phone}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{s.email}</td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground">{s.subjectIds.length} subjects</td>
                    <td className="px-5 py-3.5">
                      <Badge variant={s.status === "active" ? "success" : "danger"}>{s.status}</Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <Link href={`/staff/${s.id}`} className="text-xs text-brand-600 hover:underline">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
