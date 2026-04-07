import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { billingSubscription, org } from "@doubleclout/db";
import { and, eq } from "@doubleclout/db";

type Plan = "free" | "pro" | "team" | "enterprise";

const allowedPlans = new Set<Plan>(["free", "pro", "team", "enterprise"]);

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const dbUser = await db.query.user.findFirst({
    where: (u, { eq: userEq }) => userEq(u.authUserId, authUser.id),
  });
  if (!dbUser) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as { plan?: Plan } | null;
  const plan = body?.plan;
  if (!plan || !allowedPlans.has(plan)) {
    return NextResponse.json({ error: "invalid_plan" }, { status: 400 });
  }

  const [existing] = await db
    .select({ id: billingSubscription.id })
    .from(billingSubscription)
    .where(eq(billingSubscription.orgId, dbUser.orgId))
    .limit(1);

  if (existing) {
    await db
      .update(billingSubscription)
      .set({ plan, updatedAt: new Date() })
      .where(and(eq(billingSubscription.id, existing.id), eq(billingSubscription.orgId, dbUser.orgId)));
  } else {
    await db.insert(billingSubscription).values({
      orgId: dbUser.orgId,
      plan,
      status: "active",
    });
  }

  await db.update(org).set({ plan, updatedAt: new Date() }).where(eq(org.id, dbUser.orgId));

  return NextResponse.json({ ok: true, plan });
}
