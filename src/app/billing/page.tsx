"use client";

import { useState, useEffect } from "react";
import { Check, Zap, Building2, Rocket, Loader2 } from "lucide-react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { SCHOOL_PLANS, PlanKey, loadPaystackScript, initPaystackPopup } from "@/lib/billing";
import Topbar from "@/components/layout/Topbar";
import { toast } from "@/components/ui/Toast";

const ICONS: Record<PlanKey, React.ReactNode> = {
  starter: <Zap className="w-5 h-5" />,
  growth:  <Building2 className="w-5 h-5" />,
  group:   <Rocket className="w-5 h-5" />,
};

export default function BillingPage() {
  const { user, appUser } = useAuth();
  const [currentPlan, setCurrentPlan]   = useState<PlanKey | null>(null);
  const [subStatus, setSubStatus]       = useState("");
  const [loadingPlan, setLoadingPlan]   = useState(true);
  const [processing, setProcessing]     = useState<PlanKey | null>(null);

  useEffect(() => {
    const sid = appUser?.schoolId;
    if (!sid) { setLoadingPlan(false); return; }
    getDoc(doc(db, "schools", sid))
      .then(snap => {
        if (snap.exists()) {
          const d = snap.data();
          if (d.plan && d.plan !== "free") setCurrentPlan(d.plan as PlanKey);
          if (d.subscriptionStatus) setSubStatus(d.subscriptionStatus);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingPlan(false));
  }, [appUser?.schoolId]);

  const handleSubscribe = async (planKey: PlanKey) => {
    if (!user?.email || !appUser?.schoolId) return;
    setProcessing(planKey);
    try {
      await loadPaystackScript();
      initPaystackPopup({
        email: user.email,
        planCode: SCHOOL_PLANS[planKey].planCode,
        metadata: { schoolId: appUser.schoolId, plan: planKey, userId: user.uid },
        onSuccess: async (reference) => {
          await updateDoc(doc(db, "schools", appUser.schoolId), {
            plan: planKey, paystackReference: reference,
            subscriptionStatus: "active", subscribedAt: new Date().toISOString(),
          });
          setCurrentPlan(planKey); setSubStatus("active");
          toast(`Subscribed to ${SCHOOL_PLANS[planKey].name} plan!`);
          setProcessing(null);
        },
        onClose: () => setProcessing(null),
      });
    } catch {
      toast("Failed to open checkout", "error");
      setProcessing(null);
    }
  };

  const isActive = (k: PlanKey) => currentPlan === k && subStatus === "active";

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Billing & plans"
        subtitle={currentPlan && subStatus === "active"
          ? `Active: ${SCHOOL_PLANS[currentPlan].name} plan`
          : "Choose a plan for your school"} />

      <div className="flex-1 p-6 animate-fade-in">

        {currentPlan && subStatus === "active" && (
          <div className="mb-6 flex items-center gap-3 px-5 py-4 bg-brand-50 border border-brand-200 rounded-xl">
            <Check className="w-5 h-5 text-brand-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-brand-900">
                You&apos;re on the {SCHOOL_PLANS[currentPlan].name} plan
              </p>
              <p className="text-xs text-brand-700 mt-0.5">
                Up to {SCHOOL_PLANS[currentPlan].maxStudents.toLocaleString()} students ·
                ₦{SCHOOL_PLANS[currentPlan].naira.toLocaleString()} {SCHOOL_PLANS[currentPlan].period}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl">
          {(Object.keys(SCHOOL_PLANS) as PlanKey[]).map(key => {
            const plan = SCHOOL_PLANS[key];
            const active = isActive(key);
            const isGrowth = key === "growth";

            return (
              <div key={key}
                className={`bg-white rounded-2xl border shadow-sm flex flex-col
                  ${active ? "border-green-400 ring-1 ring-green-200" : isGrowth ? "border-brand-300" : "border-gray-100"}`}>
                {active ? (
                  <div className="bg-green-500 text-white text-xs font-semibold text-center py-1.5 rounded-t-2xl">CURRENT PLAN</div>
                ) : isGrowth ? (
                  <div className="bg-brand-600 text-white text-xs font-semibold text-center py-1.5 rounded-t-2xl">MOST POPULAR</div>
                ) : null}

                <div className="p-6 flex flex-col flex-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4
                    ${active ? "bg-green-100 text-green-700" : isGrowth ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                    {ICONS[key]}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    {plan.maxStudents < 99999 ? `Up to ${plan.maxStudents} students` : "Unlimited students"}
                  </p>
                  <div className="mb-6">
                    <span className="text-3xl font-bold text-gray-900">₦{plan.naira.toLocaleString()}</span>
                    <span className="text-sm text-muted-foreground"> /{plan.period}</span>
                  </div>
                  <ul className="space-y-2.5 mb-8 flex-1">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700">
                        <Check className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" /> {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => !active && handleSubscribe(key)}
                    disabled={!!processing || loadingPlan}
                    className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors
                      ${active ? "bg-green-50 text-green-700 cursor-default"
                        : isGrowth ? "bg-brand-600 hover:bg-brand-700 text-white"
                        : "border border-gray-200 hover:bg-gray-50 text-gray-800"
                      } disabled:opacity-60`}>
                    {loadingPlan ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> :
                     active ? "✓ Active plan" :
                     processing === key ? "Opening checkout…" :
                     currentPlan ? `Switch to ${plan.name}` :
                     `Subscribe — ₦${plan.naira.toLocaleString()}/${plan.period}`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 max-w-lg space-y-1">
          <p className="text-xs text-muted-foreground">Billed per term in Nigerian Naira via Paystack. Cancel anytime.</p>
          <p className="text-xs text-muted-foreground">
            Need custom pricing for a school group?{" "}
            <a href="mailto:hello@schoolng.com" className="text-brand-600 hover:underline">Contact us</a>
          </p>
        </div>
      </div>
    </div>
  );
}
