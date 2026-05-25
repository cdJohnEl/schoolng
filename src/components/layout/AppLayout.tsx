"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Sidebar from "@/components/layout/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, appUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/auth/login"); return; }
    // Only redirect if appUser is fully loaded AND has no schoolId
    if (appUser !== null && !appUser.schoolId) {
      router.replace("/auth/signup");
    }
  }, [user, appUser, loading, router]);

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
