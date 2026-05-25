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
    } catch {
      setError("Invalid email or password. Please try again.");
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
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
            placeholder="admin@school.com" className={INPUT} />
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
          className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/auth/signup" className="text-brand-600 font-medium hover:underline">Create one free</Link>
      </p>
    </>
  );
}
