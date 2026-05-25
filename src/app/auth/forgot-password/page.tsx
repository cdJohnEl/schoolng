"use client";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const { sendReset } = useAuth();
  const [email, setEmail]     = useState("");
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await sendReset(email);
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Link href="/auth/login" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gray-800 mb-6 -mt-1">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
      </Link>

      {sent ? (
        <div className="text-center">
          <div className="w-14 h-14 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <Mail className="w-7 h-7 text-brand-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Check your inbox</h1>
          <p className="text-sm text-muted-foreground mb-6">
            If <strong>{email}</strong> is registered, a password reset link is on its way.
          </p>
          <Link href="/auth/login" className="inline-block px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors">
            Back to sign in
          </Link>
        </div>
      ) : (
        <>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Reset your password</h1>
          <p className="text-sm text-muted-foreground mb-7">Enter your email and we&apos;ll send a reset link.</p>
          {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="admin@school.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-gray-400" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>
        </>
      )}
    </>
  );
}
