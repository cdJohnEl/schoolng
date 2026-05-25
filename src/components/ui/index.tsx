import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

// ── Badge ──────────────────────────────────────────────────────────────────
type Variant = "default" | "success" | "warning" | "danger" | "info" | "purple" | "neutral";
const V: Record<Variant, string> = {
  default: "bg-gray-100 text-gray-700",
  success: "bg-green-50 text-green-700",
  warning: "bg-amber-50 text-amber-700",
  danger:  "bg-red-50 text-red-700",
  info:    "bg-blue-50 text-blue-700",
  purple:  "bg-purple-50 text-purple-700",
  neutral: "bg-gray-50 text-gray-500",
};
export function Badge({ children, variant = "default", className }: {
  children: React.ReactNode; variant?: Variant; className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", V[variant], className)}>
      {children}
    </span>
  );
}

export function studentStatusBadge(s: string): Variant {
  return ({ active: "success", graduated: "info", withdrawn: "danger", suspended: "warning" } as Record<string, Variant>)[s] ?? "default";
}
export function paymentStatusBadge(s: string): Variant {
  return ({ paid: "success", partial: "warning", unpaid: "danger" } as Record<string, Variant>)[s] ?? "default";
}
export function gradeBadge(g: string): Variant {
  if (["A1","B2","B3"].includes(g)) return "success";
  if (["C4","C5","C6"].includes(g)) return "info";
  if (["D7","E8"].includes(g)) return "warning";
  return "danger";
}

// ── StatCard ───────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, icon: Icon, iconColor = "text-brand-600", iconBg = "bg-brand-50" }: {
  label: string; value: string; sub?: string;
  icon: LucideIcon; iconColor?: string; iconBg?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <div className={cn("p-2.5 rounded-lg w-fit mb-4", iconBg)}>
        <Icon className={cn("w-5 h-5", iconColor)} />
      </div>
      <p className="text-2xl font-semibold text-gray-900 leading-none">{value}</p>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5 opacity-70">{sub}</p>}
    </div>
  );
}

// ── EmptyState ─────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }: {
  icon: LucideIcon; title: string; description: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-gray-400" />
      </div>
      <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-5">{description}</p>
      {action}
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────
function Shimmer({ className }: { className?: string }) {
  return <div className={cn("bg-gray-200 rounded animate-pulse", className)} />;
}

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="h-11 bg-gray-50 border-b border-gray-100" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-5 py-4 border-b border-gray-100 last:border-0">
          {Array.from({ length: cols }).map((_, j) => (
            <Shimmer key={j} className={`h-4 ${j === 0 ? "w-32" : j === cols - 1 ? "w-12" : "w-20"}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <Shimmer className="w-10 h-10 rounded-lg mb-4" />
      <Shimmer className="h-7 w-24 mb-2" />
      <Shimmer className="h-3.5 w-32 mb-1" />
      <Shimmer className="h-3 w-20" />
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    </div>
  );
}
