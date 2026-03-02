import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { billingSubscription, org } from "@doubleclout/db";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("webhook-signature") ?? "";

  // TODO: Verify Dodo webhook signature with DODO_WEBHOOK_SECRET
  // For now accept all (implement HMAC verification per Dodo docs)

  let payload: { type?: string; data?: { subscription?: { id: string; customer_id: string }; customer_id?: string } };
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = payload.type;
  const subscription = payload.data?.subscription;
  const customerId = payload.data?.customer_id ?? subscription?.customer_id;

  if (!eventType) {
    return NextResponse.json({ error: "No event type" }, { status: 400 });
  }

  const subEvents = [
    "subscription.active",
    "subscription.updated",
    "subscription.renewed",
    "subscription.plan_changed",
    "subscription.cancelled",
    "subscription.on_hold",
    "subscription.expired",
  ];

  if (subEvents.some((e) => eventType.startsWith("subscription"))) {
    // Update billing_subscription - would need org_id from metadata
    // For now log
    console.log("Dodo webhook:", eventType, payload);
  }

  return NextResponse.json({ received: true });
}
