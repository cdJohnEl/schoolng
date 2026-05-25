"use client";

import { useState, useEffect } from "react";
import { ArrowRight, GraduationCap, AlertTriangle, CheckCircle2, WifiOff, Users } from "lucide-react";
import { collection, query, where, getDocs, writeBatch, doc, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { useSchool } from "@/hooks/useSchool";
import Topbar from "@/components/layout/Topbar";
import { getInitials } from "@/lib/utils";
import { NIGERIAN_CLASSES } from "@/types";
import { toast } from "@/components/ui/Toast";
import type { SchoolClass, Student } from "@/types";

interface ClassGroup {
  cls: SchoolClass;
  students: Student[];
  nextClass: SchoolClass | null;
  isGraduating: boolean;
  selected: boolean;
}

export default function PromotePage() {
  const { appUser } = useAuth();
  const { session } = useSchool();
  const schoolId = appUser?.schoolId ?? "";

  const [groups, setGroups]         = useState<ClassGroup[]>([]);
  const [loading, setLoading]       = useState(true);
  const [promoting, setPromoting]   = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [done, setDone]             = useState(false);

  useEffect(() => {
    if (!schoolId) { setLoading(false); return; }
    Promise.all([
      getDocs(query(collection(db, "classes"), where("schoolId", "==", schoolId), orderBy("order", "asc"))),
      getDocs(query(collection(db, "students"), where("schoolId", "==", schoolId), where("status", "==", "active"))),
    ])
      .then(([classSnap, studentSnap]) => {
        const classes = classSnap.docs.map(d => ({ id: d.id, ...d.data() } as SchoolClass));
        const students = studentSnap.docs.map(d => ({ id: d.id, ...d.data() } as Student));

        // Map each class to its next class
        const grouped: ClassGroup[] = classes.map(cls => {
          const template = NIGERIAN_CLASSES.find(t => t.name === cls.name);
          const nextOrder = (template?.order ?? cls.order) + 1;

          // Find next class (same arm if possible, any arm otherwise)
          const nextWithSameArm = classes.find(c =>
            NIGERIAN_CLASSES.find(t => t.name === c.name)?.order === nextOrder && c.arm === cls.arm
          );
          const nextAny = classes.find(c =>
            NIGERIAN_CLASSES.find(t => t.name === c.name)?.order === nextOrder
          );
          const nextClass = nextWithSameArm ?? nextAny ?? null;

          // SS 3 students graduate
          const isGraduating = cls.name === "SS 3" || cls.name === "Basic 6";

          return {
            cls,
            students: students.filter(s => s.classId === cls.id),
            nextClass,
            isGraduating,
            selected: true,
          };
        }).filter(g => g.students.length > 0);

        setGroups(grouped);
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, [schoolId]);

  const toggleGroup = (classId: string) => {
    setGroups(prev => prev.map(g => g.cls.id === classId ? { ...g, selected: !g.selected } : g));
  };

  const totalSelected = groups.filter(g => g.selected).reduce((s, g) => s + g.students.length, 0);

  const handlePromote = async () => {
    const confirmed = window.confirm(
      `This will promote ${totalSelected} students to their next classes. This cannot be undone. Continue?`
    );
    if (!confirmed) return;

    setPromoting(true);
    try {
      const batch = writeBatch(db);

      for (const group of groups) {
        if (!group.selected) continue;
        for (const student of group.students) {
          const studentRef = doc(db, "students", student.id);
          if (group.isGraduating) {
            batch.update(studentRef, { status: "graduated", updatedAt: new Date().toISOString() });
          } else if (group.nextClass) {
            batch.update(studentRef, {
              classId: group.nextClass.id,
              sessionId: session?.id ?? "",
              updatedAt: new Date().toISOString(),
            });
          }
        }
      }

      await batch.commit();
      setDone(true);
      toast(`${totalSelected} students promoted successfully`);
    } catch {
      toast("Promotion failed. Please try again.", "error");
    } finally {
      setPromoting(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Student promotion" subtitle="Promote students to next class" />
      <div className="flex-1 flex justify-center items-center">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Student promotion" subtitle="Move students to next class at end of session"
        actions={
          !done && groups.some(g => g.selected) && (
            <button onClick={handlePromote} disabled={promoting}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
              <GraduationCap className="w-4 h-4" />
              {promoting ? "Promoting…" : `Promote ${totalSelected} students`}
            </button>
          )
        }
      />

      <div className="flex-1 p-6 space-y-5 animate-fade-in">

        {fetchError && (
          <div className="flex items-center gap-3 px-4 py-3.5 bg-red-50 border border-red-200 rounded-xl text-sm">
            <WifiOff className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span className="text-red-700 flex-1">Failed to load student data.</span>
            <button onClick={() => window.location.reload()} className="text-red-700 font-medium underline text-xs">Retry</button>
          </div>
        )}

        {done ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-green-900 mb-2">Promotion complete!</h2>
            <p className="text-sm text-green-700">
              {totalSelected} students have been moved to their new classes.
              SS 3 / Basic 6 students have been marked as graduated.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 leading-relaxed">
                <strong>End of session action.</strong> This promotes all selected students to their next class.
                SS 3 and Basic 6 students will be marked as <em>graduated</em>.
                Deselect any class you do not want promoted yet.
                This action is permanent — ensure all results and fees are finalised first.
              </div>
            </div>

            {groups.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
                <Users className="w-10 h-10 text-gray-300 mx-auto mb-4" />
                <p className="text-sm font-medium text-gray-700">No active students found</p>
                <p className="text-xs text-muted-foreground mt-1">Add students to your classes first</p>
              </div>
            ) : (
              <div className="space-y-3">
                {groups.map(g => {
                  const cName = `${g.cls.name}${g.cls.arm ? ` ${g.cls.arm}` : ""}`;
                  const nextName = g.isGraduating
                    ? "Graduate"
                    : g.nextClass
                      ? `${g.nextClass.name}${g.nextClass.arm ? ` ${g.nextClass.arm}` : ""}`
                      : "No next class configured";

                  return (
                    <div key={g.cls.id}
                      className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-colors
                        ${g.selected ? "border-brand-200" : "border-gray-100 opacity-60"}`}>
                      <div className="flex items-center gap-4 px-5 py-4">
                        <input type="checkbox" checked={g.selected}
                          onChange={() => toggleGroup(g.cls.id)}
                          className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 cursor-pointer" />
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-gray-900">{cName}</span>
                            <span className="text-xs text-muted-foreground">{g.students.length} students</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-500">{cName}</span>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                          <span className={`font-medium ${g.isGraduating ? "text-purple-600" : g.nextClass ? "text-brand-600" : "text-red-500"}`}>
                            {nextName}
                          </span>
                          {g.isGraduating && <GraduationCap className="w-4 h-4 text-purple-500" />}
                        </div>
                      </div>

                      {/* Student list preview */}
                      {g.selected && (
                        <div className="border-t border-gray-100 px-5 py-3">
                          <div className="flex flex-wrap gap-2">
                            {g.students.slice(0, 8).map(s => (
                              <div key={s.id} className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-lg text-xs text-gray-700">
                                <div className="w-5 h-5 rounded-full bg-brand-100 flex items-center justify-center text-[10px] font-bold text-brand-700">
                                  {getInitials(`${s.firstName} ${s.lastName}`)}
                                </div>
                                {s.firstName} {s.lastName}
                              </div>
                            ))}
                            {g.students.length > 8 && (
                              <span className="text-xs text-muted-foreground px-2 py-1">+{g.students.length - 8} more</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
