import Link from "next/link";
import { GraduationCap } from "lucide-react";
export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="text-[120px] font-bold leading-none text-gray-100 select-none mb-2">404</div>
        <div className="flex justify-center mb-6 -mt-4">
          <div className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center shadow-lg">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Page not found</h1>
        <p className="text-sm text-muted-foreground mb-8">This page doesn&apos;t exist. Head back to your dashboard.</p>
        <Link href="/dashboard" className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors">
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
