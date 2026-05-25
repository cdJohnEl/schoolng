export const SCHOOL_PLANS = {
  starter: {
    name: "Starter",
    planCode: process.env.NEXT_PUBLIC_PAYSTACK_PLAN_STARTER ?? "PLN_starter",
    naira: 25_000,
    period: "per term",
    maxStudents: 150,
    features: ["Up to 150 students", "All core modules", "PDF report cards", "Fee receipts", "2 staff logins"],
  },
  growth: {
    name: "Growth",
    planCode: process.env.NEXT_PUBLIC_PAYSTACK_PLAN_GROWTH ?? "PLN_growth",
    naira: 50_000,
    period: "per term",
    maxStudents: 500,
    features: ["Up to 500 students", "Everything in Starter", "SMS notifications", "Parent portal", "10 staff logins", "Priority support"],
  },
  group: {
    name: "School Group",
    planCode: process.env.NEXT_PUBLIC_PAYSTACK_PLAN_GROUP ?? "PLN_group",
    naira: 120_000,
    period: "per term",
    maxStudents: 99999,
    features: ["Unlimited students", "Multi-branch support", "Unlimited staff logins", "Custom report card", "Dedicated support"],
  },
} as const;

export type PlanKey = keyof typeof SCHOOL_PLANS;

export function loadPaystackScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById("paystack-inline")) { resolve(); return; }
    const s = document.createElement("script");
    s.id = "paystack-inline";
    s.src = "https://js.paystack.co/v1/inline.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Paystack"));
    document.head.appendChild(s);
  });
}

export function initPaystackPopup(opts: {
  email: string; planCode: string;
  metadata?: Record<string, unknown>;
  onSuccess: (ref: string) => void;
  onClose: () => void;
}) {
  // @ts-expect-error PaystackPop from CDN
  const handler = window.PaystackPop.setup({
    key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
    email: opts.email, plan: opts.planCode, currency: "NGN",
    metadata: opts.metadata ?? {},
    callback: (res: { reference: string }) => opts.onSuccess(res.reference),
    onClose: opts.onClose,
  });
  handler.openIframe();
}
