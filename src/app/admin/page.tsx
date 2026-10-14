"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap, Plus, Search, Building2, Users, CreditCard,
  CheckCircle, AlertCircle, Trash2, Edit3, Eye, ExternalLink,
  Phone, Mail, MapPin, X, RefreshCw, Sparkles, Shield
} from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/auth-context";

interface AdminSchool {
  id: string;
  name: string;
  motto?: string;
  address?: string;
  phone?: string;
  email?: string;
  plan: "free" | "starter" | "growth" | "group";
  subscriptionStatus?: "active" | "cancelled" | "past_due";
  studentCount?: number;
  staffCount?: number;
  classCount?: number;
  subjectCount?: number;
  ownerId?: string;
  createdAt?: string;
}

const PLAN_BADGES: Record<string, { label: string; color: string }> = {
  free:    { label: "Free Tier",  color: "bg-gray-800 text-gray-300 border-gray-700" },
  starter: { label: "Starter",    color: "bg-blue-900/60 text-blue-300 border-blue-700" },
  growth:  { label: "Growth",     color: "bg-purple-900/60 text-purple-300 border-purple-700" },
  group:   { label: "Enterprise", color: "bg-amber-900/60 text-amber-300 border-amber-700" },
};

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  active:    { label: "Active",    color: "bg-emerald-950 text-emerald-400 border-emerald-800" },
  cancelled: { label: "Cancelled", color: "bg-red-950 text-red-400 border-red-800" },
  past_due:  { label: "Past Due",  color: "bg-amber-950 text-amber-400 border-amber-800" },
};

