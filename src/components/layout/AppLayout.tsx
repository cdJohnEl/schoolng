"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Sidebar from "@/components/layout/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, appUser, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/auth/login"); return; }

    // If teacher attempts to access restricted financial or administrative pages
    if (appUser?.role === "teacher") {
      const restrictedPrefixes = ["/fees", "/billing", "/staff", "/settings", "/communications"];
      if (restrictedPrefixes.some(p => pathname.startsWith(p))) {
        router.replace("/dashboard");
        return;
      }
    }

    // Only redirect to signup if not super admin and has no schoolId
    if (appUser !== null && !appUser.schoolId && appUser.role !== "super_admin") {
      router.replace("/auth/signup");
    }
  }, [user, appUser, loading, router, pathname]);

  // Show spinner while: initial load, OR user exists but appUser not yet fetched
  if (loading || (user && appUser === null)) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading workspace…</p>
      </div>
    </div>
  );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="min-h-screen" style={{ paddingLeft: "var(--sidebar-width)" }}>
        {children}
      </main>
    </div>
  );
}
