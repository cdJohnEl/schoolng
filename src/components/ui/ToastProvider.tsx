"use client";
import { useToast, ToastContainer } from "@/components/ui/Toast";
export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const { toasts, remove } = useToast();
  return <>{children}<ToastContainer toasts={toasts} remove={remove} /></>;
}
