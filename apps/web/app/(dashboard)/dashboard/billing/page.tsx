import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { billingSubscription, insight } from "@doubleclout/db";
import { eq, sql } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const PLAN_LIMITS = { free: 10, pro: 100, team: 500 };

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

  const plan = sub?.plan ?? dbUser.org?.plan ?? "free";
  const limit = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] ?? 10;
  const used = usage?.count ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription and usage
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>{plan.charAt(0).toUpperCase() + plan.slice(1)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Insights this month</span>
              <span>{used} / {limit}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${Math.min(100, (used / limit) * 100)}%` }}
              />
            </div>
          </div>
          <Button>Upgrade to Pro</Button>
        </CardContent>
      </Card>
    </div>
  );
}
