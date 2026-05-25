"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Printer, Plus, AlertCircle, CheckCircle2, X } from "lucide-react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import Topbar from "@/components/layout/Topbar";
import { useSchool } from "@/hooks/useSchool";
import { Badge, paymentStatusBadge } from "@/components/ui/index";
import { formatNaira, formatDate } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";
import type { FeePayment, Student, SchoolClass, PaymentMethod } from "@/types";

const INPUT = "w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-gray-400 bg-white";

export default function FeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { appUser } = useAuth();
  const { school } = useSchool();
  const printRef = useRef<HTMLDivElement>(null);

  const [payment, setPayment]   = useState<FeePayment | null>(null);
  const [student, setStudent]   = useState<Student | null>(null);
  const [cls, setCls]           = useState<SchoolClass | null>(null);
  const [loading, setLoading]   = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [showTopUp, setShowTopUp] = useState(false);
  const [saving, setSaving]     = useState(false);

  // Top-up form
  const [topUpAmount, setTopUpAmount]   = useState("");
  const [topUpMethod, setTopUpMethod]   = useState<PaymentMethod>("cash");
  const [topUpRef, setTopUpRef]         = useState("");
  const [topUpNote, setTopUpNote]       = useState("");

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, "feePayments", id))
      .then(async snap => {
        if (!snap.exists()) { setFetchError(true); return; }
        const p = { id: snap.id, ...snap.data() } as FeePayment;
        setPayment(p);
        const [studentSnap, classSnap] = await Promise.all([
          getDoc(doc(db, "students", p.studentId)),
          getDoc(doc(db, "classes", p.classId)),
        ]);
        if (studentSnap.exists()) setStudent({ id: studentSnap.id, ...studentSnap.data() } as Student);
        if (classSnap.exists()) setCls({ id: classSnap.id, ...classSnap.data() } as SchoolClass);
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, [id]);

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payment || !id) return;
    const amount = parseFloat(topUpAmount) || 0;
    if (amount <= 0) return;
    setSaving(true);
    try {
      const newTotalPaid = payment.totalPaid + amount;
      const newBalance   = Math.max(0, payment.totalExpected - newTotalPaid);
      const newStatus    = newBalance === 0 ? "paid" : "partial";
      const newTransaction = {
        id: Date.now().toString(), date: new Date().toISOString(),
        amount, method: topUpMethod,
        reference: topUpRef || undefined,
        receivedBy: appUser?.displayName ?? "Admin",
        note: topUpNote || undefined,
      };
      await updateDoc(doc(db, "feePayments", id), {
        totalPaid: newTotalPaid, balance: newBalance, status: newStatus,
        transactions: [...payment.transactions, newTransaction],
        updatedAt: new Date().toISOString(),
      });
      setPayment(p => p ? { ...p, totalPaid: newTotalPaid, balance: newBalance, status: newStatus, transactions: [...p.transactions, newTransaction] } : p);
      setShowTopUp(false); setTopUpAmount(""); setTopUpRef(""); setTopUpNote("");
      toast(`₦${amount.toLocaleString()} payment recorded`);
    } catch {
      toast("Failed to record payment", "error");
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    if (!content) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Fee Receipt</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; font-size: 12px; padding: 24px; color: #111; }
        .header { text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 12px; margin-bottom: 16px; }
        .school { font-size: 18px; font-weight: bold; color: #4f46e5; }
        .title { font-size: 14px; font-weight: bold; margin-top: 6px; }
        .info { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; background: #f8f7ff; padding: 12px; border-radius: 6px; margin-bottom: 14px; font-size: 11px; }
        .info-row { display: flex; gap: 8px; } .label { font-weight: bold; min-width: 90px; color: #555; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 11px; }
        th { background: #4f46e5; color: white; padding: 6px 8px; text-align: left; }
        td { padding: 5px 8px; border-bottom: 1px solid #eee; }
        .summary { background: #f8f7ff; padding: 10px 12px; border-radius: 6px; font-size: 12px; }
        .summary-row { display: flex; justify-content: space-between; padding: 3px 0; }
        .balance { font-weight: bold; font-size: 14px; color: ${payment?.balance === 0 ? "green" : "red"}; }
        .footer { margin-top: 16px; text-align: center; font-size: 10px; color: #999; }
      </style>
    </head><body>${content}</body></html>`);
    w.document.close(); w.focus();
    setTimeout(() => { w.print(); w.close(); }, 300);
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen"><div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  if (fetchError || !payment) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-3">
      <AlertCircle className="w-8 h-8 text-gray-400" />
      <p className="text-sm text-muted-foreground">Fee record not found.</p>
      <Link href="/fees" className="text-sm text-brand-600 hover:underline">← Back to fees</Link>
    </div>
  );

  const studentName = student ? `${student.firstName} ${student.lastName}` : payment.studentId;
  const className   = cls ? `${cls.name}${cls.arm ? ` ${cls.arm}` : ""}` : payment.classId;

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Fee record" subtitle={`${studentName} · ${payment.term}`}
        actions={
          <div className="flex items-center gap-2">
            {payment.status !== "paid" && (
              <button onClick={() => setShowTopUp(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors">
                <Plus className="w-4 h-4" /> Record payment
              </button>
            )}
            <button onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-gray-200 hover:bg-gray-50 text-sm text-gray-700 rounded-lg transition-colors">
              <Printer className="w-4 h-4" /> Print receipt
            </button>
            <Link href="/fees" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
          </div>
        }
      />

      <div className="flex-1 p-6 max-w-2xl animate-fade-in space-y-4">

        {/* Status summary */}
        <div className={`rounded-xl p-5 flex items-center gap-4 ${payment.status === "paid" ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200"}`}>
          {payment.status === "paid"
            ? <CheckCircle2 className="w-8 h-8 text-green-600 flex-shrink-0" />
            : <AlertCircle className="w-8 h-8 text-amber-600 flex-shrink-0" />}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-gray-900">{studentName}</p>
              <Badge variant={paymentStatusBadge(payment.status)}>{payment.status}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{className} · {payment.term}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-muted-foreground">Balance</p>
            <p className={`text-xl font-bold font-mono ${payment.balance === 0 ? "text-green-700" : "text-red-600"}`}>
              {formatNaira(payment.balance)}
            </p>
          </div>
        </div>

        {/* Fee breakdown */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Fee summary</h2>
          <div className="space-y-2.5">
            {[
              { label: "Total expected", value: formatNaira(payment.totalExpected), style: "text-gray-900" },
              { label: "Total paid",     value: formatNaira(payment.totalPaid),     style: "text-green-700 font-semibold" },
              { label: "Balance",        value: formatNaira(payment.balance),        style: payment.balance === 0 ? "text-green-700" : "text-red-600 font-semibold" },
            ].map(({ label, value, style }) => (
              <div key={label} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className={`text-sm font-mono ${style}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction history */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Payment history</h2>
          </div>
          {payment.transactions.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No payments recorded yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  {["Date","Amount","Method","Reference","Received by"].map(h => (
                    <th key={h} className="px-5 py-2.5 text-left text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payment.transactions.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">{formatDate(t.date)}</td>
                    <td className="px-5 py-3 font-mono font-semibold text-green-700">{formatNaira(t.amount)}</td>
                    <td className="px-5 py-3 capitalize">{t.method.replace("_", " ")}</td>
                    <td className="px-5 py-3 text-muted-foreground font-mono text-xs">{t.reference ?? "—"}</td>
                    <td className="px-5 py-3 text-muted-foreground">{t.receivedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Top-up modal */}
        {showTopUp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-semibold text-gray-900">Record payment</h2>
                <button onClick={() => setShowTopUp(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleTopUp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount (₦) *</label>
                  <input required type="number" min="1" max={payment.balance} value={topUpAmount}
                    onChange={e => setTopUpAmount(e.target.value)}
                    placeholder={`Outstanding: ${formatNaira(payment.balance)}`}
                    className={INPUT} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment method</label>
                  <select value={topUpMethod} onChange={e => setTopUpMethod(e.target.value as PaymentMethod)} className={INPUT}>
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank transfer</option>
                    <option value="paystack">Paystack (online)</option>
                    <option value="pos">POS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Reference / Teller no.</label>
                  <input value={topUpRef} onChange={e => setTopUpRef(e.target.value)} placeholder="Optional" className={INPUT} />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={saving}
                    className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
                    {saving ? "Saving…" : "Record payment"}
                  </button>
                  <button type="button" onClick={() => setShowTopUp(false)}
                    className="px-4 py-2.5 border border-gray-200 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Hidden print receipt */}
        <div ref={printRef} style={{ display: "none" }}>
          <div className="header">
            <div className="school">{school?.name ?? "My School"}</div>
            <div className="title">OFFICIAL FEE RECEIPT</div>
          </div>
          <div className="info">
            {[
              ["Student:", studentName],
              ["Admission No:", student?.admissionNumber ?? "—"],
              ["Class:", className],
              ["Term:", payment.term],
              ["Receipt No:", payment.id.slice(-8).toUpperCase()],
              ["Date:", formatDate(new Date().toISOString())],
            ].map(([l, v]) => (
              <div key={l} className="info-row"><span className="label">{l}</span><span>{v}</span></div>
            ))}
          </div>
          <table>
            <thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>Reference</th><th>Received by</th></tr></thead>
            <tbody>
              {payment.transactions.map(t => (
                <tr key={t.id}>
                  <td>{formatDate(t.date)}</td>
                  <td>₦{t.amount.toLocaleString()}</td>
                  <td style={{ textTransform: "capitalize" }}>{t.method.replace("_"," ")}</td>
                  <td>{t.reference ?? "—"}</td>
                  <td>{t.receivedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="summary">
            <div className="summary-row"><span>Total expected:</span><span>₦{payment.totalExpected.toLocaleString()}</span></div>
            <div className="summary-row"><span>Total paid:</span><span style={{color:"green"}}>₦{payment.totalPaid.toLocaleString()}</span></div>
            <div className="summary-row balance"><span>Balance outstanding:</span><span>₦{payment.balance.toLocaleString()}</span></div>
          </div>
          <div className="footer">This is a computer-generated receipt. · Generated {new Date().toLocaleDateString()}</div>
        </div>
      </div>
    </div>
  );
}
