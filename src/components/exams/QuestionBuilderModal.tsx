"use client";

import { useState } from "react";
import {
  X, Plus, Trash2, Edit3, CheckCircle2, AlertCircle,
  HelpCircle, BookOpen, Sparkles, Save, Check, FileText,
  Printer, Play, Layers, ChevronRight, Eye
} from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "@/components/ui/Toast";
import type { ExamAssessment, ExamQuestion, QuestionType, ExamQuestionMode, QuestionOption } from "@/types";

interface Props {
  exam: ExamAssessment;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updatedExam: ExamAssessment) => void;
  onOpenPreview: (exam: ExamAssessment) => void;
}

export default function QuestionBuilderModal({
  exam,
  isOpen,
  onClose,
  onUpdated,
  onOpenPreview,
}: Props) {
  const [questions, setQuestions] = useState<ExamQuestion[]>(exam.questions || []);
  const [questionMode, setQuestionMode] = useState<ExamQuestionMode>(exam.questionMode || "both");
  const [activeTab, setActiveTab] = useState<"all" | "mcq" | "theory">("all");
  const [saving, setSaving] = useState(false);

  // Question editing / creation form state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  const [formType, setFormType] = useState<QuestionType>("mcq");
  const [formPrompt, setFormPrompt] = useState("");
  const [formMarks, setFormMarks] = useState<number>(2);
  const [formOptions, setFormOptions] = useState<QuestionOption[]>([
    { id: "A", text: "" },
    { id: "B", text: "" },
    { id: "C", text: "" },
    { id: "D", text: "" },
  ]);
  const [formCorrectOption, setFormCorrectOption] = useState<string>("A");
  const [formExplanation, setFormExplanation] = useState("");
  const [formRubric, setFormRubric] = useState("");

  if (!isOpen) return null;

  // Mark calculations
  const totalMarks = questions.reduce((acc, q) => acc + (Number(q.marks) || 0), 0);
  const mcqQuestions = questions.filter(q => q.type === "mcq");
  const theoryQuestions = questions.filter(q => q.type === "theory");
  const mcqMarks = mcqQuestions.reduce((acc, q) => acc + (Number(q.marks) || 0), 0);
  const theoryMarks = theoryQuestions.reduce((acc, q) => acc + (Number(q.marks) || 0), 0);

  const isMarksBalanced = totalMarks === exam.maxScore;

  // Open editor for new question
  const handleAddNew = (type: QuestionType) => {
    setEditingQuestionId(null);
    setFormType(type);
    setFormPrompt("");
    setFormMarks(type === "mcq" ? 2 : 10);
    setFormOptions([
      { id: "A", text: "" },
      { id: "B", text: "" },
      { id: "C", text: "" },
      { id: "D", text: "" },
    ]);
    setFormCorrectOption("A");
    setFormExplanation("");
    setFormRubric("");
    setIsEditorOpen(true);
  };

  // Open editor for existing question
  const handleEdit = (q: ExamQuestion) => {
    setEditingQuestionId(q.id);
    setFormType(q.type);
    setFormPrompt(q.prompt);
    setFormMarks(q.marks);
    if (q.type === "mcq") {
      setFormOptions(q.options && q.options.length > 0 ? q.options : [
        { id: "A", text: "" },
        { id: "B", text: "" },
        { id: "C", text: "" },
        { id: "D", text: "" },
      ]);
      setFormCorrectOption(q.correctOption || "A");
      setFormExplanation(q.explanation || "");
    } else {
      setFormRubric(q.rubricOrGuide || "");
    }
    setIsEditorOpen(true);
  };

  // Save question from editor
  const handleSaveQuestion = () => {
    if (!formPrompt.trim()) {
      toast("Please enter the question text", "error");
      return;
    }

    if (formType === "mcq") {
      const emptyOpt = formOptions.some(opt => !opt.text.trim());
      if (emptyOpt) {
        toast("Please provide text for all 4 options (A, B, C, D)", "error");
        return;
      }
    }

    const section = formType === "mcq"
      ? "Section A: Multiple Choice"
      : "Section B: Theory / Structured Essay";

    if (editingQuestionId) {
      setQuestions(prev => prev.map(q => {
        if (q.id === editingQuestionId) {
          return {
            ...q,
            type: formType,
            section,
            prompt: formPrompt.trim(),
            marks: Number(formMarks) || 1,
            options: formType === "mcq" ? formOptions : undefined,
            correctOption: formType === "mcq" ? formCorrectOption : undefined,
            explanation: formType === "mcq" ? formExplanation.trim() : undefined,
            rubricOrGuide: formType === "theory" ? formRubric.trim() : undefined,
          };
        }
        return q;
      }));
      toast("Question updated");
    } else {
      const newQuestion: ExamQuestion = {
        id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: formType,
        section,
        questionNumber: questions.length + 1,
        prompt: formPrompt.trim(),
        marks: Number(formMarks) || (formType === "mcq" ? 2 : 10),
        options: formType === "mcq" ? formOptions : undefined,
        correctOption: formType === "mcq" ? formCorrectOption : undefined,
        explanation: formType === "mcq" ? formExplanation.trim() : undefined,
        rubricOrGuide: formType === "theory" ? formRubric.trim() : undefined,
      };
      setQuestions(prev => [...prev, newQuestion]);
      toast("Question added to test");
    }

    setIsEditorOpen(false);
  };

  // Delete question
  const handleDeleteQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id).map((q, idx) => ({
      ...q,
      questionNumber: idx + 1,
    })));
    toast("Question removed");
  };

  // Load Nigerian curriculum sample questions tailored to exam subject
  const handleLoadSampleQuestions = () => {
    const sName = (exam.subjectName || "").toLowerCase();
    let samples: ExamQuestion[] = [];

    if (sName.includes("math")) {
      samples = [
        {
          id: `q_math_1_${Date.now()}`,
          type: "mcq",
          section: "Section A: Multiple Choice",
          questionNumber: 1,
          prompt: "Solve for x in the linear equation: 3x - 7 = 14",
          marks: 2,
          options: [
            { id: "A", text: "x = 5" },
            { id: "B", text: "x = 7" },
            { id: "C", text: "x = 9" },
            { id: "D", text: "x = 21" },
          ],
          correctOption: "B",
          explanation: "3x = 14 + 7 = 21, hence x = 21 / 3 = 7.",
        },
        {
          id: `q_math_2_${Date.now()}`,
          type: "mcq",
          section: "Section A: Multiple Choice",
          questionNumber: 2,
          prompt: "Find the perimeter of a rectangular classroom with length 12m and breadth 8m.",
          marks: 2,
          options: [
            { id: "A", text: "20 m" },
            { id: "B", text: "40 m" },
            { id: "C", text: "96 m" },
            { id: "D", text: "24 m" },
          ],
          correctOption: "B",
          explanation: "Perimeter = 2 × (length + breadth) = 2 × (12 + 8) = 2 × 20 = 40m.",
        },
        {
          id: `q_math_3_${Date.now()}`,
          type: "mcq",
          section: "Section A: Multiple Choice",
          questionNumber: 3,
          prompt: "Calculate the simple interest on ₦50,000 borrowed for 2 years at an interest rate of 6% per annum.",
          marks: 2,
          options: [
            { id: "A", text: "₦3,000" },
            { id: "B", text: "₦6,000" },
            { id: "C", text: "₦12,000" },
            { id: "D", text: "₦56,000" },
          ],
          correctOption: "B",
          explanation: "Simple Interest = (P × R × T) / 100 = (50,000 × 6 × 2) / 100 = ₦6,000.",
        },
        {
          id: `q_math_4_${Date.now()}`,
          type: "theory",
          section: "Section B: Theory / Structured Essay",
          questionNumber: 4,
          prompt: "1. (a) Given that y varies directly as x, and y = 24 when x = 8:\n(i) Find the formula connecting y and x.\n(ii) Find the value of y when x = 15.\n(b) Factorize completely: 2x² + 7x + 3.",
          marks: 14,
          rubricOrGuide: "Marking Guide:\n(a)(i) y = kx => 24 = 8k => k = 3 => y = 3x (3 marks)\n(a)(ii) y = 3(15) = 45 (3 marks)\n(b) Factors of 2×3=6 adding to 7 are 6 and 1: 2x² + 6x + x + 3 = 2x(x + 3) + 1(x + 3) = (2x + 1)(x + 3) (8 marks).",
        },
        {
          id: `q_math_5_${Date.now()}`,
          type: "theory",
          section: "Section B: Theory / Structured Essay",
          questionNumber: 5,
          prompt: "2. The angle of elevation of the top of an antenna tower from a point 40m away on level ground is 30°.\n(a) Make a clear diagram representing the situation.\n(b) Calculate the height of the antenna tower to 2 decimal places (Take tan 30° = 0.5774).",
          marks: 20,
          rubricOrGuide: "Marking Guide:\n(a) Labeled right triangle with 30° angle of elevation and 40m base (6 marks)\n(b) tan 30° = h / 40 => h = 40 × 0.5774 = 23.10 meters (14 marks).",
        },
      ];
    } else if (sName.includes("english")) {
      samples = [
        {
          id: `q_eng_1_${Date.now()}`,
          type: "mcq",
          section: "Section A: Multiple Choice",
          questionNumber: 1,
          prompt: "Choose the word nearest in meaning (synonym) to the underlined word: 'The principal gave a METICULOUS explanation of the school guidelines.'",
          marks: 2,
          options: [
            { id: "A", text: "Careless" },
            { id: "B", text: "Very detailed and thorough" },
            { id: "C", text: "Hasty" },
            { id: "D", text: "Harsh" },
          ],
          correctOption: "B",
          explanation: "Meticulous means showing great attention to detail; very careful and precise.",
        },
        {
          id: `q_eng_2_${Date.now()}`,
          type: "mcq",
          section: "Section A: Multiple Choice",
          questionNumber: 2,
          prompt: "Identify the figure of speech used in the sentence: 'The morning sun smiled gently across the sleepy savannah.'",
          marks: 2,
          options: [
            { id: "A", text: "Simile" },
            { id: "B", text: "Metaphor" },
            { id: "C", text: "Personification" },
            { id: "D", text: "Hyperbole" },
          ],
          correctOption: "C",
          explanation: "Personification gives human characteristics (smiling gently) to non-human objects.",
        },
        {
          id: `q_eng_3_${Date.now()}`,
          type: "theory",
          section: "Section B: Theory / Structured Essay",
          questionNumber: 3,
          prompt: "Essay Writing: Write a composition of not less than 250 words on one of the following topics:\n(a) The Role of Technology in Modern Nigerian Education.\n(b) A memorable journey that changed my perspective on life.",
          marks: 20,
          rubricOrGuide: "WAEC Rubric Criteria:\n- Content: Relevance to chosen topic, maturity of thought (6 marks)\n- Organization: Paragraph coherence, introduction & conclusion (5 marks)\n- Expression: Vocabulary richness, sentence variety (5 marks)\n- Mechanical Accuracy: Spelling, punctuation, grammar (4 marks).",
        },
        {
          id: `q_eng_4_${Date.now()}`,
          type: "theory",
          section: "Section B: Theory / Structured Essay",
          questionNumber: 4,
          prompt: "Comprehension & Summary:\n(a) Explain what is meant by 'sustainable community development'.\n(b) State three challenges rural schools face as highlighted in the passage.",
          marks: 16,
          rubricOrGuide: "Marking Guide:\n(a) 6 marks for clear, concise definition based on the text.\n(b) 10 marks (3.3 marks each) for accurately summarizing the three distinct challenges.",
        },
      ];
    } else {
      // General Science / Social Science sample
      samples = [
        {
          id: `q_gen_1_${Date.now()}`,
          type: "mcq",
          section: "Section A: Multiple Choice",
          questionNumber: 1,
          prompt: "Which vital organ in the human body is primarily responsible for filtering waste products from the bloodstream?",
          marks: 2,
          options: [
            { id: "A", text: "Heart" },
            { id: "B", text: "Kidney" },
            { id: "C", text: "Liver" },
            { id: "D", text: "Lungs" },
          ],
          correctOption: "B",
          explanation: "The kidneys filter blood, removing waste products and excess fluid to form urine.",
        },
        {
          id: `q_gen_2_${Date.now()}`,
          type: "mcq",
          section: "Section A: Multiple Choice",
          questionNumber: 2,
          prompt: "The biological process by which green plants synthesize carbohydrates from carbon dioxide and water using sunlight is:",
          marks: 2,
          options: [
            { id: "A", text: "Cellular Respiration" },
            { id: "B", text: "Photosynthesis" },
            { id: "C", text: "Transpiration" },
            { id: "D", text: "Fermentation" },
          ],
          correctOption: "B",
          explanation: "Photosynthesis: 6CO₂ + 6H₂O + sunlight -> C₆H₁₂O₆ + 6O₂.",
        },
        {
          id: `q_gen_3_${Date.now()}`,
          type: "mcq",
          section: "Section A: Multiple Choice",
          questionNumber: 3,
          prompt: "Which of the following is an example of renewable energy in West Africa?",
          marks: 2,
          options: [
            { id: "A", text: "Crude Petroleum" },
            { id: "B", text: "Bituminous Coal" },
            { id: "C", text: "Solar Radiation" },
            { id: "D", text: "Natural Gas" },
          ],
          correctOption: "C",
          explanation: "Solar energy is naturally replenished and never depletes.",
        },
        {
          id: `q_gen_4_${Date.now()}`,
          type: "theory",
          section: "Section B: Theory / Structured Essay",
          questionNumber: 4,
          prompt: "1. (a) Define renewable and non-renewable energy resources, giving two Nigerian examples of each.\n(b) Explain three practical measures communities can take to mitigate environmental pollution.",
          marks: 14,
          rubricOrGuide: "Marking Guide:\n(a) Definitions (4m) + Examples (4m: Solar, Hydro vs Crude oil, Coal)\n(b) Three measures explained clearly (6m: proper waste recycling, tree planting, clean fuels).",
        },
        {
          id: `q_gen_5_${Date.now()}`,
          type: "theory",
          section: "Section B: Theory / Structured Essay",
          questionNumber: 5,
          prompt: "2. Describe with the aid of a well-annotated diagram the Water Cycle (Hydrological Cycle), explaining evaporation, condensation, and precipitation.",
          marks: 20,
          rubricOrGuide: "Marking Guide:\n- Clear annotated diagram showing Sun, Ocean, Clouds, Rain (8 marks)\n- Explanation of Evaporation (4 marks)\n- Explanation of Condensation (4 marks)\n- Explanation of Precipitation (4 marks).",
        },
      ];
    }

    setQuestions(samples);
    toast(`Loaded ${samples.length} standard curriculum questions for ${exam.subjectName || "subject"}!`);
  };

  // Save all questions to Firestore & API
  const handleSaveAll = async () => {
    setSaving(true);
    const updatedExam: ExamAssessment = {
      ...exam,
      questionMode,
      questions,
      totalQuestions: questions.length,
      updatedAt: new Date().toISOString(),
    };

    try {
      // 1. Client Firestore direct update
      try {
        await updateDoc(doc(db, "exams", exam.id), {
          questionMode,
          questions,
          totalQuestions: questions.length,
          updatedAt: new Date().toISOString(),
        });
      } catch (clientErr) {
        // 2. Server API fallback
        await fetch("/api/exams", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: exam.id,
            questionMode,
            questions,
          }),
        });
      }

      onUpdated(updatedExam);
      toast("Questions saved successfully! Ready for printing or assessment.");
      onClose();
    } catch (err: any) {
      console.error("Error saving questions:", err);
      toast("Failed to save questions", "error");
    } finally {
      setSaving(false);
    }
  };

  const displayedQuestions = questions.filter(q => {
    if (activeTab === "mcq") return q.type === "mcq";
    if (activeTab === "theory") return q.type === "theory";
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-4xl w-full h-[90vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 border-b border-gray-100 bg-slate-50/80 flex items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-800 border border-brand-200">
                {exam.className} • {exam.subjectName}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                Max: {exam.maxScore} marks
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">
              Question Paper Builder: {exam.title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenPreview({ ...exam, questions, questionMode })}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-white hover:border-brand-500 hover:text-brand-700 transition-colors shadow-xs"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview Paper</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SUMMARY STATS & CONFIG BAR */}
        <div className="p-3 sm:p-4 bg-white border-b border-gray-100 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          {/* Question Mode Selector */}
          <div className="sm:col-span-1">
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">
              Assessment Format:
            </label>
            <select
              value={questionMode}
              onChange={e => setQuestionMode(e.target.value as ExamQuestionMode)}
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white font-medium text-gray-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="both">Both (MCQ + Theory)</option>
              <option value="mcq_only">MCQ / Objectives Only</option>
              <option value="theory_only">Theory / Essay Only</option>
            </select>
          </div>

          {/* Counts */}
          <div className="bg-slate-50 p-2 rounded-lg flex items-center justify-between border border-gray-100">
            <div>
              <p className="text-[10px] text-gray-500">Section A (MCQs)</p>
              <p className="text-sm font-bold text-gray-900">{mcqQuestions.length} Questions</p>
            </div>
            <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
              {mcqMarks} pts
            </span>
          </div>

          <div className="bg-slate-50 p-2 rounded-lg flex items-center justify-between border border-gray-100">
            <div>
              <p className="text-[10px] text-gray-500">Section B (Theory)</p>
              <p className="text-sm font-bold text-gray-900">{theoryQuestions.length} Questions</p>
            </div>
            <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
              {theoryMarks} pts
            </span>
          </div>

          {/* Marks Balance Indicator */}
          <div className={`p-2 rounded-lg flex items-center justify-between border ${
            isMarksBalanced ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-amber-50 border-amber-200 text-amber-900"
          }`}>
            <div>
              <p className="text-[10px] font-medium">Total Marks Allocation</p>
              <p className="text-sm font-bold">
                {totalMarks} / {exam.maxScore} marks
              </p>
            </div>
            {isMarksBalanced ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600" />
            )}
          </div>
        </div>

        {/* TABS & ACTION BUTTONS */}
        <div className="p-3 sm:px-5 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                activeTab === "all" ? "bg-white text-brand-700 shadow-xs" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All Questions ({questions.length})
            </button>
            <button
              onClick={() => setActiveTab("mcq")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                activeTab === "mcq" ? "bg-white text-brand-700 shadow-xs" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              MCQs ({mcqQuestions.length})
            </button>
            <button
              onClick={() => setActiveTab("theory")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                activeTab === "theory" ? "bg-white text-brand-700 shadow-xs" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Theory ({theoryQuestions.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            {questions.length === 0 && (
              <button
                onClick={handleLoadSampleQuestions}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-800 text-xs font-semibold rounded-lg border border-brand-200 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                <span>Add Curriculum Samples</span>
              </button>
            )}

            {(questionMode === "both" || questionMode === "mcq_only") && (
              <button
                onClick={() => handleAddNew("mcq")}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ MCQ Question</span>
              </button>
            )}

            {(questionMode === "both" || questionMode === "theory_only") && (
              <button
                onClick={() => handleAddNew("theory")}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Theory Question</span>
              </button>
            )}
          </div>
        </div>

        {/* MAIN BODY: QUESTIONS LIST OR QUESTION EDITOR */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 space-y-4">
          
          {/* INLINE QUESTION EDITOR */}
          {isEditorOpen && (
            <div className="bg-white rounded-xl border-2 border-brand-500 p-5 shadow-lg space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                    formType === "mcq" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
                  }`}>
                    {formType === "mcq" ? "Multiple Choice Question (MCQ)" : "Theory / Essay Question"}
                  </span>
                  <span className="text-xs text-gray-500">
                    {editingQuestionId ? "Editing Question" : "New Question"}
                  </span>
                </div>
                <button
                  onClick={() => setIsEditorOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-700 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form: Type & Marks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Question Type
                  </label>
                  <select
                    value={formType}
                    onChange={e => {
                      const t = e.target.value as QuestionType;
                      setFormType(t);
                      setFormMarks(t === "mcq" ? 2 : 10);
                    }}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  >
                    <option value="mcq">Multiple Choice Question (MCQ)</option>
                    <option value="theory">Theory / Essay / Structured</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Marks / Points Allocation
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={formMarks}
                    onChange={e => setFormMarks(Number(e.target.value) || 1)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  />
                </div>
              </div>

              {/* Question Prompt */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Question Prompt / Text
                </label>
                <textarea
                  rows={3}
                  value={formPrompt}
                  onChange={e => setFormPrompt(e.target.value)}
                  placeholder={formType === "mcq" ? "Enter the question or problem stem..." : "Enter the theory question, e.g. 1. (a) Define... (b) Explain..."}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                />
              </div>

              {/* MCQ Options */}
              {formType === "mcq" && (
                <div className="space-y-2 bg-blue-50/40 p-3.5 rounded-xl border border-blue-100">
                  <div className="flex items-center justify-between text-xs font-semibold text-blue-900">
                    <span>Options & Correct Answer:</span>
                    <span className="text-[11px] text-blue-700 font-normal">Click radio circle to mark correct key</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {formOptions.map((opt, idx) => (
                      <div
                        key={opt.id}
                        className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                          formCorrectOption === opt.id
                            ? "bg-white border-brand-500 ring-2 ring-brand-200"
                            : "bg-white/80 border-gray-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name="correctOption"
                          id={`opt_${opt.id}`}
                          checked={formCorrectOption === opt.id}
                          onChange={() => setFormCorrectOption(opt.id)}
                          className="w-4 h-4 text-brand-600 focus:ring-brand-500 cursor-pointer"
                        />
                        <label htmlFor={`opt_${opt.id}`} className="font-bold text-xs text-brand-700 w-4">
                          {opt.id}.
                        </label>
                        <input
                          type="text"
                          value={opt.text}
                          onChange={e => {
                            const newText = e.target.value;
                            setFormOptions(opts => opts.map(o => o.id === opt.id ? { ...o, text: newText } : o));
                          }}
                          placeholder={`Option ${opt.id} content...`}
                          className="flex-1 text-xs px-2 py-1.5 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="pt-2">
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      Explanation / Solution Hint (Optional for teacher review):
                    </label>
                    <input
                      type="text"
                      value={formExplanation}
                      onChange={e => setFormExplanation(e.target.value)}
                      placeholder="Why this answer is correct..."
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                </div>
              )}

              {/* Theory Marking Rubric */}
              {formType === "theory" && (
                <div className="space-y-1.5 bg-purple-50/40 p-3.5 rounded-xl border border-purple-100">
                  <label className="block text-xs font-semibold text-purple-900">
                    Teacher Marking Guide / Grading Rubric (for marking guide & model answers):
                  </label>
                  <textarea
                    rows={3}
                    value={formRubric}
                    onChange={e => setFormRubric(e.target.value)}
                    placeholder="Breakdown of marks: e.g. (a) 4 marks for definition, (b) 6 marks for points..."
                    className="w-full text-xs px-3 py-2 rounded-lg border border-purple-200 bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              )}

              {/* Editor Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuestion}
                  className="px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingQuestionId ? "Update Question" : "Add to Exam"}</span>
                </button>
              </div>
            </div>
          )}

          {/* QUESTIONS LIST */}
          {displayedQuestions.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white rounded-xl border border-dashed border-gray-200 space-y-3">
              <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-gray-900">No questions in this section yet</h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Add Multiple Choice Questions (MCQs) or Theory questions above, or load curriculum sample questions to get started immediately.
              </p>
              <div className="pt-2 flex items-center justify-center gap-2">
                <button
                  onClick={handleLoadSampleQuestions}
                  className="px-3.5 py-2 bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold rounded-lg border border-brand-200 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Load Curriculum Samples
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {displayedQuestions.map((q, idx) => (
                <div
                  key={q.id}
                  className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs hover:border-brand-300 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {q.questionNumber || idx + 1}
                      </span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        q.type === "mcq" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
                      }`}>
                        {q.type === "mcq" ? "Objective (MCQ)" : "Theory / Essay"}
                      </span>
                      <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                        {q.marks} {q.marks === 1 ? "mark" : "marks"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(q)}
                        className="p-1.5 text-gray-400 hover:text-brand-600 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Edit question"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Delete question"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Prompt */}
                  <div className="text-xs sm:text-sm font-medium text-gray-900 leading-relaxed whitespace-pre-line pl-8">
                    {q.prompt}
                  </div>

                  {/* MCQ Options Display */}
                  {q.type === "mcq" && q.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-8 pt-1">
                      {q.options.map(opt => {
                        const isCorrect = q.correctOption === opt.id;
                        return (
                          <div
                            key={opt.id}
                            className={`p-2 rounded-lg text-xs flex items-start gap-2 border ${
                              isCorrect
                                ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-medium"
                                : "bg-slate-50 border-gray-100 text-gray-700"
                            }`}
                          >
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                              isCorrect ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-700"
                            }`}>
                              {opt.id}
                            </span>
                            <span className="flex-1">{opt.text}</span>
                            {isCorrect && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                                Answer Key
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Theory Rubric Guide Display */}
                  {q.type === "theory" && q.rubricOrGuide && (
                    <div className="ml-8 p-3 rounded-lg bg-purple-50/60 border border-purple-100 text-xs text-purple-950 space-y-1">
                      <p className="font-bold text-[11px] text-purple-800 uppercase tracking-wide">
                        Marking Scheme / Expected Points:
                      </p>
                      <p className="whitespace-pre-line font-mono text-[11px] leading-relaxed">
                        {q.rubricOrGuide}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 bg-white border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-gray-600 flex items-center gap-2">
            <span>{questions.length} total questions</span>
            <span>•</span>
            <span className={isMarksBalanced ? "text-emerald-700 font-semibold" : "text-amber-700 font-semibold"}>
              {totalMarks} of {exam.maxScore} marks allocated
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => onOpenPreview({ ...exam, questions, questionMode })}
              className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Preview Question Paper</span>
            </button>

            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="flex-1 sm:flex-none px-5 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/20 flex items-center justify-center gap-1.5 transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? "Saving Changes..." : "Save Assessment Questions"}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
