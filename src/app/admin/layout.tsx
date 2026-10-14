"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { GraduationCap, ShieldCheck, ArrowLeft, LogOut } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, appUser, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    // Only super_admin or the platform owner email can access this route
    const isOwner = user.email?.toLowerCase() === "easykelchimdikejohn@gmail.com";
    if (appUser && appUser.role !== "super_admin" && !isOwner) {
      router.replace("/dashboard");
    }
  }, [user, appUser, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Verifying super admin privileges…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      {/* Super Admin Top Header */}
      <header className="h-16 border-b border-gray-800 bg-gray-950 px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-base tracking-tight">SchoolNG</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-300 border border-purple-700/50">
                Super Admin
              </span>
            </div>
            <p className="text-[11px] text-gray-400">Master Platform Operations & School Registry</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 transition-colors border border-gray-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to School App
          </Link>
          <div className="h-4 w-px bg-gray-800" />
          <div className="text-right hidden sm:block">
            <p className="text-xs font-medium text-white">{user?.displayName || "Platform Owner"}</p>
            <p className="text-[10px] text-gray-400">{user?.email}</p>
          </div>
          <button
            onClick={signOut}
            title="Sign out"
            className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Admin Content Area */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
