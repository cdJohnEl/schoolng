"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, KeyRound, Copy, Check, UserCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import Topbar from "@/components/layout/Topbar";
import { toast } from "@/components/ui/Toast";

const INPUT = "w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-gray-400 bg-white";
const LABEL = "block text-sm font-medium text-gray-700 mb-1.5";
const SECTION = "bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-4";

export default function NewStaffPage() {
  const { appUser } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ username: string; password: string; name: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    password: "password123",
    email: "",
    phone: "",
    role: "teacher",
    qualification: "",
    joinDate: new Date().toISOString().split("T")[0],
  });

  const set = (k: string, v: string) => {
    setForm(f => {
      const updated = { ...f, [k]: v };
      // Auto-suggest username if user hasn't explicitly customized it
      if ((k === "firstName" || k === "lastName") && (!f.username || f.username === `${f.firstName.toLowerCase()}.${f.lastName.toLowerCase()}`)) {
        const fn = k === "firstName" ? v : f.firstName;
        const ln = k === "lastName" ? v : f.lastName;
        if (fn && ln) {
          updated.username = `${fn.toLowerCase().replace(/[^a-z0-9]/g, "")}.${ln.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
        }
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appUser?.schoolId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolId: appUser.schoolId,
          ...form,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create staff member");
      }

      toast(`${form.firstName} ${form.lastName} added successfully`);
      setCreatedCredentials({
        name: `${form.firstName} ${form.lastName}`,
        username: form.username,
        password: form.password,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save";
      toast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const text = `SchoolNG Login for ${createdCredentials.name}:\nUsername: ${createdCredentials.username}\nPassword: ${createdCredentials.password}\nLogin at: ${window.location.origin}/auth/login`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast("Credentials copied to clipboard");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Add staff member"
        actions={<Link href="/staff" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"><ArrowLeft className="w-4 h-4" /> Back</Link>}
      />

      <div className="flex-1 p-6 max-w-xl animate-fade-in">
        {createdCredentials ? (
          <div className="bg-white rounded-2xl border border-green-200 shadow-sm p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-green-100 text-green-700 rounded-2xl flex items-center justify-center mx-auto">
              <UserCheck className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Staff Account Created!</h2>
            <p className="text-sm text-muted-foreground">
              {createdCredentials.name} can now sign in to their dashboard with the credentials below:
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-left font-mono text-sm space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Username:</span>
                <span className="font-semibold text-gray-900">{createdCredentials.username}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Password:</span>
                <span className="font-semibold text-gray-900">{createdCredentials.password}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Role:</span>
                <span className="capitalize text-brand-600 font-semibold">{form.role}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={handleCopyCredentials}
                className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy login info"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/staff")}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors">
                Done & View Staff
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
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
                    <option value="teacher">Teacher</option>
                    <option value="admin">School Admin</option>
                    <option value="bursar">Bursar</option>
                    <option value="proprietor">Proprietor</option>
                  </select>
                </div>
                <div><label className={LABEL}>Qualification</label><input className={INPUT} value={form.qualification} onChange={e => set("qualification", e.target.value)} placeholder="B.Ed Mathematics" /></div>
              </div>
              <div><label className={LABEL}>Join date</label><input type="date" className={INPUT} value={form.joinDate} onChange={e => set("joinDate", e.target.value)} /></div>
            </div>

            {/* Login Credentials Section */}
            <div className={SECTION}>
              <div className="flex items-center gap-2 mb-2">
                <KeyRound className="w-4 h-4 text-brand-600" />
                <h2 className="text-sm font-semibold text-gray-900">Dashboard Login Access</h2>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Create a username and password so this teacher can sign in to mark attendance, register students, and submit results.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Username *</label>
                  <input required className={INPUT} value={form.username} onChange={e => set("username", e.target.value)} placeholder="ngozi.okafor" />
                </div>
                <div>
                  <label className={LABEL}>Password *</label>
                  <input required className={INPUT} value={form.password} onChange={e => set("password", e.target.value)} placeholder="Min 6 characters" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
                <Save className="w-4 h-4" /> {saving ? "Creating staff & access…" : "Add staff member"}
              </button>
              <Link href="/staff" className="text-sm text-gray-500 hover:text-gray-700">Cancel</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
