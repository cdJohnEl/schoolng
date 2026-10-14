"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ClipboardList, Plus, Calendar, Clock, BookOpen, Users,
  Trash2, Edit3, ArrowRight, CheckCircle2, Filter, AlertCircle, X,
  FileText, Sparkles, Printer, Eye, Layers, HelpCircle
} from "lucide-react";
import {
  collection, query, where, getDocs, addDoc, deleteDoc, updateDoc, doc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import Topbar from "@/components/layout/Topbar";
import { EmptyState } from "@/components/ui/index";
import { toast } from "@/components/ui/Toast";
import QuestionBuilderModal from "@/components/exams/QuestionBuilderModal";
import ExamPaperModal from "@/components/exams/ExamPaperModal";
import type { ExamAssessment, SchoolClass, Subject, ExamType, ExamQuestionMode } from "@/types";

const TYPE_CONFIG: Record<ExamType, { label: string; badge: string; defaultMax: number }> = {
  ca:        { label: "Continuous Assessment (CA)", badge: "bg-blue-100 text-blue-800 border-blue-200", defaultMax: 40 },
  mid_term:  { label: "Mid-Term Test",             badge: "bg-amber-100 text-amber-800 border-amber-200", defaultMax: 40 },
  quiz:      { label: "Class Quiz",                badge: "bg-emerald-100 text-emerald-800 border-emerald-200", defaultMax: 20 },
  exam:      { label: "Terminal Examination",      badge: "bg-purple-100 text-purple-800 border-purple-200", defaultMax: 60 },
};

const INPUT = "w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white placeholder:text-gray-400";
const LABEL = "block text-sm font-medium text-gray-700 mb-1.5";

export default function ExamsPage() {
  const { appUser } = useAuth();
  const schoolId = appUser?.schoolId ?? "";

  const [exams, setExams]       = useState<ExamAssessment[]>([]);
  const [classes, setClasses]   = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading]   = useState(true);

  // Filters
  const [classFilter, setClassFilter] = useState("all");
  const [typeFilter, setTypeFilter]   = useState("all");

  // Create / Edit Exam Metadata Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving]       = useState(false);

  // Question Builder & Exam Paper Modals
  const [selectedExamForQuestions, setSelectedExamForQuestions] = useState<ExamAssessment | null>(null);
  const [selectedExamForPaper, setSelectedExamForPaper]         = useState<ExamAssessment | null>(null);

  const [form, setForm] = useState({
    title: "",
    type: "ca" as ExamType,
    questionMode: "both" as ExamQuestionMode,
    classId: "",
    subjectId: "",
    date: new Date().toISOString().split("T")[0],
    duration: "1 hour",
    maxScore: 40,
    instructions: "",
  });

  const loadExamsData = useCallback(async () => {
    if (!schoolId) { setLoading(false); return; }
    try {
      const [examsSnap, classesSnap, subjectsSnap] = await Promise.all([
        getDocs(query(collection(db, "exams"), where("schoolId", "==", schoolId))),
        getDocs(query(collection(db, "classes"), where("schoolId", "==", schoolId))),
        getDocs(query(collection(db, "subjects"), where("schoolId", "==", schoolId))),
      ]);

      const eList = examsSnap.docs.map(d => ({ id: d.id, ...d.data() } as ExamAssessment));
      eList.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
      setExams(eList);

      const cList = classesSnap.docs
        .map(d => ({ id: d.id, ...d.data() } as SchoolClass))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setClasses(cList);

      const sList = subjectsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Subject));
      setSubjects(sList);
    } catch (clientErr) {
      console.warn("Client Firestore load notice, trying server API fallback:", clientErr);
      try {
        const res = await fetch(`/api/exams?schoolId=${encodeURIComponent(schoolId)}`);
        if (res.ok) {
          const data = await res.json();
          setExams(data.exams || []);
          setClasses(data.classes || []);
          setSubjects(data.subjects || []);
        } else {
          toast("Failed to load tests & exams", "error");
        }
      } catch (apiErr) {
        console.error("Error loading exams via API fallback:", apiErr);
        toast("Failed to load tests & exams", "error");
      }
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    loadExamsData();
  }, [loadExamsData]);

  const openNewModal = () => {
    setEditingId(null);
    setForm({
      title: "",
      type: "ca",
      questionMode: "both",
      classId: classes[0]?.id ?? "",
      subjectId: subjects[0]?.id ?? "",
      date: new Date().toISOString().split("T")[0],
      duration: "1 hour",
      maxScore: 40,
      instructions: "Answer all questions in Section A and Section B clearly.",
    });
    setModalOpen(true);
  };

  const openEditModal = (ex: ExamAssessment) => {
    setEditingId(ex.id);
    setForm({
      title: ex.title,
      type: ex.type,
      questionMode: ex.questionMode || "both",
      classId: ex.classId,
      subjectId: ex.subjectId,
      date: ex.date,
      duration: ex.duration,
      maxScore: ex.maxScore,
      instructions: ex.instructions || "",
    });
    setModalOpen(true);
  };

  const handleTypeChange = (t: ExamType) => {
    setForm(f => ({
      ...f,
      type: t,
      maxScore: TYPE_CONFIG[t].defaultMax,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolId || !form.title || !form.classId || !form.subjectId) {
      toast("Please complete all required fields", "error");
      return;
    }

    const cls = classes.find(c => c.id === form.classId);
    const className = cls ? `${cls.name}${cls.arm ? ` ${cls.arm}` : ""}` : form.classId;
    const sub = subjects.find(s => s.id === form.subjectId);
    const subjectName = sub?.name ?? form.subjectId;

    setSaving(true);
    try {
      if (editingId) {
        try {
          await updateDoc(doc(db, "exams", editingId), {
            title: form.title,
            type: form.type,
            questionMode: form.questionMode,
            classId: form.classId,
            className,
            subjectId: form.subjectId,
            subjectName,
            date: form.date,
            duration: form.duration,
            maxScore: Number(form.maxScore),
            instructions: form.instructions,
            updatedAt: new Date().toISOString(),
          });
        } catch {
          await fetch("/api/exams", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: editingId,
              title: form.title,
              type: form.type,
              questionMode: form.questionMode,
              classId: form.classId,
              className,
              subjectId: form.subjectId,
              subjectName,
              date: form.date,
              duration: form.duration,
              maxScore: Number(form.maxScore),
              instructions: form.instructions,
            }),
          });
        }

        setExams(prev => prev.map(ex => ex.id === editingId ? {
          ...ex,
          title: form.title,
          type: form.type,
          questionMode: form.questionMode,
          classId: form.classId,
          className,
          subjectId: form.subjectId,
          subjectName,
          date: form.date,
          duration: form.duration,
          maxScore: Number(form.maxScore),
          instructions: form.instructions,
        } : ex));
        toast("Assessment updated successfully");
      } else {
        const newDoc: Omit<ExamAssessment, "id"> = {
          schoolId,
          title: form.title,
          type: form.type,
          questionMode: form.questionMode,
          classId: form.classId,
          className,
          subjectId: form.subjectId,
          subjectName,
          date: form.date,
          duration: form.duration,
          maxScore: Number(form.maxScore),
          instructions: form.instructions,
          questions: [],
          totalQuestions: 0,
          createdBy: appUser?.displayName || "Teacher",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        let newId = "";
        try {
          const ref = await addDoc(collection(db, "exams"), newDoc);
          newId = ref.id;
        } catch {
          const res = await fetch("/api/exams", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newDoc),
          });
          const resData = await res.json();
          newId = resData.id || `exam_${Date.now()}`;
        }

        const createdExam = { id: newId, ...newDoc };
        setExams(prev => [createdExam, ...prev]);
        toast("New test/exam scheduled successfully! You can now add questions.");
        // Prompt teacher to add questions immediately
        setSelectedExamForQuestions(createdExam);
      }
      setModalOpen(false);
    } catch {
      toast("Failed to save exam", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      try {
        await deleteDoc(doc(db, "exams", id));
      } catch {
        await fetch(`/api/exams?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      }
      setExams(prev => prev.filter(e => e.id !== id));
      toast("Assessment removed");
    } catch {
      toast("Failed to delete assessment", "error");
    }
  };

  // Handler for when QuestionBuilderModal saves updated questions
  const handleExamQuestionsUpdated = (updated: ExamAssessment) => {
    setExams(prev => prev.map(e => e.id === updated.id ? updated : e));
    if (selectedExamForQuestions?.id === updated.id) {
      setSelectedExamForQuestions(updated);
    }
  };

  const filteredExams = exams.filter(e => {
    const matchClass = classFilter === "all" || e.classId === classFilter;
    const matchType  = typeFilter === "all" || e.type === typeFilter;
    return matchClass && matchType;
  });

  const countByType = {
    ca: exams.filter(e => e.type === "ca").length,
    exam: exams.filter(e => e.type === "exam").length,
    mid_term: exams.filter(e => e.type === "mid_term").length,
    quiz: exams.filter(e => e.type === "quiz").length,
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar
        title="Tests & Examinations"
        subtitle="Schedule assessments, build MCQ/Theory question papers, and print official exam sheets"
        actions={
          <button
            onClick={openNewModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Set New Test / Exam
          </button>
        }
      />

      <div className="flex-1 p-6 space-y-6 animate-fade-in max-w-7xl">

        {/* Stats Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">Total Assessments</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{exams.length}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Recorded across classes</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">Continuous Assessments (CA)</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{countByType.ca}</p>
            <p className="text-[11px] text-blue-700/80 mt-0.5">Standard 40% weight</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">Terminal Examinations</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">{countByType.exam}</p>
            <p className="text-[11px] text-purple-700/80 mt-0.5">Standard 60% weight</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">Mid-Terms & Quizzes</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{countByType.mid_term + countByType.quiz}</p>
            <p className="text-[11px] text-emerald-700/80 mt-0.5">Periodic class tests</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-1">
              <Filter className="w-3.5 h-3.5" /> Filter by:
            </div>
            <select
              value={classFilter}
              onChange={e => setClassFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="all">All Classes</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}{c.arm ? ` ${c.arm}` : ""}</option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="all">All Types</option>
              <option value="ca">Continuous Assessment (CA)</option>
              <option value="mid_term">Mid-Term Test</option>
              <option value="quiz">Class Quiz</option>
              <option value="exam">Terminal Examination</option>
            </select>
          </div>

          <span className="text-xs text-muted-foreground self-end sm:self-auto">
            Showing {filteredExams.length} of {exams.length} assessment{exams.length === 1 ? "" : "s"}
          </span>
        </div>

        {/* Exam Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-56 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredExams.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title={exams.length === 0 ? "No tests or exams set yet" : "No assessments matching filters"}
            description={exams.length === 0
              ? "Teachers can set CA tests, mid-term examinations, and quizzes with MCQs and Theory questions for their assigned classes."
              : "Try switching class or type filters to see scheduled exams."}
            action={
              exams.length === 0 ? (
                <button
                  onClick={openNewModal}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
                >
                  Set first test / exam
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredExams.map(ex => {
              const cfg = TYPE_CONFIG[ex.type] || TYPE_CONFIG.ca;
              const qList = ex.questions || [];
              const mcqCount = qList.filter(q => q.type === "mcq").length;
              const theoryCount = qList.filter(q => q.type === "theory").length;
              const allocatedMarks = qList.reduce((acc, q) => acc + (Number(q.marks) || 0), 0);
              const hasQuestions = qList.length > 0;

              return (
                <div
                  key={ex.id}
                  className="bg-white rounded-2xl border border-gray-200/90 shadow-sm p-5 flex flex-col justify-between hover:border-brand-300 hover:shadow-md transition-all space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${cfg.badge}`}>
                          {cfg.label}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {ex.questionMode === "mcq_only"
                            ? "MCQs Only"
                            : ex.questionMode === "theory_only"
                            ? "Theory Only"
                            : "MCQs + Theory"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(ex)}
                          title="Edit assessment info"
                          className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(ex.id, ex.title)}
                          title="Delete assessment"
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-gray-900 leading-snug">{ex.title}</h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                        <span className="font-bold text-brand-700">{ex.subjectName}</span>
                        <span>•</span>
                        <span className="font-medium text-slate-700">{ex.className}</span>
                      </div>
                    </div>

                    {/* Date / Duration / Marks */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{ex.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{ex.duration}</span>
                      </div>
                      <div className="col-span-2 pt-1 border-t border-gray-200/60 flex items-center justify-between text-gray-700 font-medium">
                        <span>Max Score:</span>
                        <span className="text-brand-700 font-bold">{ex.maxScore} marks</span>
                      </div>
                    </div>

                    {/* Questions Status Badge */}
                    <div className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                      hasQuestions
                        ? "bg-brand-50/60 border-brand-200 text-brand-950"
                        : "bg-amber-50/70 border-amber-200 text-amber-900"
                    }`}>
                      <div className="flex items-center gap-1.5">
                        <HelpCircle className={`w-3.5 h-3.5 ${hasQuestions ? "text-brand-600" : "text-amber-600"}`} />
                        <div>
                          <p className="font-bold text-[11px]">
                            {hasQuestions
                              ? `${qList.length} Questions (${mcqCount} MCQ, ${theoryCount} Theory)`
                              : "No questions added yet"}
                          </p>
                          <p className="text-[10px] text-gray-500">
                            {hasQuestions
                              ? `${allocatedMarks} of ${ex.maxScore} marks allocated`
                              : "Click below to add questions"}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedExamForQuestions(ex)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                          hasQuestions
                            ? "bg-brand-600 text-white hover:bg-brand-700 shadow-xs"
                            : "bg-amber-600 text-white hover:bg-amber-700 shadow-xs"
                        }`}
                      >
                        {hasQuestions ? "Edit Questions" : "+ Add Questions"}
                      </button>
                    </div>

                    {ex.instructions && (
                      <p className="text-[11px] text-muted-foreground line-clamp-2 italic bg-gray-50 p-2 rounded-lg border border-gray-100">
                        &ldquo;{ex.instructions}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-gray-100 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setSelectedExamForQuestions(ex)}
                        className="w-full py-2 px-2.5 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Question Builder</span>
                      </button>

                      <button
                        onClick={() => setSelectedExamForPaper(ex)}
                        className="w-full py-2 px-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Paper</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                      <span>By {ex.createdBy || "Teacher"}</span>
                      <Link
                        href="/results"
                        className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                      >
                        Enter Scores <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Set / Edit Assessment Metadata */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {editingId ? "Edit Test / Exam" : "Set New Test or Examination"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Specify assessment title, subject, format, and maximum marks
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={LABEL}>Assessment Title *</label>
                <input
                  required
                  className={INPUT}
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. First Term Mathematics Continuous Assessment Test 1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Assessment Type *</label>
                  <select
                    className={INPUT}
                    value={form.type}
                    onChange={e => handleTypeChange(e.target.value as ExamType)}
                  >
                    <option value="ca">Continuous Assessment (CA 40%)</option>
                    <option value="exam">Terminal Examination (60%)</option>
                    <option value="mid_term">Mid-Term Test (40%)</option>
                    <option value="quiz">Class Quiz (20%)</option>
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Max Marks *</label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    required
                    className={INPUT}
                    value={form.maxScore}
                    onChange={e => setForm(f => ({ ...f, maxScore: Number(e.target.value) }))}
                  />
                </div>
              </div>

              {/* Question Format / Mode */}
              <div>
                <label className={LABEL}>Questions Format *</label>
                <select
                  className={INPUT}
                  value={form.questionMode}
                  onChange={e => setForm(f => ({ ...f, questionMode: e.target.value as ExamQuestionMode }))}
                >
                  <option value="both">Both (Section A: MCQs + Section B: Theory) - Standard</option>
                  <option value="mcq_only">Multiple Choice Questions (MCQs / Objectives) Only</option>
                  <option value="theory_only">Theory & Essay Questions Only</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Class *</label>
                  <select
                    required
                    className={INPUT}
                    value={form.classId}
                    onChange={e => setForm(f => ({ ...f, classId: e.target.value }))}
                  >
                    <option value="">Select class</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}{c.arm ? ` ${c.arm}` : ""}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={LABEL}>Subject *</label>
                  <select
                    required
                    className={INPUT}
                    value={form.subjectId}
                    onChange={e => setForm(f => ({ ...f, subjectId: e.target.value }))}
                  >
                    <option value="">Select subject</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Date of Exam *</label>
                  <input
                    type="date"
                    required
                    className={INPUT}
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={LABEL}>Duration *</label>
                  <input
                    required
                    className={INPUT}
                    value={form.duration}
                    onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                    placeholder="e.g. 1 hour 30 mins"
                  />
                </div>
              </div>

              <div>
                <label className={LABEL}>Instructions / Syllabus Scope</label>
                <textarea
                  rows={2}
                  className={INPUT}
                  value={form.instructions}
                  onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
                  placeholder="e.g. Covers Weeks 1-6. Answer all questions in Section A and Section B. Calculators allowed."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
                >
                  {saving ? "Saving…" : editingId ? "Update Assessment" : "Save & Add Questions"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUESTION BUILDER MODAL */}
      {selectedExamForQuestions && (
        <QuestionBuilderModal
          exam={selectedExamForQuestions}
          isOpen={!!selectedExamForQuestions}
          onClose={() => setSelectedExamForQuestions(null)}
          onUpdated={handleExamQuestionsUpdated}
          onOpenPreview={(ex) => {
            setSelectedExamForPaper(ex);
          }}
        />
      )}

      {/* EXAM PAPER PREVIEW & PRINT MODAL */}
      {selectedExamForPaper && (
        <ExamPaperModal
          exam={selectedExamForPaper}
          isOpen={!!selectedExamForPaper}
          onClose={() => setSelectedExamForPaper(null)}
        />
      )}
    </div>
  );
}
