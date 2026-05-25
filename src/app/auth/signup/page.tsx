"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { ChevronRight } from "lucide-react";
import type { School } from "@/types";

type Step = "account" | "school";
const INPUT = "w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder:text-gray-400";

export default function SignupPage() {
  const { signUp, user, refreshAppUser } = useAuth();
  const router = useRouter();
  const [step, setStep]       = useState<Step>("account");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [schoolName, setSchoolName]   = useState("");
  const [motto, setMotto]             = useState("");
  const [address, setAddress]         = useState("");
  const [phone, setPhone]             = useState("");
  const [schoolEmail, setSchoolEmail] = useState("");

  const handleAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      await signUp(email, password, displayName);
      setStep("school");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      setError(msg.includes("email-already-in-use")
        ? "An account with this email already exists."
        : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(""); setLoading(true);
    try {
      const schoolId = `school_${user.uid}`;
      const school: School = {
        id: schoolId, name: schoolName, motto, address, phone,
        email: schoolEmail || user.email || "",
        ownerId: user.uid, plan: "free",
        createdAt: new Date().toISOString(),
      };
      // Write school doc and update user doc with schoolId
      await setDoc(doc(db, "schools", schoolId), school);
      await setDoc(doc(db, "users", user.uid), { schoolId }, { merge: true });
      // CRITICAL: refresh in-memory appUser so AppLayout sees the new schoolId
      await refreshAppUser();
      router.push("/dashboard");
    } catch {
      setError("Failed to save school details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-7">
        {(["account", "school"] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
              ${step === s || (s === "account" && step === "school") ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-400"}`}>
              {s === "account" && step === "school" ? "✓" : i + 1}
            </div>
            <span className={`text-xs ${step === s ? "text-gray-900 font-medium" : "text-gray-400"}`}>
              {s === "account" ? "Your account" : "School details"}
            </span>
            {i === 0 && <div className="flex-1 h-px bg-gray-200" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {step === "account" ? (
        <>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Create your account</h1>
          <p className="text-sm text-muted-foreground mb-7">Get your school online in 2 minutes</p>
          <form onSubmit={handleAccount} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Your full name</label>
              <input required value={displayName} onChange={e => setDisplayName(e.target.value)}
                placeholder="Adaeze Okonkwo" className={INPUT} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@school.com" className={INPUT} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="At least 8 characters" className={INPUT} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
              {loading ? "Creating account…" : <><span>Continue</span><ChevronRight className="w-4 h-4" /></>}
            </button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
          </p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Set up your school</h1>
          <p className="text-sm text-muted-foreground mb-7">This appears on report cards and receipts</p>
          <form onSubmit={handleSchool} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">School name *</label>
              <input required value={schoolName} onChange={e => setSchoolName(e.target.value)}
                placeholder="Brightstar Academy" className={INPUT} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">School motto</label>
              <input value={motto} onChange={e => setMotto(e.target.value)}
                placeholder="Excellence in all things" className={INPUT} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">School address *</label>
              <input required value={address} onChange={e => setAddress(e.target.value)}
                placeholder="12 Education Avenue, Lagos" className={INPUT} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone number</label>
                <input value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="0801 234 5678" className={INPUT} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">School email</label>
                <input type="email" value={schoolEmail} onChange={e => setSchoolEmail(e.target.value)}
                  placeholder="info@school.com" className={INPUT} />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
              {loading ? "Setting up…" : "Launch my dashboard →"}
            </button>
          </form>
        </>
      )}
    </>
  );
}
