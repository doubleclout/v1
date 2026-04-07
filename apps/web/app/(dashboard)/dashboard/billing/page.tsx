import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { billingSubscription, insight } from "@doubleclout/db";
import { eq, sql } from "@doubleclout/db";
import { BillingClient } from "./billing-client";

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return null;

  const dbUser = await db.query.user.findFirst({
    where: (u, { eq }) => eq(u.authUserId, authUser.id),
    with: { org: true },
  });
  if (!dbUser) return null;

  const [sub] = await db.select().from(billingSubscription).where(eq(billingSubscription.orgId, dbUser.orgId)).limit(1);
  const [usage] = await db.select({ count: sql<number>`count(*)::int` }).from(insight).where(eq(insight.orgId, dbUser.orgId));

  const plan = (sub?.plan ?? dbUser.org?.plan ?? "free") as "free" | "pro" | "team" | "enterprise";
  const used = usage?.count ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription and usage
        </p>
      </div>

      <BillingClient plan={plan} used={used} />
    </div>
  );
}
