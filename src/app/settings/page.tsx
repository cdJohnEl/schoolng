"use client";

import { useState, useEffect } from "react";
import { Save, Plus, Trash2, Check, Calendar, Star } from "lucide-react";
import {
  doc, getDoc, updateDoc, setDoc, collection, query,
  where, getDocs, deleteDoc, addDoc, orderBy, writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import Topbar from "@/components/layout/Topbar";
import { toast } from "@/components/ui/Toast";
import { NIGERIAN_CLASSES, CLASS_ARMS, TERMS } from "@/types";
import type { School, SchoolClass, Subject, AcademicSession } from "@/types";

const INPUT = "w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder:text-gray-400 bg-white";
const LABEL = "block text-sm font-medium text-gray-700 mb-1.5";
type Tab = "school" | "sessions" | "classes" | "subjects";

export default function SettingsPage() {
  const { appUser } = useAuth();
  const [tab, setTab]           = useState<Tab>("school");
  const [school, setSchool]     = useState<Partial<School>>({});
  const [classes, setClasses]   = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [saving, setSaving]     = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [newClassName, setNewClassName]     = useState("");
  const [newClassArm, setNewClassArm]       = useState("");
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSessionName, setNewSessionName] = useState("");
  const [newSessionTerm, setNewSessionTerm] = useState<string>(TERMS[0]);
  const [newSessionStart, setNewSessionStart] = useState("");
  const [newSessionEnd, setNewSessionEnd]   = useState("");

  const schoolId = appUser?.schoolId ?? "";

  useEffect(() => {
    if (!schoolId) { setLoadingData(false); return; }
    Promise.all([
      getDoc(doc(db, "schools", schoolId)),
      getDocs(query(collection(db, "classes"),  where("schoolId", "==", schoolId))),
      getDocs(query(collection(db, "subjects"), where("schoolId", "==", schoolId))),
      getDocs(query(collection(db, "sessions"), where("schoolId", "==", schoolId))),
    ])
      .then(([schoolSnap, classSnap, subSnap, sessSnap]) => {
        if (schoolSnap.exists()) setSchool(schoolSnap.data() as School);
        const cList = classSnap.docs
          .map(d => ({ id: d.id, ...d.data() } as SchoolClass))
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setClasses(cList);
        setSubjects(subSnap.docs.map(d => ({ id: d.id, ...d.data() } as Subject)));
        const sList = sessSnap.docs
          .map(d => ({ id: d.id, ...d.data() } as AcademicSession))
          .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setSessions(sList);
      })
      .catch(() => toast("Failed to load settings", "error"))
      .finally(() => setLoadingData(false));
  }, [schoolId]);

  const setS = (k: keyof School, v: string) => setSchool(s => ({ ...s, [k]: v }));

  const saveSchool = async () => {
    if (!schoolId) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "schools", schoolId), { ...school, updatedAt: new Date().toISOString() });
      toast("School settings saved");
    } catch { toast("Failed to save", "error"); }
    finally { setSaving(false); }
  };

  const addClass = async () => {
    if (!newClassName || !schoolId) return;
    const template = NIGERIAN_CLASSES.find(c => c.name === newClassName);
    const newClass: Omit<SchoolClass, "id"> = {
      schoolId, name: newClassName, arm: newClassArm,
      level: template?.level ?? "secondary",
      subjectIds: [], order: template?.order ?? 99,
    };
    const ref = await addDoc(collection(db, "classes"), newClass);
    setClasses(prev => [...prev, { ...newClass, id: ref.id }].sort((a, b) => a.order - b.order));
    setNewClassName(""); setNewClassArm("");
    toast(`${newClassName}${newClassArm ? ` ${newClassArm}` : ""} added`);
  };

  const deleteClass = async (id: string, name: string) => {
    await deleteDoc(doc(db, "classes", id));
    setClasses(prev => prev.filter(c => c.id !== id));
    toast(`${name} removed`);
  };

  const addSubject = async () => {
    if (!newSubjectName || !schoolId) return;
    const newSub: Omit<Subject, "id"> = { schoolId, name: newSubjectName, classIds: [] };
    const ref = await addDoc(collection(db, "subjects"), newSub);
    setSubjects(prev => [...prev, { ...newSub, id: ref.id }]);
    setNewSubjectName("");
    toast(`${newSubjectName} added`);
  };

  const deleteSubject = async (id: string) => {
    await deleteDoc(doc(db, "subjects", id));
    setSubjects(prev => prev.filter(s => s.id !== id));
    toast("Subject removed");
  };

  const preloadStandardSubjects = async () => {
    if (!schoolId) return;
    try {
      const { populateDefaultSubjectsOnly } = await import("@/lib/school-defaults");
      await populateDefaultSubjectsOnly(schoolId);
      const snap = await getDocs(query(collection(db, "subjects"), where("schoolId", "==", schoolId)));
      setSubjects(snap.docs.map(d => ({ id: d.id, ...d.data() } as Subject)));
      toast("Pre-loaded 20 standard Nigerian subjects");
    } catch {
      toast("Failed to load standard subjects", "error");
    }
  };

  const toggleSubjectClass = async (subjectId: string, classId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;
    const newIds = subject.classIds.includes(classId)
      ? subject.classIds.filter(id => id !== classId)
      : [...subject.classIds, classId];
    await updateDoc(doc(db, "subjects", subjectId), { classIds: newIds });
    setSubjects(prev => prev.map(s => s.id === subjectId ? { ...s, classIds: newIds } : s));
  };

  const addSession = async () => {
    if (!newSessionName || !schoolId) return;
    const newSess: Omit<AcademicSession, "id"> = {
      schoolId, name: newSessionName,
      currentTerm: newSessionTerm as AcademicSession["currentTerm"],
      startDate: newSessionStart, endDate: newSessionEnd,
      isActive: false, createdAt: new Date().toISOString(),
    };
    const ref = await addDoc(collection(db, "sessions"), newSess);
    setSessions(prev => [{ ...newSess, id: ref.id }, ...prev]);
    setNewSessionName(""); setNewSessionStart(""); setNewSessionEnd("");
    toast(`${newSessionName} session created`);
  };

  const setActiveSession = async (sessionId: string) => {
    if (!schoolId) return;
    // Deactivate all, then activate the selected one
    const batch = writeBatch(db);
    sessions.forEach(s => {
      batch.update(doc(db, "sessions", s.id), { isActive: s.id === sessionId });
    });
    await batch.commit();
    setSessions(prev => prev.map(s => ({ ...s, isActive: s.id === sessionId })));
    toast("Active session updated");
  };

  const updateSessionTerm = async (sessionId: string, term: string) => {
    await updateDoc(doc(db, "sessions", sessionId), { currentTerm: term });
    setSessions(prev => prev.map(s => s.id === sessionId
      ? { ...s, currentTerm: term as AcademicSession["currentTerm"] }
      : s));
    toast("Current term updated");
  };

  const deleteSession = async (id: string) => {
    await deleteDoc(doc(db, "sessions", id));
    setSessions(prev => prev.filter(s => s.id !== id));
    toast("Session deleted");
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: "school",    label: "School profile" },
    { key: "sessions",  label: "Academic sessions" },
    { key: "classes",   label: "Classes & arms" },
    { key: "subjects",  label: "Subjects" },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Settings" subtitle="Configure your school" />
      <div className="flex-1 p-6 animate-fade-in">
        <div className="max-w-2xl">

          {/* Tabs */}
          <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap
                  ${tab === t.key ? "border-brand-600 text-brand-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                {t.label}
              </button>
            ))}
          </div>

          {loadingData ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* ── School profile ── */}
              {tab === "school" && (
                <div className="space-y-4">
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-sm font-semibold text-gray-900 mb-5">School information</h2>
                    <div className="space-y-4">
                      <div><label className={LABEL}>School name *</label>
                        <input className={INPUT} value={school.name ?? ""} onChange={e => setS("name", e.target.value)} placeholder="Brightstar Academy" /></div>
                      <div><label className={LABEL}>Motto</label>
                        <input className={INPUT} value={school.motto ?? ""} onChange={e => setS("motto", e.target.value)} placeholder="Excellence in all things" /></div>
                      <div><label className={LABEL}>Address</label>
                        <input className={INPUT} value={school.address ?? ""} onChange={e => setS("address", e.target.value)} placeholder="12 Education Ave, Lagos" /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className={LABEL}>Phone</label>
                          <input className={INPUT} value={school.phone ?? ""} onChange={e => setS("phone", e.target.value)} placeholder="0801 234 5678" /></div>
                        <div><label className={LABEL}>Email</label>
                          <input type="email" className={INPUT} value={school.email ?? ""} onChange={e => setS("email", e.target.value)} placeholder="info@school.com" /></div>
                      </div>
                    </div>
                  </div>
                  <button onClick={saveSchool} disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
                    <Save className="w-4 h-4" />{saving ? "Saving…" : "Save settings"}
                  </button>
                </div>
              )}

              {/* ── Academic sessions ── */}
              {tab === "sessions" && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700 leading-relaxed">
                    <strong>How sessions work:</strong> Each academic year is a &quot;session&quot; (e.g. 2025/2026).
                    Create a session, set it as Active, then update the Current Term as the school year progresses.
                    All student records, results, and attendance are tagged to the active session.
                  </div>

                  {/* Create new session */}
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-sm font-semibold text-gray-900 mb-4">Create academic session</h2>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className={LABEL}>Session name *</label>
                        <input className={INPUT} value={newSessionName} onChange={e => setNewSessionName(e.target.value)}
                          placeholder="2025/2026" />
                      </div>
                      <div>
                        <label className={LABEL}>Starting term</label>
                        <select className={INPUT} value={newSessionTerm} onChange={e => setNewSessionTerm(e.target.value)}>
                          {TERMS.map(t => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className={LABEL}>Start date</label>
                        <input type="date" className={INPUT} value={newSessionStart} onChange={e => setNewSessionStart(e.target.value)} />
                      </div>
                      <div>
                        <label className={LABEL}>End date</label>
                        <input type="date" className={INPUT} value={newSessionEnd} onChange={e => setNewSessionEnd(e.target.value)} />
                      </div>
                    </div>
                    <button onClick={addSession} disabled={!newSessionName}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                      <Plus className="w-4 h-4" /> Create session
                    </button>
                  </div>

                  {/* Sessions list */}
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100">
                      <h2 className="text-sm font-semibold text-gray-900">{sessions.length} session{sessions.length !== 1 ? "s" : ""}</h2>
                    </div>
                    {sessions.length === 0 ? (
                      <div className="py-10 text-center text-sm text-muted-foreground">
                        No sessions yet. Create your first academic session above.
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {sessions.map(sess => (
                          <div key={sess.id} className={`px-5 py-4 ${sess.isActive ? "bg-brand-50/40" : ""}`}>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-semibold text-gray-900">{sess.name}</h3>
                                {sess.isActive && (
                                  <span className="text-xs px-2 py-0.5 bg-brand-600 text-white rounded-full font-medium flex items-center gap-1">
                                    <Star className="w-3 h-3" /> Active
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {!sess.isActive && (
                                  <button onClick={() => setActiveSession(sess.id)}
                                    className="text-xs px-2.5 py-1 border border-brand-300 text-brand-700 hover:bg-brand-50 rounded-lg transition-colors font-medium">
                                    Set active
                                  </button>
                                )}
                                <button onClick={() => deleteSession(sess.id)}
                                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Calendar className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                              <span className="text-xs text-muted-foreground">Current term:</span>
                              <select
                                value={sess.currentTerm}
                                onChange={e => updateSessionTerm(sess.id, e.target.value)}
                                className="text-xs px-2 py-1 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-brand-500">
                                {TERMS.map(t => <option key={t}>{t}</option>)}
                              </select>
                              {sess.startDate && (
                                <span className="text-xs text-muted-foreground ml-auto">
                                  {sess.startDate} → {sess.endDate || "…"}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Classes ── */}
              {tab === "classes" && (
                <div className="space-y-4">
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-sm font-semibold text-gray-900 mb-1">Add class</h2>
                    <p className="text-xs text-muted-foreground mb-4">Add each class/arm separately. Arm is optional (e.g. JSS 1 A, JSS 1 B).</p>
                    <div className="flex gap-3 items-end">
                      <div className="flex-1">
                        <label className={LABEL}>Class name</label>
                        <select value={newClassName} onChange={e => setNewClassName(e.target.value)} className={INPUT}>
                          <option value="">Select class…</option>
                          {NIGERIAN_CLASSES.map(c => <option key={c.name}>{c.name}</option>)}
                        </select>
                      </div>
                      <div className="w-28">
                        <label className={LABEL}>Arm</label>
                        <select value={newClassArm} onChange={e => setNewClassArm(e.target.value)} className={INPUT}>
                          <option value="">No arm</option>
                          {CLASS_ARMS.map(a => <option key={a}>{a}</option>)}
                        </select>
                      </div>
                      <button onClick={addClass} disabled={!newClassName}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                        <Plus className="w-4 h-4" /> Add
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100">
                      <h2 className="text-sm font-semibold text-gray-900">{classes.length} classes configured</h2>
                    </div>
                    {classes.length === 0 ? (
                      <div className="py-10 text-center text-sm text-muted-foreground">No classes yet. Add your first class above.</div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {classes.map(c => (
                          <div key={c.id} className="flex items-center gap-3 px-5 py-3.5">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{c.name}{c.arm ? ` ${c.arm}` : ""}</p>
                              <p className="text-xs text-muted-foreground capitalize">{c.level}</p>
                            </div>
                            <button onClick={() => deleteClass(c.id, `${c.name}${c.arm ? ` ${c.arm}` : ""}`)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Subjects ── */}
              {tab === "subjects" && (
                <div className="space-y-4">
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div>
                        <h2 className="text-sm font-semibold text-gray-900">Manage Subjects</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Add custom subjects or pre-load the official 20 Nigerian NERDC curriculum subjects</p>
                      </div>
                      <button
                        onClick={preloadStandardSubjects}
                        type="button"
                        className="self-start sm:self-auto px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        ⚡ Pre-load 20 Standard Subjects
                      </button>
                    </div>
                    <div className="flex gap-3">
                      <input value={newSubjectName} onChange={e => setNewSubjectName(e.target.value)}
                        placeholder="e.g. Further Mathematics, French, Technical Drawing…"
                        className={`${INPUT} flex-1`}
                        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSubject(); } }} />
                      <button onClick={addSubject} disabled={!newSubjectName}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                        <Plus className="w-4 h-4" /> Add
                      </button>
                    </div>
                  </div>

                  {subjects.length === 0 && (
                    <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center space-y-3">
                      <p className="text-sm text-gray-600">No subjects configured yet for this school.</p>
                      <button
                        onClick={preloadStandardSubjects}
                        className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors inline-flex items-center gap-2"
                      >
                        ⚡ Pre-load Standard Nigerian Subjects Now
                      </button>
                    </div>
                  )}

                  {subjects.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                      <div className="px-5 py-4 border-b border-gray-100">
                        <h2 className="text-sm font-semibold text-gray-900">{subjects.length} subjects</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Tick which classes each subject applies to. Leave all unselected to show in all classes.</p>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {subjects.map(s => (
                          <div key={s.id} className="px-5 py-4">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium text-gray-900">{s.name}</span>
                              <button onClick={() => deleteSubject(s.id)}
                                className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            {classes.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {classes.map(c => {
                                  const cName = `${c.name}${c.arm ? ` ${c.arm}` : ""}`;
                                  const assigned = s.classIds.includes(c.id);
                                  return (
                                    <button key={c.id}
                                      onClick={() => toggleSubjectClass(s.id, c.id)}
                                      className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors
                                        ${assigned
                                          ? "bg-brand-600 text-white border-brand-600"
                                          : "bg-white text-gray-500 border-gray-200 hover:border-brand-300"}`}>
                                      {assigned ? "✓ " : ""}{cName}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">Add classes first in the Classes tab</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
