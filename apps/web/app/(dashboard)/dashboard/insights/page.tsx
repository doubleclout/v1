import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { insight } from "@doubleclout/db";
import { eq, desc } from "drizzle-orm";
import { InsightsClient } from "./insights-client";

export default async function InsightsPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) return null;

  const dbUser = await db.query.user.findFirst({
    where: (u, { eq }) => eq(u.authUserId, authUser.id),
  });

  if (!dbUser) return null;

  const insights = await db
    .select({
      id: insight.id,
      summary: insight.summary,
      confidence: insight.confidence,
      sensitivity: insight.sensitivity,
      status: insight.status,
      sourceAttribution: insight.sourceAttribution,
      createdAt: insight.createdAt,
    })
    .from(insight)
    .where(eq(insight.orgId, dbUser.orgId))
    .orderBy(desc(insight.createdAt))
    .limit(50);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Insights</h1>
        <p className="text-muted-foreground">
          View and manage extracted insights from your sources
        </p>
      </div>

      <InsightsClient insights={insights} />
    </div>
  );
}
