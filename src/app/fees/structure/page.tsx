"use client";

import { useState, useEffect } from "react";
import {
  Plus, Trash2, Save, Settings, WifiOff, ChevronDown, ChevronRight,
} from "lucide-react";
import {
  collection, query, where, getDocs, doc, setDoc, deleteDoc, orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { useSchool } from "@/hooks/useSchool";
import Topbar from "@/components/layout/Topbar";
import { formatNaira } from "@/lib/utils";
import { TERMS } from "@/types";
import { toast } from "@/components/ui/Toast";
import type { SchoolClass, FeeStructure, FeeItem, FeeCategory } from "@/types";
import Link from "next/link";

const FEE_CATEGORIES: { value: FeeCategory; label: string }[] = [
  { value: "tuition",     label: "Tuition" },
  { value: "bus",         label: "Bus / Transport" },
  { value: "uniform",     label: "Uniform" },
  { value: "books",       label: "Books & Stationery" },
  { value: "exam",        label: "Exam Levy" },
  { value: "development", label: "Development Levy" },
  { value: "other",       label: "Other" },
];

const INPUT = "w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white";

export default function FeeStructurePage() {
  const { appUser } = useAuth();
  const { session } = useSchool();
  const schoolId = appUser?.schoolId ?? "";

  const [classes, setClasses]         = useState<SchoolClass[]>([]);
  const [structures, setStructures]   = useState<Record<string, FeeStructure>>({});
  const [expanded, setExpanded]       = useState<string | null>(null);
  const [term, setTerm]               = useState<string>(TERMS[0]);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState<string | null>(null);
  const [fetchError, setFetchError]   = useState(false);

  useEffect(() => {
    if (!schoolId) { setLoading(false); return; }
    Promise.all([
      getDocs(query(collection(db, "classes"), where("schoolId", "==", schoolId), orderBy("order", "asc"))),
      getDocs(query(collection(db, "feeStructures"), where("schoolId", "==", schoolId))),
    ])
      .then(([classSnap, structSnap]) => {
        setClasses(classSnap.docs.map(d => ({ id: d.id, ...d.data() } as SchoolClass)));
        const map: Record<string, FeeStructure> = {};
        structSnap.docs.forEach(d => {
          const s = { id: d.id, ...d.data() } as FeeStructure;
          map[`${s.classId}_${s.term}`] = s;
        });
        setStructures(map);
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, [schoolId]);

  const getStructure = (classId: string): FeeStructure | null =>
    structures[`${classId}_${term}`] ?? null;

  const getItems = (classId: string): FeeItem[] =>
    getStructure(classId)?.items ?? [];

  const updateItem = (classId: string, idx: number, field: keyof FeeItem, value: string | number | boolean) => {
    const key = `${classId}_${term}`;
    const existing = structures[key];
    const items = [...(existing?.items ?? [])];
    items[idx] = { ...items[idx], [field]: value };
    const total = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
    setStructures(prev => ({
      ...prev,
      [key]: {
        id: existing?.id ?? key,
        schoolId, sessionId: session?.id ?? "",
        classId, term: term as FeeStructure["term"],
        items, totalAmount: total,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
      },
    }));
  };

  const addItem = (classId: string) => {
    const key = `${classId}_${term}`;
    const existing = structures[key];
    const items: FeeItem[] = [...(existing?.items ?? []), {
      category: "tuition", label: "Tuition Fee", amount: 0, mandatory: true,
    }];
    const total = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
    setStructures(prev => ({
      ...prev,
      [key]: {
        id: existing?.id ?? key,
        schoolId, sessionId: session?.id ?? "",
        classId, term: term as FeeStructure["term"],
        items, totalAmount: total,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
      },
    }));
  };

  const removeItem = (classId: string, idx: number) => {
    const key = `${classId}_${term}`;
    const existing = structures[key];
    const items = (existing?.items ?? []).filter((_, i) => i !== idx);
    const total = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
    setStructures(prev => ({ ...prev, [key]: { ...existing!, items, totalAmount: total } }));
  };

  const saveStructure = async (classId: string) => {
    const key = `${classId}_${term}`;
    const structure = structures[key];
    if (!structure) return;
    setSaving(classId);
    try {
      await setDoc(doc(db, "feeStructures", key), structure);
      toast(`Fee structure saved for ${term}`);
    } catch {
      toast("Failed to save", "error");
    } finally {
      setSaving(null);
    }
  };

  const toggleExpand = (classId: string) =>
    setExpanded(prev => (prev === classId ? null : classId));

  if (loading) return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Fee structure" subtitle="Define fees per class and term" />
      <div className="flex-1 flex justify-center items-center">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Fee structure" subtitle="Define itemized fees per class and term" />

      <div className="flex-1 p-6 space-y-5 animate-fade-in">

        {fetchError && (
          <div className="flex items-center gap-3 px-4 py-3.5 bg-red-50 border border-red-200 rounded-xl text-sm">
            <WifiOff className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span className="text-red-700 flex-1">Failed to load fee structures.</span>
            <button onClick={() => window.location.reload()} className="text-red-700 font-medium underline text-xs">Retry</button>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700 leading-relaxed">
          Define exactly what fees each class pays per term. These amounts auto-populate when you record a new payment so you don&apos;t have to type them every time.
        </div>

        {/* Term selector */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Configuring fees for:</span>
          <div className="flex gap-1">
            {TERMS.map(t => (
              <button key={t} onClick={() => setTerm(t)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors
                  ${term === t ? "bg-brand-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {classes.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
            <Settings className="w-10 h-10 text-gray-300 mx-auto mb-4" />
            <p className="text-sm font-medium text-gray-700 mb-2">No classes configured</p>
            <p className="text-xs text-muted-foreground mb-4">Set up your classes first before defining fee structures.</p>
            <Link href="/settings" className="text-sm font-medium text-brand-600 hover:underline">
              Go to Settings → Classes →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {classes.map(cls => {
              const cName = `${cls.name}${cls.arm ? ` ${cls.arm}` : ""}`;
              const items = getItems(cls.id);
              const total = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
              const isOpen = expanded === cls.id;
              const hasSaved = !!structures[`${cls.id}_${term}`]?.id;

              return (
                <div key={cls.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  {/* Header row */}
                  <button onClick={() => toggleExpand(cls.id)}
                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left">
                    <div className="flex-1 flex items-center gap-3">
                      <span className="text-sm font-semibold text-gray-900">{cName}</span>
                      <span className="text-xs text-muted-foreground capitalize">{cls.level}</span>
                      {hasSaved && (
                        <span className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded-full border border-green-200 font-medium">
                          Saved
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {total > 0 && (
                        <span className="text-sm font-semibold font-mono text-gray-900">{formatNaira(total)}/term</span>
                      )}
                      {isOpen
                        ? <ChevronDown className="w-4 h-4 text-gray-400" />
                        : <ChevronRight className="w-4 h-4 text-gray-400" />}
                    </div>
                  </button>

                  {/* Expanded fee items */}
                  {isOpen && (
                    <div className="border-t border-gray-100 px-5 py-4 space-y-3">
                      {items.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No fee items yet. Click "Add fee item" to start.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {/* Table header */}
                          <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground pb-1">
                            <div className="col-span-3">Category</div>
                            <div className="col-span-4">Label</div>
                            <div className="col-span-3">Amount (₦)</div>
                            <div className="col-span-1 text-center">Req.</div>
                            <div className="col-span-1"></div>
                          </div>
                          {items.map((item, idx) => (
                            <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                              <div className="col-span-3">
                                <select value={item.category}
                                  onChange={e => updateItem(cls.id, idx, "category", e.target.value)}
                                  className={INPUT}>
                                  {FEE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                </select>
                              </div>
                              <div className="col-span-4">
                                <input value={item.label}
                                  onChange={e => updateItem(cls.id, idx, "label", e.target.value)}
                                  className={INPUT} placeholder="e.g. First Term Tuition" />
                              </div>
                              <div className="col-span-3">
                                <input type="number" min="0" value={item.amount}
                                  onChange={e => updateItem(cls.id, idx, "amount", parseFloat(e.target.value) || 0)}
                                  className={`${INPUT} font-mono`} placeholder="0" />
                              </div>
                              <div className="col-span-1 flex justify-center">
                                <input type="checkbox" checked={item.mandatory}
                                  onChange={e => updateItem(cls.id, idx, "mandatory", e.target.checked)}
                                  className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 cursor-pointer" />
                              </div>
                              <div className="col-span-1 flex justify-end">
                                <button onClick={() => removeItem(cls.id, idx)}
                                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Total */}
                      {items.length > 0 && (
                        <div className="flex justify-end pt-2 border-t border-gray-100">
                          <div className="text-sm">
                            <span className="text-muted-foreground mr-3">Total per term:</span>
                            <span className="font-bold font-mono text-gray-900">{formatNaira(total)}</span>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-3 pt-1">
                        <button onClick={() => addItem(cls.id)}
                          className="flex items-center gap-1.5 px-3 py-2 text-sm text-brand-600 border border-brand-200 hover:bg-brand-50 rounded-lg transition-colors font-medium">
                          <Plus className="w-3.5 h-3.5" /> Add fee item
                        </button>
                        {items.length > 0 && (
                          <button onClick={() => saveStructure(cls.id)} disabled={saving === cls.id}
                            className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
                            <Save className="w-3.5 h-3.5" />
                            {saving === cls.id ? "Saving…" : "Save structure"}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
