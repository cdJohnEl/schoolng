"use client";

import { useState } from "react";
import Link from "next/link";
import {
  GraduationCap, CheckCircle2, ArrowRight, BookOpen,
  Award, CreditCard, Users, CalendarCheck, ClipboardList,
  ShieldCheck, ChevronDown, Star, Phone, Mail,
  Check, Play, School, Sparkles, Building2, UserCheck,
  FileSpreadsheet, ArrowUpRight, BarChart3, Lock,
  Printer, Smartphone, HelpCircle
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function LandingPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"proprietor" | "teacher" | "parent">("proprietor");
  const [previewTab, setPreviewTab] = useState<"report" | "teacher" | "fees" | "exams">("report");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "Does SchoolNG strictly follow the Nigerian WAEC and NERDC grading scale?",
      a: "Yes! SchoolNG is calibrated specifically for the Nigerian education system. It automatically compiles Continuous Assessment (CA1 + CA2 = max 40 marks) + Terminal Examination (max 60 marks) for a total of 100 marks. It instantly assigns standard WAEC letter grades (A1, B2, B3, C4, C5, C6, D7, E8, F9) and calculates accurate class positions (1st, 2nd, 3rd) without manual math errors."
    },
    {
      q: "Are standard Nigerian subjects pre-loaded when I create a new school?",
      a: "Yes. Every newly created school automatically arrives pre-loaded with over 20 standard Nigerian curriculum subjects (Mathematics, English Language, Basic Science & Technology, Civic Education, Agricultural Science, Computer Studies/ICT, CRS/IRS, Physics, Chemistry, Biology, Economics, Literature, etc.). You can easily customize, edit, add, or toggle subjects for specific classes."
    },
    {
      q: "How do dedicated teacher accounts and logins work?",
      a: "Whenever you add a teacher, SchoolNG automatically generates a personalized username (e.g. babajide.sanusi or chioma.eze) and password. Teachers get their own dedicated Teacher Workspace where they can take class attendance, enter CA and examination scores, add students to their classes, and compose report card remarks. Critical proprietor financial records and fee collections remain strictly isolated and hidden from teachers."
    },
    {
      q: "Can we track school fees, debtor lists, and accept Paystack payments?",
      a: "Yes! You can configure fee schedules per class (Tuition, Development Levy, Bus Service, Books, Uniforms). You can record manual bank transfers, cash payments, or generate Paystack payment links. SchoolNG generates instant printable receipts with official stamps and maintains an up-to-the-minute debtor list."
    },
    {
      q: "Can we conduct tests, quizzes, and continuous assessments online?",
      a: "Yes! SchoolNG includes a dedicated Tests & Exams module where teachers can create continuous assessment tests and quizzes, schedule them for their classes, and have scores automatically feed right into the student's terminal report cards."
    },
    {
      q: "How fast can we set up our school?",
      a: "In less than 2 minutes! Create your account, choose your school name, and your classes, default academic session, and curriculum subjects are pre-loaded immediately. You can start enrolling students and entering scores right away."
    }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-brand-600 selection:text-white">

      {/* TOP NOTIFICATION BANNER */}
      <div className="bg-brand-950 text-brand-100 text-xs py-2 px-4 text-center font-medium border-b border-brand-900">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 flex-wrap">
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-brand-900 text-white font-semibold text-[10px] tracking-wide uppercase border border-brand-700/60">
            🇳🇬 2025/2026 Ready
          </span>
          <span>Calibrated for Nigerian Nursery, Primary & Secondary Schools. Official NERDC & WAEC grading standard.</span>
          <Link href="/auth/signup" className="underline font-bold text-white hover:text-brand-200 ml-1">
            Set Up Free &rarr;
          </Link>
        </div>
      </div>

      {/* STICKY TOP NAVIGATION */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-600/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl text-slate-900 tracking-tight">SchoolNG</span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200/60">
                  School OS
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">Modern Nigerian School Management</p>
            </div>
          </Link>

          {/* Nav links */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-brand-600 transition-colors">Features</a>
            <a href="#teacher-portal" className="hover:text-brand-600 transition-colors">Teacher Portal</a>
            <a href="#report-cards" className="hover:text-brand-600 transition-colors">WAEC Reports</a>
            <a href="#curriculum" className="hover:text-brand-600 transition-colors">Pre-loaded Subjects</a>
            <a href="#pricing" className="hover:text-brand-600 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-brand-600 transition-colors">FAQ</a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-md shadow-brand-600/20 flex items-center gap-2"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-brand-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-4.5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md shadow-brand-600/20 flex items-center gap-1.5"
                >
                  <span>Start Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 bg-gradient-to-b from-brand-50/40 via-white to-slate-50/50">
        
        {/* Subtle decorative background accents */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 pointer-events-none opacity-40">
          <div className="absolute top-10 left-10 w-72 h-72 bg-brand-200/40 rounded-full blur-3xl" />
          <div className="absolute top-12 right-10 w-80 h-80 bg-blue-100/50 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
          
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-brand-200 text-xs font-semibold text-brand-800 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
            <span>Built Specifically for Nigerian Nursery, Primary & Secondary Schools</span>
          </div>

          {/* Hero Headline */}
          <div className="max-w-4xl mx-auto space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
              Run Your School on Autopilot. <br />
              <span className="text-brand-600">Without Spreadsheet Chaos.</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto font-normal leading-relaxed">
              Automate WAEC/NERDC terminal report cards, give every teacher their own secure login to submit CA scores, track termly tuition with Paystack, and deliver instant printable receipts.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <Link
              href="/auth/signup"
              className="w-full sm:w-auto px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm sm:text-base rounded-xl transition-all shadow-lg shadow-brand-600/25 flex items-center justify-center gap-2 group hover:-translate-y-0.5"
            >
              <span>Create Your School — Free</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/auth/login"
              className="w-full sm:w-auto px-7 py-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-sm sm:text-base rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 hover:-translate-y-0.5"
            >
              <Play className="w-4 h-4 text-brand-600 fill-brand-600" />
              <span>Explore Live Demo Login</span>
            </Link>
          </div>

          {/* Value Props Strip */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-y-2 gap-x-8 text-xs font-semibold text-slate-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-brand-600" />
              <span>20+ Nigerian Subjects Pre-loaded</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-brand-600" />
              <span>Dedicated Teacher Logins (Username & Password)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-brand-600" />
              <span>Official WAEC A1–F9 Grading Standard</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-brand-600" />
              <span>Paystack & Bank Transfer Reconciliation</span>
            </div>
          </div>

          {/* QUICK 1-CLICK DEMO ACCESS BAR */}
          <div className="max-w-4xl mx-auto pt-6">
            <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-left">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-sm text-white">Experience SchoolNG with pre-configured accounts:</span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">Click any role to test proprietor, teacher, or super admin capabilities instantly.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <Link
                  href="/auth/login"
                  className="flex-1 md:flex-none px-3.5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Proprietor Demo</span>
                </Link>

                <Link
                  href="/auth/login"
                  className="flex-1 md:flex-none px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Teacher Demo</span>
                </Link>

                <Link
                  href="/auth/login"
                  className="flex-1 md:flex-none px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Super Admin</span>
                </Link>
              </div>
            </div>
          </div>

          {/* INTERACTIVE PRODUCT SHOWCASE (BROWSER MOCKUP) */}
          <div id="report-cards" className="pt-6 max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl overflow-hidden text-left">
              
              {/* Window chrome header */}
              <div className="bg-slate-100/90 px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="ml-2 text-xs font-mono text-slate-500 hidden sm:inline-block">
                    schoolng.com/app/terminal-report-sheet
                  </span>
                </div>

                {/* Tab Switcher */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs text-xs font-semibold">
                  <button
                    onClick={() => setPreviewTab("report")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      previewTab === "report"
                        ? "bg-brand-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    WAEC Report Card
                  </button>
                  <button
                    onClick={() => setPreviewTab("teacher")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      previewTab === "teacher"
                        ? "bg-brand-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Teacher Portal
                  </button>
                  <button
                    onClick={() => setPreviewTab("fees")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      previewTab === "fees"
                        ? "bg-brand-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Fee Collections
                  </button>
                  <button
                    onClick={() => setPreviewTab("exams")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      previewTab === "exams"
                        ? "bg-brand-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Tests & Exams
                  </button>
                </div>
              </div>

              {/* TAB 1: WAEC REPORT CARD PREVIEW */}
              {previewTab === "report" && (
                <div className="p-6 sm:p-8 space-y-6">
                  {/* School letterhead */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-brand-600 text-white font-extrabold flex items-center justify-center text-lg shadow-sm">
                        AC
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">Apex Crest International College</h3>
                        <p className="text-xs text-slate-500">Government Approved · WAEC & NECO Examination Centre No. 420911</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-brand-50 text-brand-800 border border-brand-200 text-xs font-bold rounded-lg">
                        Term Position: 1st / 42 Students
                      </span>
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg">
                        1st Term 2025/2026
                      </span>
                    </div>
                  </div>

                  {/* Student bio strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-500 block">Student Name:</span>
                      <span className="font-bold text-slate-900 text-sm">Chidera Emmanuel Okonkwo</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Class:</span>
                      <span className="font-bold text-slate-900 text-sm">SS 2 Gold (Science)</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Admission Number:</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">APX/2023/084</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Term Average:</span>
                      <span className="font-extrabold text-brand-600 text-sm">89.4% (Distinction)</span>
                    </div>
                  </div>

                  {/* Sample Scores Table */}
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100/80 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-4">Subject</th>
                          <th className="py-2.5 px-3 text-center">CA (40)</th>
                          <th className="py-2.5 px-3 text-center">Exam (60)</th>
                          <th className="py-2.5 px-3 text-center font-bold">Total (100)</th>
                          <th className="py-2.5 px-3 text-center">WAEC Grade</th>
                          <th className="py-2.5 px-4">Subject Teacher Remark</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        <tr className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-4 font-bold text-slate-900">General Mathematics</td>
                          <td className="py-2.5 px-3 text-center font-mono">38</td>
                          <td className="py-2.5 px-3 text-center font-mono">56</td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-brand-600">94</td>
                          <td className="py-2.5 px-3 text-center"><span className="px-2 py-0.5 rounded bg-brand-100 text-brand-800 font-extrabold">A1</span></td>
                          <td className="py-2.5 px-4 text-slate-600">Outstanding mathematical thinking</td>
                        </tr>
                        <tr className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-4 font-bold text-slate-900">English Language</td>
                          <td className="py-2.5 px-3 text-center font-mono">36</td>
                          <td className="py-2.5 px-3 text-center font-mono">51</td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-brand-600">87</td>
                          <td className="py-2.5 px-3 text-center"><span className="px-2 py-0.5 rounded bg-brand-100 text-brand-800 font-extrabold">A1</span></td>
                          <td className="py-2.5 px-4 text-slate-600">Eloquent written and oral expression</td>
                        </tr>
                        <tr className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-4 font-bold text-slate-900">Chemistry</td>
                          <td className="py-2.5 px-3 text-center font-mono">35</td>
                          <td className="py-2.5 px-3 text-center font-mono">48</td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-brand-600">83</td>
                          <td className="py-2.5 px-3 text-center"><span className="px-2 py-0.5 rounded bg-brand-100 text-brand-800 font-extrabold">A1</span></td>
                          <td className="py-2.5 px-4 text-slate-600">Brilliant practical grasp</td>
                        </tr>
                        <tr className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-4 font-bold text-slate-900">Physics</td>
                          <td className="py-2.5 px-3 text-center font-mono">33</td>
                          <td className="py-2.5 px-3 text-center font-mono">45</td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-blue-700">78</td>
                          <td className="py-2.5 px-3 text-center"><span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-extrabold">B2</span></td>
                          <td className="py-2.5 px-4 text-slate-600">Very good conceptual problem solver</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Remarks and Action strip */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 text-xs">
                    <div className="space-y-1">
                      <p className="text-slate-700"><span className="font-bold text-slate-900">Class Teacher:</span> Mrs. N. Okafor — <em>&ldquo;Exceptional consistency and leadership.&rdquo;</em></p>
                      <p className="text-slate-700"><span className="font-bold text-slate-900">Principal Remark:</span> <em>&ldquo;A brilliant student. Keep up the high standard!&rdquo;</em></p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-sm">
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print PDF Report Card</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: TEACHER PORTAL PREVIEW */}
              {previewTab === "teacher" && (
                <div className="p-6 sm:p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
                          Teacher Workspace Active
                        </span>
                        <span className="text-xs text-slate-500">Username: <code className="font-mono text-slate-800 font-bold">babajide.sanusi</code></span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mt-1">Good morning, Mr. Babajide Sanusi 👋</h3>
                      <p className="text-xs text-slate-500">Subject Master: Mathematics & Chemistry · Form Teacher: SS 2 Gold</p>
                    </div>

                    <div className="flex items-center gap-2 bg-brand-50 text-brand-800 border border-brand-200 px-3 py-1.5 rounded-xl text-xs font-semibold">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Proprietor financials & fee ledger protected</span>
                    </div>
                  </div>

                  {/* Teacher Quick Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-xs text-slate-500">My Students</span>
                      <p className="text-xl font-extrabold text-slate-900 mt-1">42 Enrolled</p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-xs text-slate-500">Today&apos;s Roll Call</span>
                      <p className="text-xl font-extrabold text-brand-600 mt-1">41 / 42 Present</p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-xs text-slate-500">CA Scores Submitted</span>
                      <p className="text-xl font-extrabold text-blue-700 mt-1">100% Up to date</p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-xs text-slate-500">Terminal Exam Entry</span>
                      <p className="text-xl font-extrabold text-amber-700 mt-1">Pending Approval</p>
                    </div>
                  </div>

                  {/* Teacher actions bar */}
                  <div className="p-4 bg-brand-50/60 rounded-xl border border-brand-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
                      <span className="text-slate-800 font-medium">Teachers can enter continuous assessments, mark attendance registers, and submit comments in seconds.</span>
                    </div>
                    <Link href="/auth/login" className="px-3.5 py-1.5 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 shrink-0">
                      Test Teacher Login &rarr;
                    </Link>
                  </div>
                </div>
              )}

              {/* TAB 3: FEES & PAYSTACK PREVIEW */}
              {previewTab === "fees" && (
                <div className="p-6 sm:p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Termly Fee Collections & Reconciliation</h3>
                      <p className="text-xs text-slate-500">First Term 2025/2026 Tuition, Development Levy, Bus & Uniforms</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-brand-100 text-brand-800 text-xs font-bold rounded-lg">
                        Paystack Gateway Active
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-xs text-slate-500">Total Billed Fees</span>
                      <p className="text-xl font-extrabold text-slate-900 mt-1">₦14,850,000</p>
                      <span className="text-[11px] text-slate-500">420 Students</span>
                    </div>
                    <div className="p-4 rounded-xl bg-brand-50 border border-brand-200">
                      <span className="text-xs text-brand-800">Total Collected</span>
                      <p className="text-xl font-extrabold text-brand-600 mt-1">₦12,320,000</p>
                      <span className="text-[11px] text-brand-700 font-semibold">83% collection rate</span>
                    </div>
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                      <span className="text-xs text-amber-800">Outstanding Debtors</span>
                      <p className="text-xl font-extrabold text-amber-700 mt-1">₦2,530,000</p>
                      <span className="text-[11px] text-amber-800 font-semibold">1-Click SMS Reminder Ready</span>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                    <div className="bg-slate-100/80 px-4 py-2.5 font-bold text-slate-700 flex justify-between">
                      <span>Recent Fee Transactions</span>
                      <span>Verified Receipts</span>
                    </div>
                    <div className="divide-y divide-slate-100">
                      <div className="p-3 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900">Oluwaseun Adeleke</span>
                          <span className="text-slate-500 block text-[11px]">JSS 1 White · Full Tuition + Bus</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-brand-600">₦185,000</span>
                          <span className="text-[10px] text-slate-400 block">Paystack Ref: PSTK_98241</span>
                        </div>
                      </div>
                      <div className="p-3 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900">Fatima Ibrahim</span>
                          <span className="text-slate-500 block text-[11px]">SS 3 Diamond · Tuition Deposit</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-brand-600">₦120,000</span>
                          <span className="text-[10px] text-slate-400 block">Bank Transfer (Verified)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: EXAMS & CBT PREVIEW */}
              {previewTab === "exams" && (
                <div className="p-6 sm:p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Continuous Assessment & CBT Exams</h3>
                      <p className="text-xs text-slate-500">Schedule tests, set question banks, and sync scores automatically to report cards.</p>
                    </div>
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded-lg self-start">
                      Auto-Grading Active
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">SS 2 Chemistry Mid-Term Test</span>
                        <span className="px-2 py-0.5 rounded bg-brand-100 text-brand-800 font-semibold text-[10px]">Completed</span>
                      </div>
                      <p className="text-slate-500">30 Questions · Duration: 40 Mins · CA Weight: 20%</p>
                      <div className="pt-2 flex items-center justify-between font-medium">
                        <span className="text-slate-600">Average Score: 78.5%</span>
                        <span className="text-brand-600 font-bold">Synced to Report Sheet ✓</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">JSS 3 Basic Science Mock Exam</span>
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold text-[10px]">Scheduled</span>
                      </div>
                      <p className="text-slate-500">60 Questions · BECE Preparation standard</p>
                      <div className="pt-2 flex items-center justify-between font-medium">
                        <span className="text-slate-600">Date: Next Tuesday</span>
                        <span className="text-blue-700 font-bold">58 Students Assigned</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </section>

      {/* 6 CORE PILLARS GRID */}
      <section id="features" className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs uppercase font-extrabold tracking-widest text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
              Purpose-Built for Nigeria
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Everything Your School Needs to Run Smoothly
            </h2>
            <p className="text-base text-slate-600">
              Built in partnership with Nigerian educators to eliminate administrative bottlenecks, late report cards, and revenue leakage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <div className="bg-slate-50/70 p-7 rounded-2xl border border-slate-200 hover:border-brand-500/50 hover:shadow-lg transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-800 flex items-center justify-center font-bold">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Pre-Loaded Nigerian Curriculum</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                When you create a school, over 20 standard NERDC subjects are already loaded for Nursery, Primary, JSS, and SSS. No manual setup needed — customize or add special subjects anytime.
              </p>
              <div className="pt-2 flex items-center gap-1.5 text-xs font-bold text-brand-600">
                <span>Mathematics, English, Civic, Science & more</span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-50/70 p-7 rounded-2xl border border-slate-200 hover:border-brand-500/50 hover:shadow-lg transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                <UserCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Dedicated Teacher Portals</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Every teacher gets their own unique username (e.g. <code>babajide.sanusi</code>) and password. Teachers record attendance, input CA scores, and write remarks while proprietor finances remain strictly confidential.
              </p>
              <div className="pt-2 flex items-center gap-1.5 text-xs font-bold text-blue-700">
                <span>Role-based access & financial isolation</span>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-50/70 p-7 rounded-2xl border border-slate-200 hover:border-brand-500/50 hover:shadow-lg transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">WAEC / NERDC Automated Reports</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Calculates Continuous Assessment (40%) + Terminal Exam (60%) = 100%. Generates exact WAEC letter grades (A1 to F9), class positions, averages, and beautiful printable report sheets.
              </p>
              <div className="pt-2 flex items-center gap-1.5 text-xs font-bold text-purple-700">
                <span>1-Click PDF batch generation</span>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-50/70 p-7 rounded-2xl border border-slate-200 hover:border-brand-500/50 hover:shadow-lg transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Fee Tracking & Paystack Payments</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Set termly fee packages per class. Receive bank transfers and online card payments via Paystack. Issue verified stamped receipts and automatically track debtor lists.
              </p>
              <div className="pt-2 flex items-center gap-1.5 text-xs font-bold text-amber-800">
                <span>Instant receipts & debtor tracking</span>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="bg-slate-50/70 p-7 rounded-2xl border border-slate-200 hover:border-brand-500/50 hover:shadow-lg transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Daily Attendance & Roll Call</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Teachers mark daily attendance on mobile phones or laptops in under 30 seconds. Track attendance percentages on terminal report cards and send instant absent notices to parents.
              </p>
              <div className="pt-2 flex items-center gap-1.5 text-xs font-bold text-indigo-700">
                <span>Mobile-friendly teacher register</span>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="bg-slate-50/70 p-7 rounded-2xl border border-slate-200 hover:border-brand-500/50 hover:shadow-lg transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Super Admin Multi-School Hub</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Full platform administration dashboard allows viewing all schools, student census, staff counts, subscription plans, and managing tenants seamlessly.
              </p>
              <div className="pt-2 flex items-center gap-1.5 text-xs font-bold text-rose-700">
                <span>Full multi-school CRUD operations</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CURRICULUM DIRECTORY PREVIEW */}
      <section id="curriculum" className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-700">Standard Nigerian Subjects</span>
            <h2 className="text-3xl font-extrabold text-slate-900">Pre-Loaded Out of The Box</h2>
            <p className="text-sm text-slate-600">Every school you create is immediately populated with official NERDC curriculum subjects.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {[
              "General Mathematics", "English Language", "Basic Science", "Basic Technology",
              "Civic Education", "Social Studies", "Agricultural Science", "Computer Studies (ICT)",
              "Christian Religious Studies (CRS)", "Islamic Religious Studies (IRS)", "Biology",
              "Chemistry", "Physics", "Economics", "Government", "Literature-in-English",
              "Commerce", "Financial Accounting", "Further Mathematics", "Yoruba / Igbo / Hausa"
            ].map((sub, idx) => (
              <div key={idx} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2.5">
                <Check className="w-4 h-4 text-brand-600 shrink-0" />
                <span className="text-xs font-bold text-slate-800 truncate">{sub}</span>
              </div>
            ))}
          </div>

          <div className="text-center pt-2">
            <p className="text-xs text-slate-500">
              * Need to add French, Music, Home Economics, or Technical Drawing? Add or remove unlimited subjects with 1 click in School Settings.
            </p>
          </div>
        </div>
      </section>

      {/* WHO IS IT FOR SECTION */}
      <section id="teacher-portal" className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-700">Role-Tailored Workspaces</span>
            <h2 className="text-3xl font-extrabold text-slate-900">Engineered for Everyone in Your School</h2>
          </div>

          {/* Persona selector */}
          <div className="flex justify-center">
            <div className="inline-flex p-1.5 bg-slate-100 rounded-2xl border border-slate-200 shadow-xs">
              <button
                onClick={() => setActiveTab("proprietor")}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeTab === "proprietor"
                    ? "bg-brand-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                School Proprietors & Principals
              </button>
              <button
                onClick={() => setActiveTab("teacher")}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeTab === "teacher"
                    ? "bg-brand-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Classroom Teachers
              </button>
              <button
                onClick={() => setActiveTab("parent")}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeTab === "parent"
                    ? "bg-brand-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Parents & Guardians
              </button>
            </div>
          </div>

          {/* Persona Content Card */}
          <div className="max-w-4xl mx-auto bg-slate-50 border border-slate-200 rounded-2xl p-8 sm:p-10 shadow-sm">
            {activeTab === "proprietor" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <span className="px-3 py-1 bg-brand-100 text-brand-800 text-xs font-bold rounded-lg">
                    Full Executive Oversight
                  </span>
                  <h3 className="text-2xl font-extrabold text-slate-900">Total peace of mind over school finances & academics</h3>
                  <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
                      <span>Live fee dashboard with Paystack settlement tracking</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
                      <span>Approve report cards before publishing to parents</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
                      <span>Manage staff salaries, teacher roles, and school settings</span>
                    </li>
                  </ul>
                  <Link href="/auth/signup" className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white font-bold text-xs rounded-xl hover:bg-brand-700">
                    <span>Register School as Proprietor</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3 text-xs">
                  <div className="font-bold text-slate-900 pb-2 border-b border-slate-100 flex justify-between">
                    <span>Executive Summary</span>
                    <span className="text-brand-600">Live</span>
                  </div>
                  <div className="flex justify-between py-1"><span>Total Students Enrolled:</span> <strong className="text-slate-900">420</strong></div>
                  <div className="flex justify-between py-1"><span>Active Staff Members:</span> <strong className="text-slate-900">28</strong></div>
                  <div className="flex justify-between py-1"><span>Tuition Realization:</span> <strong className="text-brand-600 font-bold">88.5%</strong></div>
                  <div className="flex justify-between py-1"><span>Pending Approvals:</span> <strong className="text-amber-600 font-bold">2 Items</strong></div>
                </div>
              </div>
            )}

            {activeTab === "teacher" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-lg">
                    Focused Work Environment
                  </span>
                  <h3 className="text-2xl font-extrabold text-slate-900">Fast score entry without complicated software</h3>
                  <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Unique username & password (e.g. <code>babajide.sanusi</code>)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Take morning roll call in under 30 seconds on your phone</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Input CA and exam scores with keyboard navigation</span>
                    </li>
                  </ul>
                  <Link href="/auth/login" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-700 text-white font-bold text-xs rounded-xl hover:bg-blue-800">
                    <span>Test Teacher Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3 text-xs">
                  <div className="font-bold text-slate-900 pb-2 border-b border-slate-100 flex justify-between">
                    <span>Teacher Actions</span>
                    <span className="text-blue-700">Quick Links</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 font-medium text-slate-800 flex items-center justify-between">
                    <span>Mark Daily Roll Call</span>
                    <span className="text-brand-600 font-bold">42/42 Present</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 font-medium text-slate-800 flex items-center justify-between">
                    <span>Enter CA 1 Scores (Max 20)</span>
                    <span className="text-blue-700 font-bold">Ready</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 font-medium text-slate-800 flex items-center justify-between">
                    <span>Compose Student Remarks</span>
                    <span className="text-slate-500 font-bold">8 Remaining</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "parent" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-lg">
                    Parent Delight & Trust
                  </span>
                  <h3 className="text-2xl font-extrabold text-slate-900">Instant digital report cards & receipt confirmations</h3>
                  <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Download high-resolution PDF terminal report cards</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Pay fees securely online with Paystack, debit card, or USSD</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Transparent fee breakdown with instant payment receipts</span>
                    </li>
                  </ul>
                  <Link href="/auth/signup" className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white font-bold text-xs rounded-xl hover:bg-brand-700">
                    <span>Start Free for Your School</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3 text-xs">
                  <div className="font-bold text-slate-900 pb-2 border-b border-slate-100 flex justify-between">
                    <span>Parent Portal Sample</span>
                    <span className="text-brand-600">Verified</span>
                  </div>
                  <div className="flex justify-between py-1"><span>Child:</span> <strong className="text-slate-900">Emeka Eze (JSS 2)</strong></div>
                  <div className="flex justify-between py-1"><span>Term Position:</span> <strong className="text-brand-600 font-bold">2nd of 38</strong></div>
                  <div className="flex justify-between py-1"><span>Fee Status:</span> <strong className="text-brand-600 font-bold">Fully Paid (₦140,000)</strong></div>
                  <div className="flex justify-between py-1"><span>Attendance Rate:</span> <strong className="text-slate-900 font-bold">98%</strong></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-700">Simple, Transparent Pricing</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Affordable Plans for Every Nigerian School</h2>
            <p className="text-sm text-slate-600">Billed per school term. No hidden setup charges, no surprise deduction.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            
            {/* Starter */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Starter Free</h3>
                  <p className="text-xs text-slate-500">Perfect for small nursery & preparatory schools</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900">₦0</span>
                  <span className="text-xs text-slate-500 font-medium">/ term</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> Up to 50 active students</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> Standard WAEC/NERDC report cards</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> 20+ Pre-loaded subjects</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> Daily attendance registers</li>
                </ul>
              </div>
              <Link href="/auth/signup" className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl text-center block transition-all">
                Get Started Free
              </Link>
            </div>

            {/* Standard / Recommended */}
            <div className="bg-white p-8 rounded-2xl border-2 border-brand-600 shadow-xl relative flex flex-col justify-between space-y-6">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                Most Popular
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Pro School</h3>
                  <p className="text-xs text-slate-500">For established primary & secondary schools</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-brand-600">₦35,000</span>
                  <span className="text-xs text-slate-500 font-medium">/ term</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> Up to 500 students</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> <strong>Dedicated Teacher Accounts</strong></li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> Paystack & Bank Fee Collections</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> Continuous Assessment & CBT Tests</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> Printable Watermarked PDF Reports</li>
                </ul>
              </div>
              <Link href="/auth/signup" className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl text-center block transition-all shadow-md shadow-brand-600/20">
                Choose Pro School
              </Link>
            </div>

            {/* Enterprise */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Apex Enterprise</h3>
                  <p className="text-xs text-slate-500">For multi-branch campuses & large group schools</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900">₦75,000</span>
                  <span className="text-xs text-slate-500 font-medium">/ term</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> Unlimited students & teachers</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> Multi-campus Super Admin dashboard</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> Custom school badge & custom domain</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> Direct WhatsApp & phone support</li>
                </ul>
              </div>
              <Link href="/auth/signup" className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl text-center block transition-all">
                Contact Enterprise
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-700">Trusted By Educators</span>
            <h2 className="text-3xl font-extrabold text-slate-900">Loved by Principals & Teachers Across Nigeria</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 text-xs sm:text-sm">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400" />)}
              </div>
              <p className="text-slate-700 italic">
                &ldquo;Before SchoolNG, generating report cards at the end of term took our teachers 2 full weeks of manual calculations and spreadsheet errors. Now, teachers submit scores and report sheets are ready in 1 hour!&rdquo;
              </p>
              <div>
                <strong className="block text-slate-900">Mrs. Folashade Adeleke</strong>
                <span className="text-slate-500 text-xs">Proprietress, Crown Crest Model College, Ikeja, Lagos</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 text-xs sm:text-sm">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400" />)}
              </div>
              <p className="text-slate-700 italic">
                &ldquo;The dedicated teacher logins are fantastic. Each of my subject tutors has their own username. They enter test marks directly, but they cannot see school fee collections. The security is top notch.&rdquo;
              </p>
              <div>
                <strong className="block text-slate-900">Mr. Emeka Nwosu</strong>
                <span className="text-slate-500 text-xs">Principal, Graceland Academy, Port Harcourt</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 text-xs sm:text-sm">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400" />)}
              </div>
              <p className="text-slate-700 italic">
                &ldquo;When I created our school, all our Nigerian subjects (Civic, Basic Science, Agricultural Science, Maths) were already there. Setup took less than three minutes! Parents also love paying via Paystack.&rdquo;
              </p>
              <div>
                <strong className="block text-slate-900">Alhaji Bello Mohammed</strong>
                <span className="text-slate-500 text-xs">Director of Academics, Capital Heritage School, Abuja</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-700">Got Questions?</span>
            <h2 className="text-3xl font-extrabold text-slate-900">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left font-bold text-sm sm:text-base text-slate-900 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* BOTTOM CTA BANNER */}
      <section
        style={{ backgroundColor: "#4f46e5" }}
        className="py-16 md:py-20 bg-brand-600 bg-gradient-to-r from-brand-700 via-brand-600 to-indigo-700 text-white relative overflow-hidden shadow-inner"
      >
        {/* Decorative backdrop glows */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-950/30 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <span className="px-3.5 py-1.5 rounded-full bg-white/15 text-white text-xs font-bold inline-block border border-white/25 backdrop-blur-xs">
            🇳🇬 Join 450+ Schools Across Nigeria
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-xs">
            Ready to Transform Your School This Term?
          </h2>
          <p className="text-base sm:text-lg text-blue-100 max-w-2xl mx-auto font-normal leading-relaxed">
            Start free in 2 minutes. Automatic subjects, WAEC report cards, dedicated teacher accounts, and automated fee tracking.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <Link
              href="/auth/signup"
              className="w-full sm:w-auto px-8 py-4 bg-white text-brand-700 hover:bg-blue-50 font-extrabold text-sm sm:text-base rounded-xl transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 group hover:-translate-y-0.5"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4 text-brand-700 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/auth/login"
              className="w-full sm:w-auto px-7 py-4 bg-brand-800 hover:bg-brand-900 text-white font-bold text-sm sm:text-base rounded-xl transition-all border border-white/20 flex items-center justify-center gap-2 backdrop-blur-xs hover:-translate-y-0.5"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Launch Demo System</span>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold">
                <GraduationCap className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-base text-white">SchoolNG</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Nigeria&apos;s leading cloud school management platform. Designed for Nursery, Primary, and Secondary schools.
            </p>
            <p className="text-[11px] text-brand-400 font-semibold">
              Calibrated for WAEC, NECO & NERDC standards.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Features</h4>
            <ul className="space-y-1.5 text-slate-400">
              <li><a href="#features" className="hover:text-white transition-colors">WAEC Report Cards</a></li>
              <li><a href="#teacher-portal" className="hover:text-white transition-colors">Dedicated Teacher Logins</a></li>
              <li><a href="#curriculum" className="hover:text-white transition-colors">Pre-loaded Nigerian Subjects</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Paystack Fee Reconciliation</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Daily Attendance Roll Call</a></li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Support & Roles</h4>
            <ul className="space-y-1.5 text-slate-400">
              <li><Link href="/auth/login" className="hover:text-white transition-colors">Teacher Workspace Login</Link></li>
              <li><Link href="/auth/login" className="hover:text-white transition-colors">Proprietor Dashboard</Link></li>
              <li><Link href="/admin" className="hover:text-white transition-colors">Super Admin Portal</Link></li>
              <li><Link href="/auth/signup" className="hover:text-white transition-colors">Register New School</Link></li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Nigerian Support</h4>
            <p className="text-slate-400 text-xs">
              Lagos · Abuja · Port Harcourt · Ibadan · Enugu
            </p>
            <div className="pt-1 space-y-1 text-slate-400">
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-brand-400" />
                <span>support@schoolng.com</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-brand-400" />
                <span>+234 800 SCHOOLNG</span>
              </div>
            </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-3">
          <span>&copy; {new Date().getFullYear()} SchoolNG Technologies Limited. All rights reserved.</span>
          <span>Made with dedication for Nigerian schools 🇳🇬</span>
        </div>
      </footer>

    </div>
  );
}
