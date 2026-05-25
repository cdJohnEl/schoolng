"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import Topbar from "@/components/layout/Topbar";
import { toast } from "@/components/ui/Toast";
import type { Staff } from "@/types";

const INPUT = "w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-gray-400 bg-white";
const LABEL = "block text-sm font-medium text-gray-700 mb-1.5";
const SECTION = "bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-4";

export default function NewStaffPage() {
  const { appUser } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", role: "teacher", qualification: "", joinDate: new Date().toISOString().split("T")[0] });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appUser?.schoolId) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "staff"), {
        schoolId: appUser.schoolId,
        ...form,
        status: "active",
        subjectIds: [], classIds: [],
        createdAt: new Date().toISOString(),
      } as Omit<Staff, "id">);
      toast("Staff member added");
      router.push("/staff");
    } catch {
      toast("Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Add staff member"
        actions={<Link href="/staff" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"><ArrowLeft className="w-4 h-4" /> Back</Link>}
      />
      <form onSubmit={handleSubmit} className="flex-1 p-6 max-w-xl animate-fade-in">
        <div className={SECTION}>
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Staff details</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div><label className={LABEL}>First name *</label><input required className={INPUT} value={form.firstName} onChange={e => set("firstName", e.target.value)} placeholder="Ngozi" /></div>
            <div><label className={LABEL}>Last name *</label><input required className={INPUT} value={form.lastName} onChange={e => set("lastName", e.target.value)} placeholder="Okafor" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div><label className={LABEL}>Email *</label><input required type="email" className={INPUT} value={form.email} onChange={e => set("email", e.target.value)} placeholder="staff@school.com" /></div>
            <div><label className={LABEL}>Phone *</label><input required className={INPUT} value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="0801 234 5678" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div><label className={LABEL}>Role *</label>
              <select required className={INPUT} value={form.role} onChange={e => set("role", e.target.value)}>
                <option value="teacher">Teacher</option><option value="admin">Admin</option>
                <option value="bursar">Bursar</option><option value="proprietor">Proprietor</option>
              </select></div>
            <div><label className={LABEL}>Qualification</label><input className={INPUT} value={form.qualification} onChange={e => set("qualification", e.target.value)} placeholder="B.Ed Mathematics" /></div>
          </div>
          <div><label className={LABEL}>Join date</label><input type="date" className={INPUT} value={form.joinDate} onChange={e => set("joinDate", e.target.value)} /></div>
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
            <Save className="w-4 h-4" /> {saving ? "Saving…" : "Add staff member"}
          </button>
          <Link href="/staff" className="text-sm text-gray-500 hover:text-gray-700">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
