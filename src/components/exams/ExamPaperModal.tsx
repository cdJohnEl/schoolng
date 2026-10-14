"use client";

import { useState } from "react";
import {
  X, Printer, CheckCircle2, AlertCircle, FileText,
  Eye, EyeOff, Award, Play, RotateCcw, ArrowRight, BookOpen
} from "lucide-react";
import type { ExamAssessment, ExamQuestion } from "@/types";

interface Props {
  exam: ExamAssessment | null;
  isOpen: boolean;
  onClose: () => void;
  schoolName?: string;
}

export default function ExamPaperModal({
  exam,
  isOpen,
  onClose,
  schoolName = "Bright Stars International School",
}: Props) {
  const [showMarkingScheme, setShowMarkingScheme] = useState(false);
  const [practiceMode, setPracticeMode] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [submittedPractice, setSubmittedPractice] = useState(false);

  if (!isOpen || !exam) return null;

  const questions: ExamQuestion[] = exam.questions || [];
  const mcqs = questions.filter(q => q.type === "mcq");
  const theories = questions.filter(q => q.type === "theory");

  // Mock scoring calculation for practice mode
  const correctMcqs = mcqs.filter(q => selectedAnswers[q.id] === q.correctOption).length;
  const mcqScoreEarned = mcqs.reduce((acc, q) => {
    if (selectedAnswers[q.id] === q.correctOption) {
      return acc + (Number(q.marks) || 0);
    }
    return acc;
  }, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleAnswerSelect = (qId: string, optId: string) => {
    if (submittedPractice) return;
    setSelectedAnswers(prev => ({ ...prev, [qId]: optId }));
  };

  const resetPractice = () => {
    setSelectedAnswers({});
    setSubmittedPractice(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl max-w-4xl w-full h-[92vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden print:h-auto print:max-w-none print:shadow-none print:border-none print:rounded-none">
        
        {/* NON-PRINT CONTROLS BAR */}
        <div className="p-3 sm:p-4 border-b border-gray-100 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-brand-600 text-white">
              <FileText className="w-4 h-4" />
            </span>
            <div>
              <p className="text-xs font-bold leading-tight">Official Question Paper View</p>
              <p className="text-[11px] text-slate-300">{exam.title} • {exam.className}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Practice Mode Toggle */}
            <button
              onClick={() => {
                setPracticeMode(!practiceMode);
                if (practiceMode) resetPractice();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                practiceMode ? "bg-amber-500 text-slate-950 font-bold" : "bg-slate-800 text-slate-200 hover:bg-slate-700"
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span>{practiceMode ? "Exit CBT Practice" : "Student Mock CBT Mode"}</span>
            </button>

            {/* Marking Scheme Toggle */}
            <button
              onClick={() => setShowMarkingScheme(!showMarkingScheme)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                showMarkingScheme ? "bg-purple-600 text-white" : "bg-slate-800 text-slate-200 hover:bg-slate-700"
              }`}
            >
              {showMarkingScheme ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showMarkingScheme ? "Hide Marking Key" : "Show Marking Scheme"}</span>
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Question Paper</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE EXAM PAPER CONTAINER */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-white space-y-6 print:p-0 print:space-y-4 font-sans text-gray-900">
          
          {/* Practice Mode Banner */}
          {practiceMode && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-wrap items-center justify-between gap-3 print:hidden">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <span className="font-bold">Student Computer-Based Test (CBT) Practice Mode: </span>
                  <span>Answer the objective questions below to test knowledge with instant scoring.</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!submittedPractice ? (
                  <button
                    onClick={() => setSubmittedPractice(true)}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-xs"
                  >
                    Submit Test & Grade
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-950 bg-amber-200 px-2 py-1 rounded">
                      Score: {correctMcqs}/{mcqs.length} ({mcqScoreEarned} pts)
                    </span>
                    <button
                      onClick={resetPractice}
                      className="px-2.5 py-1 bg-white border border-amber-300 text-amber-800 font-semibold rounded-lg flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Retry
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* OFFICIAL EXAMINATION PAPER HEADER */}
          <div className="text-center border-b-2 border-slate-900 pb-5 space-y-1.5">
            <p className="text-xs uppercase tracking-widest font-bold text-slate-600">
              Federal Republic of Nigeria • Ministry of Education Curriculum
            </p>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-950">
              {schoolName}
            </h1>
            <p className="text-sm font-bold uppercase tracking-wider text-slate-800">
              {exam.title}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-xs font-semibold text-slate-700 pt-1">
              <span>CLASS: <strong className="text-black uppercase">{exam.className}</strong></span>
              <span>•</span>
              <span>SUBJECT: <strong className="text-black uppercase">{exam.subjectName}</strong></span>
              <span>•</span>
              <span>TIME ALLOWED: <strong className="text-black">{exam.duration || "1 Hour"}</strong></span>
              <span>•</span>
              <span>MAX MARKS: <strong className="text-black">{exam.maxScore} MARKS</strong></span>
            </div>
          </div>

          {/* CANDIDATE DETAILS FILL-IN BOX */}
          <div className="border border-slate-300 rounded-lg p-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50/50 print:bg-transparent">
            <div>
              <span className="font-bold text-slate-700">CANDIDATE NAME: </span>
              <span className="border-b border-dotted border-slate-500 inline-block w-40 sm:w-48 ml-1"></span>
            </div>
            <div>
              <span className="font-bold text-slate-700">ADMISSION NO: </span>
              <span className="border-b border-dotted border-slate-500 inline-block w-28 ml-1"></span>
            </div>
            <div>
              <span className="font-bold text-slate-700">DATE: </span>
              <span className="border-b border-dotted border-slate-500 inline-block w-28 ml-1">{exam.date}</span>
            </div>
          </div>

          {/* GENERAL INSTRUCTIONS */}
          <div className="text-xs bg-slate-50 rounded-lg p-3 border border-slate-200 print:bg-transparent">
            <span className="font-bold uppercase tracking-wide text-slate-800 block mb-1">
              General Instructions to Candidates:
            </span>
            <p className="text-slate-700 leading-relaxed italic">
              {exam.instructions || "1. Answer all questions in Section A by choosing the single correct option. 2. In Section B, write clearly and legibly in the spaces provided. 3. Erasures and cancellations must be kept neat. Calculators are prohibited unless explicitly permitted."}
            </p>
          </div>

          {/* SECTION A: OBJECTIVES / MCQS */}
          {mcqs.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="border-b-2 border-slate-800 pb-1 flex items-center justify-between">
                <h3 className="font-black text-sm sm:text-base uppercase tracking-wider text-slate-900">
                  SECTION A: OBJECTIVE TEST ({mcqs.length} Questions)
                </h3>
                <span className="text-xs font-bold text-slate-700 uppercase">
                  [Each question carries {mcqs[0]?.marks || 2} marks]
                </span>
              </div>

              <div className="space-y-5">
                {mcqs.map((q, idx) => {
                  const userChoice = selectedAnswers[q.id];
                  const isCorrect = userChoice === q.correctOption;

                  return (
                    <div key={q.id} className="text-xs sm:text-sm space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-slate-900 shrink-0">
                          {idx + 1}.
                        </span>
                        <p className="font-medium text-slate-900 leading-relaxed">
                          {q.prompt}
                        </p>
                        <span className="text-[11px] font-semibold text-slate-500 shrink-0 ml-auto print:hidden">
                          [{q.marks}m]
                        </span>
                      </div>

                      {/* Options */}
                      {q.options && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-5 pt-1">
                          {q.options.map(opt => {
                            const isSelected = userChoice === opt.id;
                            const isAnswerKey = q.correctOption === opt.id;

                            return (
                              <div
                                key={opt.id}
                                onClick={() => practiceMode && handleAnswerSelect(q.id, opt.id)}
                                className={`flex items-start gap-2 p-1.5 rounded transition-colors ${
                                  practiceMode ? "cursor-pointer hover:bg-slate-100" : ""
                                } ${
                                  practiceMode && isSelected ? "bg-brand-50 border border-brand-300" : ""
                                } ${
                                  submittedPractice && isAnswerKey ? "bg-emerald-50 border border-emerald-400 font-bold" : ""
                                } ${
                                  submittedPractice && isSelected && !isCorrect ? "bg-red-50 border border-red-300 line-through" : ""
                                }`}
                              >
                                <span className={`w-5 h-5 rounded-full border border-slate-400 text-[11px] font-bold flex items-center justify-center shrink-0 ${
                                  isSelected ? "bg-brand-600 text-white border-brand-600" : ""
                                } ${
                                  (showMarkingScheme || submittedPractice) && isAnswerKey
                                    ? "bg-emerald-600 text-white border-emerald-600 font-bold"
                                    : ""
                                }`}>
                                  {opt.id}
                                </span>
                                <span className="text-slate-800 leading-snug">
                                  {opt.text}
                                </span>
                                {(showMarkingScheme || submittedPractice) && isAnswerKey && (
                                  <span className="ml-auto text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1 py-0.2 rounded print:hidden">
                                    KEY ✓
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Explanation in Marking Scheme */}
                      {showMarkingScheme && q.explanation && (
                        <div className="ml-5 p-2 rounded bg-blue-50 border border-blue-200 text-xs text-blue-900 print:border-dotted">
                          <strong className="text-blue-950">Explanation: </strong> {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION B: THEORY / ESSAY */}
          {theories.length > 0 && (
            <div className="space-y-4 pt-6 border-t-2 border-slate-900">
              <div className="border-b-2 border-slate-800 pb-1 flex items-center justify-between">
                <h3 className="font-black text-sm sm:text-base uppercase tracking-wider text-slate-900">
                  SECTION B: THEORY & STRUCTURED ESSAY
                </h3>
                <span className="text-xs font-bold text-slate-700 uppercase">
                  [Answer all questions in this section]
                </span>
              </div>

              <div className="space-y-6">
                {theories.map((q, idx) => (
                  <div key={q.id} className="text-xs sm:text-sm space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-slate-900 shrink-0">
                          {mcqs.length + idx + 1}.
                        </span>
                        <div className="font-medium text-slate-900 leading-relaxed whitespace-pre-line">
                          {q.prompt}
                        </div>
                      </div>
                      <span className="font-bold text-slate-800 shrink-0 text-xs">
                        [{q.marks} Marks]
                      </span>
                    </div>

                    {/* Lined write-in space for student question paper */}
                    <div className="pl-6 space-y-4 print:space-y-5 py-2">
                      <div className="border-b border-slate-200 h-6"></div>
                      <div className="border-b border-slate-200 h-6"></div>
                      <div className="border-b border-slate-200 h-6"></div>
                      <div className="border-b border-slate-200 h-6"></div>
                    </div>

                    {/* Marking Scheme View for Teacher */}
                    {showMarkingScheme && q.rubricOrGuide && (
                      <div className="ml-6 p-3 rounded-lg bg-purple-50 border border-purple-200 text-xs text-purple-950 space-y-1 print:border-dotted">
                        <p className="font-bold uppercase tracking-wider text-purple-900 text-[11px]">
                          Official Marking Scheme & Model Rubric:
                        </p>
                        <p className="font-mono text-[11px] leading-relaxed whitespace-pre-line">
                          {q.rubricOrGuide}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PAPER FOOTER */}
          <div className="border-t-2 border-slate-900 pt-3 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">
            *** END OF EXAMINATION PAPER ***
          </div>

        </div>

      </div>
    </div>
  );
}
