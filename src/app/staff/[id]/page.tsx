"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Trash2, AlertCircle } from "lucide-react";
import { doc, getDoc, updateDoc, deleteDoc, getDocs, query, collection, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import Topbar from "@/components/layout/Topbar";
import { Badge } from "@/components/ui/index";
import { getInitials } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";
import type { Staff, SchoolClass, Subject } from "@/types";

const INPUT = "w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-gray-400 bg-white";
const LABEL = "block text-sm font-medium text-gray-700 mb-1.5";

export default function StaffDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { appUser } = useAuth();
  const router = useRouter();

  const [staff, setStaff]         = useState<Staff | null>(null);
  const [classes, setClasses]     = useState<SchoolClass[]>([]);
  const [subjects, setSubjects]   = useState<Subject[]>([]);
  const [loading, setLoading]     = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!id || !appUser?.schoolId) return;
    Promise.all([
      getDoc(doc(db, "staff", id)),
      getDocs(query(collection(db, "classes"), where("schoolId", "==", appUser.schoolId))),
      getDocs(query(collection(db, "subjects"), where("schoolId", "==", appUser.schoolId))),
    ])
      .then(([staffSnap, classSnap, subSnap]) => {
        if (staffSnap.exists()) setStaff({ id: staffSnap.id, ...staffSnap.data() } as Staff);
        setClasses(classSnap.docs.map(d => ({ id: d.id, ...d.data() } as SchoolClass)));
        setSubjects(subSnap.docs.map(d => ({ id: d.id, ...d.data() } as Subject)));
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, [id, appUser?.schoolId]);

  const set = (k: keyof Staff, v: string) => setStaff(s => s ? { ...s, [k]: v } : s);

  const toggleSubject = (subId: string) => {
    if (!staff) return;
    const ids = staff.subjectIds.includes(subId)
      ? staff.subjectIds.filter(s => s !== subId)
      : [...staff.subjectIds, subId];
    setStaff({ ...staff, subjectIds: ids });
  };

  const handleSave = async () => {
    if (!id || !staff) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "staff", id), { ...staff, updatedAt: new Date().toISOString() });
      toast("Staff record saved");
    } catch {
      toast("Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    await deleteDoc(doc(db, "staff", id));
    router.push("/staff");
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen"><div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  if (fetchError || !staff) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-3">
      <AlertCircle className="w-8 h-8 text-gray-400" />
      <p className="text-sm text-muted-foreground">{fetchError ? "Failed to load." : "Staff member not found."}</p>
      <Link href="/staff" className="text-sm text-brand-600 hover:underline">← Back to staff</Link>
    </div>
  );

  const ROLE_COLOR: Record<string, string> = {
    teacher: "bg-blue-50 text-blue-700", admin: "bg-purple-50 text-purple-700",
    bursar: "bg-amber-50 text-amber-700", proprietor: "bg-brand-50 text-brand-700",
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title={`${staff.firstName} ${staff.lastName}`} subtitle={`${staff.role} · ${staff.qualification}`}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
              <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save"}
            </button>
            <Link href="/staff" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
          </div>
        }
      />

      <div className="flex-1 p-6 animate-fade-in">
        <div className="max-w-2xl space-y-4">

          {/* Profile */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center text-lg font-bold text-purple-700 flex-shrink-0">
              {getInitials(`${staff.firstName} ${staff.lastName}`)}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-base font-semibold text-gray-900">{staff.firstName} {staff.lastName}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLOR[staff.role] ?? "bg-gray-100 text-gray-700"}`}>{staff.role}</span>
                <Badge variant={staff.status === "active" ? "success" : "danger"}>{staff.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{staff.email} · {staff.phone}</p>
            </div>
          </div>

          {/* Edit form */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Staff details</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div><label className={LABEL}>First name</label><input className={INPUT} value={staff.firstName} onChange={e => set("firstName", e.target.value)} /></div>
              <div><label className={LABEL}>Last name</label><input className={INPUT} value={staff.lastName} onChange={e => set("lastName", e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div><label className={LABEL}>Email</label><input type="email" className={INPUT} value={staff.email} onChange={e => set("email", e.target.value)} /></div>
              <div><label className={LABEL}>Phone</label><input className={INPUT} value={staff.phone} onChange={e => set("phone", e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className={LABEL}>Role</label>
                <select className={INPUT} value={staff.role} onChange={e => set("role", e.target.value)}>
                  <option value="teacher">Teacher</option><option value="admin">Admin</option>
                  <option value="bursar">Bursar</option><option value="proprietor">Proprietor</option>
                </select></div>
              <div><label className={LABEL}>Status</label>
                <select className={INPUT} value={staff.status} onChange={e => set("status", e.target.value)}>
                  <option value="active">Active</option><option value="inactive">Inactive</option>
                </select></div>
              <div><label className={LABEL}>Qualification</label><input className={INPUT} value={staff.qualification} onChange={e => set("qualification", e.target.value)} /></div>
            </div>
          </div>

          {/* Subject assignments */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Subject assignments</h3>
            <p className="text-xs text-muted-foreground mb-4">Select the subjects this staff member teaches</p>
            {subjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No subjects configured. <Link href="/settings" className="text-brand-600 hover:underline">Add subjects in Settings →</Link></p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {subjects.map(s => {
                  const assigned = staff.subjectIds.includes(s.id);
                  return (
                    <button key={s.id} onClick={() => toggleSubject(s.id)}
                      className={`text-sm px-3 py-1.5 rounded-lg border font-medium transition-colors
                        ${assigned ? "bg-brand-600 text-white border-brand-600" : "bg-white text-gray-600 border-gray-200 hover:border-brand-300"}`}>
                      {assigned ? "✓ " : ""}{s.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Danger zone */}
          <div className="bg-white rounded-xl border border-red-100 p-5">
            <h3 className="text-sm font-semibold text-red-700 mb-1">Danger zone</h3>
            <p className="text-xs text-muted-foreground mb-3">Removing a staff member is permanent.</p>
            {confirmDelete ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-700">Are you sure?</span>
                <button onClick={handleDelete} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors">Yes, remove</button>
                <button onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-2 px-3.5 py-2 border border-red-200 hover:bg-red-50 text-sm font-medium text-red-600 rounded-lg transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Remove staff member
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
