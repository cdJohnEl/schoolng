"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, AlertCircle } from "lucide-react";
import { collection, query, where, getDocs, addDoc, orderBy, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { useSchool } from "@/hooks/useSchool";
import Topbar from "@/components/layout/Topbar";
import { TERMS } from "@/types";
import { formatNaira } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";
import type { SchoolClass, Student, PaymentMethod, FeeStructure } from "@/types";

const INPUT = "w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-gray-400 bg-white";
const LABEL = "block text-sm font-medium text-gray-700 mb-1.5";

export default function RecordPaymentPage() {
  const { appUser } = useAuth();
  const { session } = useSchool();
  const router = useRouter();
  const [classes, setClasses]       = useState<SchoolClass[]>([]);
  const [students, setStudents]     = useState<Student[]>([]);
  const [feeStructure, setFeeStructure] = useState<FeeStructure | null>(null);
  const [saving, setSaving]         = useState(false);
  const schoolId = appUser?.schoolId ?? "";

  const [form, setForm] = useState({
    studentId: "", classId: "", term: TERMS[0] as string,
    totalExpected: "", amount: "", method: "cash" as PaymentMethod,
    reference: "", note: "",
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  // Load classes
  useEffect(() => {
    if (!schoolId) return;
    getDocs(query(collection(db, "classes"), where("schoolId", "==", schoolId), orderBy("order", "asc")))
      .then(snap => setClasses(snap.docs.map(d => ({ id: d.id, ...d.data() } as SchoolClass))))
      .catch(() => {});
  }, [schoolId]);

  // Load students when class changes
  useEffect(() => {
    if (!form.classId || !schoolId) { setStudents([]); return; }
    getDocs(query(
      collection(db, "students"),
      where("schoolId", "==", schoolId),
      where("classId", "==", form.classId),
      where("status", "==", "active"),
      orderBy("lastName", "asc"),
    ))
      .then(snap => setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() } as Student))))
      .catch(() => {});
  }, [form.classId, schoolId]);

  // Load fee structure when class+term changes
  useEffect(() => {
    if (!form.classId || !form.term) return;
    const key = `${form.classId}_${form.term}`;
    getDoc(doc(db, "feeStructures", key))
      .then(snap => {
        if (snap.exists()) {
          const structure = snap.data() as FeeStructure;
          setFeeStructure(structure);
          setForm(f => ({ ...f, totalExpected: String(structure.totalAmount) }));
        } else {
          setFeeStructure(null);
        }
      })
      .catch(() => setFeeStructure(null));
  }, [form.classId, form.term]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolId) return;
    const expected = parseFloat(form.totalExpected) || 0;
    const paid     = parseFloat(form.amount) || 0;
    if (paid <= 0) { toast("Enter a valid payment amount", "warning"); return; }
    setSaving(true);
    try {
      const balance = Math.max(0, expected - paid);
      await addDoc(collection(db, "feePayments"), {
        schoolId,
        studentId: form.studentId,
        classId:   form.classId,
        sessionId: session?.id ?? "",
        term:      form.term,
        totalExpected: expected,
        totalPaid:     paid,
        balance,
        status: balance === 0 ? "paid" : paid > 0 ? "partial" : "unpaid",
        transactions: [{
          id: Date.now().toString(),
          date: new Date().toISOString(),
          amount: paid,
          method: form.method,
          reference: form.reference || undefined,
          receivedBy: appUser?.displayName ?? "Admin",
          note: form.note || undefined,
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      toast("Payment recorded successfully");
      router.push("/fees");
    } catch {
      toast("Failed to record payment", "error");
    } finally {
      setSaving(false);
    }
  };

  const selectedStudent = students.find(s => s.id === form.studentId);

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Record payment" subtitle="Log a student fee payment"
        actions={<Link href="/fees" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"><ArrowLeft className="w-4 h-4" /> Back</Link>}
      />
      <form onSubmit={handleSubmit} className="flex-1 p-6 max-w-xl animate-fade-in space-y-4">

        {/* Student selection */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Select student</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Class *</label>
              <select required className={INPUT} value={form.classId} onChange={e => { set("classId", e.target.value); setForm(f => ({ ...f, studentId: "" })); }}>
                <option value="">Select class…</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}{c.arm ? ` ${c.arm}` : ""}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>Term *</label>
              <select required className={INPUT} value={form.term} onChange={e => set("term", e.target.value)}>
                {TERMS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={LABEL}>Student *</label>
            <select required className={INPUT} value={form.studentId} onChange={e => set("studentId", e.target.value)} disabled={!form.classId}>
              <option value="">Select student…</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.lastName}, {s.firstName} ({s.admissionNumber})</option>)}
            </select>
          </div>

          {/* Student info chip */}
          {selectedStudent && (
            <div className="flex items-center gap-3 px-3 py-2.5 bg-brand-50 rounded-lg border border-brand-100">
              <div className="w-7 h-7 rounded-full bg-brand-200 flex items-center justify-center text-xs font-bold text-brand-800">
                {selectedStudent.firstName[0]}{selectedStudent.lastName[0]}
              </div>
              <div>
                <p className="text-sm font-medium text-brand-900">{selectedStudent.firstName} {selectedStudent.lastName}</p>
                <p className="text-xs text-brand-700">{selectedStudent.admissionNumber} · Parent: {selectedStudent.parentName} · {selectedStudent.parentPhone}</p>
              </div>
            </div>
          )}
        </div>

        {/* Fee details */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Payment details</h2>
            {feeStructure ? (
              <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-full">
                Fee structure loaded · {formatNaira(feeStructure.totalAmount)} expected
              </span>
            ) : form.classId && (
              <span className="text-xs text-amber-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                No fee structure set for this class/term
              </span>
            )}
          </div>

          {/* Fee items breakdown if structure loaded */}
          {feeStructure && feeStructure.items.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
              <p className="text-xs font-medium text-gray-600 mb-2">Fee breakdown:</p>
              {feeStructure.items.map((item, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-mono font-medium text-gray-900">{formatNaira(item.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-semibold border-t border-gray-200 pt-2 mt-2">
                <span>Total</span>
                <span className="font-mono">{formatNaira(feeStructure.totalAmount)}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Total fee expected (₦)</label>
              <input type="number" min="0" className={INPUT} value={form.totalExpected}
                onChange={e => set("totalExpected", e.target.value)} placeholder="e.g. 50000" />
            </div>
            <div>
              <label className={LABEL}>Amount being paid (₦) *</label>
              <input required type="number" min="1" className={INPUT} value={form.amount}
                onChange={e => set("amount", e.target.value)} placeholder="e.g. 50000" />
            </div>
          </div>

          {/* Balance preview */}
          {form.totalExpected && form.amount && (
            <div className={`flex justify-between text-sm px-3 py-2 rounded-lg ${
              parseFloat(form.amount) >= parseFloat(form.totalExpected)
                ? "bg-green-50 text-green-700"
                : "bg-amber-50 text-amber-700"
            }`}>
              <span>Balance after payment:</span>
              <span className="font-mono font-semibold">
                {formatNaira(Math.max(0, parseFloat(form.totalExpected || "0") - parseFloat(form.amount || "0")))}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Payment method *</label>
              <select required className={INPUT} value={form.method} onChange={e => set("method", e.target.value)}>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank transfer</option>
                <option value="paystack">Paystack (online)</option>
                <option value="pos">POS</option>
              </select>
            </div>
            <div>
              <label className={LABEL}>Reference / Teller no.</label>
              <input className={INPUT} value={form.reference} onChange={e => set("reference", e.target.value)} placeholder="Optional" />
            </div>
          </div>
          <div>
            <label className={LABEL}>Note</label>
            <input className={INPUT} value={form.note} onChange={e => set("note", e.target.value)} placeholder="Any additional notes…" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
            <Save className="w-4 h-4" />{saving ? "Saving…" : "Record payment"}
          </button>
          <Link href="/fees" className="text-sm text-gray-500 hover:text-gray-700">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
