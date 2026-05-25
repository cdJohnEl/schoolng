"use client";
import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error("[SchoolNG]", error); }, [error]);
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="w-7 h-7 text-red-500" />
        </div>
        <h1 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h1>
        <p className="text-sm text-muted-foreground mb-6">{error?.message ?? "An unexpected error occurred."}</p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={reset} className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4" /> Try again
          </button>
          <Link href="/dashboard" className="px-4 py-2.5 border border-gray-200 hover:bg-white bg-white text-sm font-medium text-gray-700 rounded-lg transition-colors">
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