export default function AdminPage() {
  const router = useRouter();
  const { user, refreshAppUser } = useAuth();

  const [schools, setSchools]       = useState<AdminSchool[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal]     = useState(false);
  const [viewModal, setViewModal]     = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [activeSchool, setActiveSchool] = useState<AdminSchool | null>(null);
  const [saving, setSaving]           = useState(false);

  // Form State
  const [form, setForm] = useState({
    name: "",
    motto: "",
    address: "",
    phone: "",
    email: "",
    plan: "growth" as AdminSchool["plan"],
    subscriptionStatus: "active" as AdminSchool["subscriptionStatus"],
  });

  const loadSchools = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/schools");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSchools(data.schools || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load schools";
      toast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchools();
  }, []);

  const openCreateModal = () => {
    setForm({
      name: "",
      motto: "",
      address: "",
      phone: "",
      email: "",
      plan: "growth",
      subscriptionStatus: "active",
    });
    setCreateModal(true);
  };

  const openEditModal = (s: AdminSchool) => {
    setActiveSchool(s);
    setForm({
      name: s.name,
      motto: s.motto || "",
      address: s.address || "",
      phone: s.phone || "",
      email: s.email || "",
      plan: s.plan || "free",
      subscriptionStatus: s.subscriptionStatus || "active",
    });
    setEditModal(true);
  };

  const openViewModal = (s: AdminSchool) => {
    setActiveSchool(s);
    setViewModal(true);
  };

  const openDeleteModal = (s: AdminSchool) => {
    setActiveSchool(s);
    setDeleteModal(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast(`School "${form.name}" created with standard classes & subjects`);
      setCreateModal(false);
      loadSchools();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create school";
      toast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSchool) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/schools/${activeSchool.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast(`School "${form.name}" updated successfully`);
      setEditModal(false);
      loadSchools();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update school";
      toast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!activeSchool) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/schools/${activeSchool.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast(`School "${activeSchool.name}" deleted`);
      setDeleteModal(false);
      loadSchools();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete school";
      toast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSwitchToSchool = async (school: AdminSchool) => {
    if (!user) return;
    try {
      // Update super admin's active schoolId
      const { doc, setDoc } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      await setDoc(doc(db, "users", user.uid), { schoolId: school.id }, { merge: true });
      await refreshAppUser();
      toast(`Switched workspace to ${school.name}`);
      router.push("/dashboard");
    } catch {
      toast("Could not switch workspace", "error");
    }
  };

  // Filtered list
  const filtered = schools.filter(s => {
    const q = search.toLowerCase();
    const matchSearch =
      s.name.toLowerCase().includes(q) ||
      (s.address && s.address.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.phone && s.phone.toLowerCase().includes(q));
    const matchPlan = planFilter === "all" || s.plan === planFilter;
    const matchStatus = statusFilter === "all" || s.subscriptionStatus === statusFilter;
    return matchSearch && matchPlan && matchStatus;
  });

  // Aggregated Stats
  const totalStudents = schools.reduce((acc, s) => acc + (s.studentCount || 0), 0);
  const totalStaff    = schools.reduce((acc, s) => acc + (s.staffCount || 0), 0);
  const paidSchools   = schools.filter(s => s.plan !== "free").length;

  return (
    <div className="space-y-6">

      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-950 p-6 rounded-2xl border border-gray-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Platform Schools Registry</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-900/60 text-purple-300 border border-purple-700/60">
              {schools.length} Schools
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Master multi-tenant school administration. Create, view, update, and manage all schools across Nigeria.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadSchools}
            title="Refresh schools"
            className="p-2.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl text-gray-300 hover:text-white transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-purple-600/30">
            <Plus className="w-4 h-4" /> Add New School
          </button>
        </div>
      </div>

      {/* Platform KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-950 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-medium">Total Registered Schools</span>
            <Building2 className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white">{schools.length}</p>
          <p className="text-[11px] text-gray-400 mt-1">{paidSchools} on paid subscription plans</p>
        </div>

        <div className="bg-gray-950 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-medium">Platform Students</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white">{totalStudents.toLocaleString()}</p>
          <p className="text-[11px] text-gray-400 mt-1">Active enrolled students</p>
        </div>

        <div className="bg-gray-950 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-medium">Teaching & Admin Staff</span>
            <GraduationCap className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white">{totalStaff.toLocaleString()}</p>
          <p className="text-[11px] text-gray-400 mt-1">Teachers and principals</p>
        </div>

        <div className="bg-gray-950 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-medium">Active Paid Plans</span>
            <CreditCard className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white">{paidSchools}</p>
          <p className="text-[11px] text-amber-400/80 mt-1">Growth & Group Enterprise</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-950 p-4 rounded-xl border border-gray-800">
        <div className="flex items-center gap-3 flex-1 max-w-md bg-gray-900 px-3 py-2 rounded-lg border border-gray-800">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search school name, location, email, or phone…"
            className="w-full bg-transparent text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-gray-500 hover:text-gray-300">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={planFilter}
            onChange={e => setPlanFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-300 focus:outline-none font-medium">
            <option value="all">All Plans</option>
            <option value="growth">Growth</option>
            <option value="group">Enterprise / Group</option>
            <option value="starter">Starter</option>
            <option value="free">Free</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-300 focus:outline-none font-medium">
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="past_due">Past Due</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Schools Table */}
      <div className="bg-gray-950 rounded-xl border border-gray-800 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-gray-400">Loading schools registry…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Building2 className="w-10 h-10 text-gray-600 mx-auto" />
            <h3 className="text-base font-semibold text-gray-300">No schools found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {schools.length === 0
                ? "No schools registered on the platform yet. Click 'Add New School' to add the first school."
                : "No schools matching your search criteria. Try resetting filters."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-900/80 text-gray-400 text-xs uppercase font-medium border-b border-gray-800">
                <tr>
                  <th className="px-5 py-3.5">School Name & Motto</th>
                  <th className="px-5 py-3.5">Contact Details</th>
                  <th className="px-5 py-3.5">Plan & Status</th>
                  <th className="px-5 py-3.5 text-center">Students</th>
                  <th className="px-5 py-3.5 text-center">Classes / Subjects</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/80">
                {filtered.map(s => {
                  const planBadge = PLAN_BADGES[s.plan] || PLAN_BADGES.free;
                  const statusBadge = STATUS_BADGES[s.subscriptionStatus || "active"] || STATUS_BADGES.active;

                  return (
                    <tr key={s.id} className="hover:bg-gray-900/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-purple-950 border border-purple-800/70 flex items-center justify-center text-purple-300 font-bold text-xs flex-shrink-0">
                            {s.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-white truncate text-sm">{s.name}</p>
                            <p className="text-xs text-gray-400 truncate mt-0.5">{s.motto || "No motto set"}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-xs space-y-1 text-gray-300">
                          {s.phone && (
                            <div className="flex items-center gap-1.5 text-gray-400">
                              <Phone className="w-3 h-3" />
                              <span>{s.phone}</span>
                            </div>
                          )}
                          {s.email && (
                            <div className="flex items-center gap-1.5 text-gray-400">
                              <Mail className="w-3 h-3" />
                              <span className="truncate max-w-[180px]">{s.email}</span>
                            </div>
                          )}
                          {s.address && (
                            <div className="flex items-center gap-1.5 text-gray-500">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate max-w-[200px]">{s.address}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1.5 items-start">
                          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${planBadge.color}`}>
                            {planBadge.label}
                          </span>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${statusBadge.color}`}>
                            {statusBadge.label}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span className="text-sm font-bold text-gray-200">
                          {s.studentCount ?? 0}
                        </span>
                        <p className="text-[10px] text-gray-500">enrolled</p>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <div className="text-xs text-gray-300">
                          <span>{s.classCount ?? 0} classes</span>
                          <span className="text-gray-500"> • </span>
                          <span className="text-purple-400">{s.subjectCount ?? 0} subjects</span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleSwitchToSchool(s)}
                            title="Open school workspace"
                            className="p-1.5 text-purple-400 hover:text-purple-200 hover:bg-purple-950/60 rounded-lg transition-colors border border-purple-800/50">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openViewModal(s)}
                            title="View details"
                            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditModal(s)}
                            title="Edit school"
                            className="p-1.5 text-blue-400 hover:text-blue-200 hover:bg-gray-800 rounded-lg transition-colors">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(s)}
                            title="Delete school"
                            className="p-1.5 text-red-400 hover:text-red-200 hover:bg-gray-800 rounded-lg transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE SCHOOL MODAL */}
      {createModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-gray-950 border border-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">Register New School</h3>
                <p className="text-xs text-gray-400 mt-0.5">Pre-loads standard Nigerian curriculum and subjects</p>
              </div>
              <button onClick={() => setCreateModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">School Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Corona Secondary School"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Motto</label>
                <input
                  value={form.motto}
                  onChange={e => setForm(f => ({ ...f, motto: e.target.value }))}
                  placeholder="e.g. Excellence and Integrity"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Address *</label>
                <input
                  required
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="e.g. 15 Education Way, Victoria Island, Lagos"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Phone Number</label>
                  <input
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="0803 123 4567"
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">School Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="info@school.edu.ng"
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Subscription Plan</label>
                  <select
                    value={form.plan}
                    onChange={e => setForm(f => ({ ...f, plan: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500">
                    <option value="growth">Growth (₦25k/term)</option>
                    <option value="group">Enterprise / Group</option>
                    <option value="starter">Starter</option>
                    <option value="free">Free Tier</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Status</label>
                  <select
                    value={form.subscriptionStatus}
                    onChange={e => setForm(f => ({ ...f, subscriptionStatus: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500">
                    <option value="active">Active</option>
                    <option value="past_due">Past Due</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="bg-purple-950/40 border border-purple-800/60 rounded-xl p-3 text-xs text-purple-300 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Automatic setup:</strong> Standard Nigerian classes (Nursery to SS 3) and 20 core subjects (Mathematics, English, Sciences, etc.) will be automatically configured upon creation.
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setCreateModal(false)}
                  className="px-4 py-2 text-xs text-gray-400 hover:text-white transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition-colors">
                  {saving ? "Creating school & seeding…" : "Create School"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SCHOOL MODAL */}
      {editModal && activeSchool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-gray-950 border border-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">Edit School Details</h3>
                <p className="text-xs text-gray-400 mt-0.5">{activeSchool.name}</p>
              </div>
              <button onClick={() => setEditModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">School Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Motto</label>
                <input
                  value={form.motto}
                  onChange={e => setForm(f => ({ ...f, motto: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Address *</label>
                <input
                  required
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Phone</label>
                  <input
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Plan</label>
                  <select
                    value={form.plan}
                    onChange={e => setForm(f => ({ ...f, plan: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500">
                    <option value="growth">Growth</option>
                    <option value="group">Enterprise / Group</option>
                    <option value="starter">Starter</option>
                    <option value="free">Free Tier</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Status</label>
                  <select
                    value={form.subscriptionStatus}
                    onChange={e => setForm(f => ({ ...f, subscriptionStatus: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500">
                    <option value="active">Active</option>
                    <option value="past_due">Past Due</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setEditModal(false)}
                  className="px-4 py-2 text-xs text-gray-400 hover:text-white transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition-colors">
                  {saving ? "Updating…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {viewModal && activeSchool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-gray-950 border border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-lg font-bold text-white">School Profile</h3>
              <button onClick={() => setViewModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-gray-500">School Name</p>
                <p className="font-semibold text-white text-base">{activeSchool.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Motto</p>
                <p className="text-gray-300">{activeSchool.motto || "None"}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 bg-gray-900 p-3 rounded-lg border border-gray-800 text-xs">
                <div>
                  <span className="text-gray-500">School ID:</span>
                  <p className="font-mono text-gray-300 truncate">{activeSchool.id}</p>
                </div>
                <div>
                  <span className="text-gray-500">Plan:</span>
                  <p className="capitalize font-semibold text-purple-400">{activeSchool.plan}</p>
                </div>
                <div>
                  <span className="text-gray-500">Enrolled Students:</span>
                  <p className="font-bold text-white">{activeSchool.studentCount ?? 0}</p>
                </div>
                <div>
                  <span className="text-gray-500">Staff Count:</span>
                  <p className="font-bold text-white">{activeSchool.staffCount ?? 0}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500">Address</p>
                <p className="text-gray-300">{activeSchool.address || "None"}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-gray-300">{activeSchool.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-gray-300 truncate">{activeSchool.email || "—"}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-gray-800">
              <button
                onClick={() => { setViewModal(false); handleSwitchToSchool(activeSchool); }}
                className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-semibold">
                <ExternalLink className="w-3.5 h-3.5" /> Launch Dashboard
              </button>
              <button
                type="button"
                onClick={() => setViewModal(false)}
                className="px-4 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModal && activeSchool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-gray-950 border border-red-900/60 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-950 text-red-500 flex items-center justify-center mx-auto border border-red-800">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-white">Delete School?</h3>
              <p className="text-xs text-gray-400 mt-1">
                Are you sure you want to delete <strong className="text-red-400">{activeSchool.name}</strong>? This action will permanently remove the school record from the platform registry.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModal(false)}
                className="flex-1 py-2 text-xs text-gray-300 hover:text-white bg-gray-900 border border-gray-800 rounded-lg">
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleDeleteSubmit}
                className="flex-1 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">
                {saving ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
