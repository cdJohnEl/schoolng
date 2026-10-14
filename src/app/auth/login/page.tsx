"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await signIn(email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid email or password. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const INPUT = "w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder:text-gray-400";

  return (
    <>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Welcome back</h1>
      <p className="text-sm text-muted-foreground mb-7">Sign in to your school dashboard</p>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address or Username</label>
          <input type="text" required value={email} onChange={e => setEmail(e.target.value)}
            placeholder="admin@school.com or username (e.g. babajide.sanusi)" className={INPUT} />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <Link href="/auth/forgot-password" className="text-xs text-brand-600 hover:underline">Forgot password?</Link>
          </div>
          <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••" className={INPUT} />
        </div>
        <button type="submit" disabled={loading}
          className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-muted-foreground font-medium">1-Click Role Logins</span>
          </div>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            disabled={loading}
            onClick={async () => {
              setEmail("admin@schoolng.com");
              setPassword("password123");
              setError("");
              setLoading(true);
              try {
                await signIn("admin@schoolng.com", "password123");
                router.push("/dashboard");
              } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : "Could not sign in with demo account.";
                setError(msg);
              } finally {
                setLoading(false);
              }
            }}
            className="w-full py-2 px-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-medium rounded-lg transition-colors flex items-center justify-between">
            <span>🏫 School Proprietor (Brightstar)</span>
            <span className="text-[11px] text-indigo-600 font-mono">admin@schoolng.com</span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={async () => {
              setEmail("babajide.sanusi");
              setPassword("password123");
              setError("");
              setLoading(true);
              try {
                await signIn("babajide.sanusi", "password123");
                router.push("/dashboard");
              } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : "Could not sign in with teacher account.";
                setError(msg);
              } finally {
                setLoading(false);
              }
            }}
            className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-lg transition-colors flex items-center justify-between">
            <span>👨‍🏫 Teacher Portal (Babajide)</span>
            <span className="text-[11px] text-emerald-700 font-mono">babajide.sanusi</span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={async () => {
              setEmail("Easykelchimdikejohn@gmail.com");
              setPassword("password123");
              setError("");
              setLoading(true);
              try {
                await signIn("Easykelchimdikejohn@gmail.com", "password123");
                router.push("/admin");
              } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : "Could not sign in with admin account.";
                setError(msg);
              } finally {
                setLoading(false);
              }
            }}
            className="w-full py-2 px-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 text-xs font-medium rounded-lg transition-colors flex items-center justify-between">
            <span>👑 Platform Super Admin</span>
            <span className="text-[11px] text-purple-700 font-mono">Easykelchimdikejohn@gmail.com</span>
          </button>
        </div>
      </form>

      <div className="mt-4 p-3 bg-gray-50 border border-gray-100 rounded-lg text-xs text-gray-600 text-center">
        Teachers sign in with their assigned username (e.g. <strong className="text-gray-900">babajide.sanusi</strong>) or email.
      </div>

      <p className="text-center text-sm text-muted-foreground mt-5">
        Don&apos;t have an account?{" "}
        <Link href="/auth/signup" className="text-brand-600 font-medium hover:underline">Create one free</Link>
      </p>
    </>
  );
}
