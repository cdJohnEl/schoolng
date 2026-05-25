"use client";
import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, XCircle, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "warning";
interface Toast { id: string; type: ToastType; message: string; }

let globalToast: ((msg: string, type?: ToastType) => void) | null = null;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const add = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts(p => [...p, { id, type, message }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);
  const remove = useCallback((id: string) => setToasts(p => p.filter(t => t.id !== id)), []);
  useEffect(() => { globalToast = add; return () => { globalToast = null; }; }, [add]);
  return { toasts, add, remove };
}

export function toast(message: string, type: ToastType = "success") { globalToast?.(message, type); }

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />,
  error:   <XCircle      className="w-4 h-4 text-red-500 flex-shrink-0" />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />,
};

export function ToastContainer({ toasts, remove }: { toasts: Toast[]; remove: (id: string) => void }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 max-w-xs w-full pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg bg-white pointer-events-auto animate-fade-in",
          t.type === "error" ? "border-red-100" : t.type === "warning" ? "border-amber-100" : "border-green-100"
        )}>
          {ICONS[t.type]}
          <p className="text-sm text-gray-800 flex-1">{t.message}</p>
          <button onClick={() => remove(t.id)} className="text-gray-400 hover:text-gray-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
