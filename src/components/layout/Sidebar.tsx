"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { cn, getInitials } from "@/lib/utils";
import {
  LayoutDashboard, Users, CreditCard, CalendarCheck,
  BarChart3, FileText, MessageSquare, UserCog,
  Settings, LogOut, ChevronDown, GraduationCap, CreditCard as BillingIcon,
  ListChecks, ArrowUpCircle,
} from "lucide-react";

const NAV = [
  { label: "Dashboard",      href: "/dashboard",      icon: LayoutDashboard },
  { label: "Students",       href: "/students",       icon: Users },
  { label: "Fees",           href: "/fees",           icon: CreditCard },
  { label: "Attendance",     href: "/attendance",     icon: CalendarCheck },
  { label: "Results",        href: "/results",        icon: BarChart3 },
  { label: "Report cards",   href: "/report-cards",   icon: FileText },
  { label: "Staff",          href: "/staff",          icon: UserCog },
  { label: "Communications", href: "/communications", icon: MessageSquare },
  { label: "Fee structure",  href: "/fees/structure", icon: ListChecks },
  { label: "Promote students", href: "/students/promote", icon: ArrowUpCircle },
  { label: "Settings",       href: "/settings",       icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { appUser, user, signOut } = useAuth();
  const [schoolName, setSchoolName] = useState("");

  const displayName = user?.displayName ?? "Admin";
  const email       = user?.email ?? "";
  const active = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  useEffect(() => {
    const sid = appUser?.schoolId;
    if (!sid) return;
    getDoc(doc(db, "schools", sid))
      .then(snap => { if (snap.exists()) setSchoolName(snap.data().name ?? ""); })
      .catch(() => {});
  }, [appUser?.schoolId]);

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex flex-col w-[var(--sidebar-width)]
      bg-gray-950 border-r border-gray-800 overflow-y-auto">

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-800">
        <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white leading-none">SchoolNG</p>
          <p className="text-[10px] text-gray-500 mt-0.5">School Management</p>
        </div>
      </div>

      {/* School chip */}
      <div className="px-3 py-3 border-b border-gray-800">
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-gray-900">
          <div className="w-7 h-7 rounded-md bg-brand-900 flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-3.5 h-3.5 text-brand-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-200 truncate leading-none">
              {schoolName || "My School"}
            </p>
            <p className="text-[10px] text-gray-500 mt-0.5 capitalize">
              {appUser?.role ?? "proprietor"}
            </p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-gray-600" />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ label, href, icon: Icon }) => (
          <Link key={href} href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
              active(href)
                ? "bg-brand-600 text-white font-medium"
                : "text-gray-400 hover:text-gray-100 hover:bg-gray-800"
            )}>
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Billing */}
      <div className="px-3 pb-3 border-t border-gray-800 pt-3">
        <Link href="/billing"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
            active("/billing")
              ? "bg-brand-600 text-white font-medium"
              : "text-gray-400 hover:text-gray-100 hover:bg-gray-800"
          )}>
          <BillingIcon className="w-4 h-4 flex-shrink-0" />
          Billing
        </Link>
      </div>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-gray-800">
        <div className="flex items-center gap-3 px-2.5 py-2">
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center
            text-xs font-semibold text-white flex-shrink-0">
            {getInitials(displayName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-200 truncate leading-none">{displayName}</p>
            <p className="text-[10px] text-gray-500 truncate mt-0.5">{email}</p>
          </div>
          <button onClick={signOut} title="Sign out"
            className="p-1 text-gray-600 hover:text-red-400 transition-colors rounded">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
