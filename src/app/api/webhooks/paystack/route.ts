import { NextRequest, NextResponse } from "next/server";
import { doc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import crypto from "crypto";

function verify(body: string, signature: string): boolean {
  const secret = process.env.PAYSTACK_SECRET_KEY ?? "";
  const hash = crypto.createHmac("sha512", secret).update(body).digest("hex");
  return hash === signature;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig  = req.headers.get("x-paystack-signature") ?? "";

  if (!verify(body, sig)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { event: string; data: Record<string, unknown> };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const { event: eventType, data } = event;
  const meta = (data.metadata as Record<string, string>) ?? {};
  const schoolId = meta.schoolId;
  const plan     = meta.plan;

  switch (eventType) {
    case "subscription.create":
    case "charge.success": {
      if (schoolId && plan) {
        await updateDoc(doc(db, "schools", schoolId), {
          plan,
          subscriptionStatus: "active",
          paystackCustomerCode: data.customer
            ? (data.customer as Record<string, string>).customer_code
            : undefined,
          paystackSubscriptionCode: data.subscription_code ?? undefined,
          subscribedAt: new Date().toISOString(),
        });
      }
      break;
    }

    case "subscription.disable":
    case "invoice.payment_failed": {
      if (schoolId) {
        await updateDoc(doc(db, "schools", schoolId), {
          subscriptionStatus: eventType === "subscription.disable" ? "cancelled" : "past_due",
        });
      }
      break;
    }

    case "subscription.not_renew":
    case "customeridentification.failed": {
      if (schoolId) {
        await updateDoc(doc(db, "schools", schoolId), {
          subscriptionStatus: "cancelled",
        });
      }
      break;
    }

    default:
      // Unhandled event type — still return 200 so Paystack doesn't retry
      break;
  }

  return NextResponse.json({ received: true });
}
