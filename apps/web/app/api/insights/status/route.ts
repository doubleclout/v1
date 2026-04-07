import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { insight, integration, executionEvent } from "@doubleclout/db";
import { eq, desc, sql, and } from "@doubleclout/db";
import { rankIdea } from "@/lib/idea-ranking";

type InsightStatus = "pending" | "internal" | "draft_generated" | "published" | "ignored";

export async function GET() {
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

  const rawInsights = await db
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

  const insights = rawInsights
    .map((item) => {
      const ranked = rankIdea(item);
      return {
        ...item,
        ideaScore: ranked.score,
        ideaReasons: ranked.reasons,
      };
    })
    .sort((a, b) => b.ideaScore - a.ideaScore);

  const [connectedSourcesResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(integration)
    .where(eq(integration.orgId, dbUser.orgId));

  const [ingestedEventsResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(executionEvent)
    .where(eq(executionEvent.orgId, dbUser.orgId));

  const recentEvents = await db
    .select({
      id: executionEvent.id,
      source: executionEvent.source,
      type: executionEvent.type,
      createdAt: executionEvent.createdAt,
    })
    .from(executionEvent)
    .where(eq(executionEvent.orgId, dbUser.orgId))
    .orderBy(desc(executionEvent.createdAt))
    .limit(5);

  return NextResponse.json({
    insights,
    stats: {
      connectedSources: connectedSourcesResult?.count ?? 0,
      ingestedEvents: ingestedEventsResult?.count ?? 0,
      recentEvents,
    },
  });
}

const allowedStatuses = new Set<InsightStatus>([
  "pending",
  "internal",
  "draft_generated",
  "published",
  "ignored",
]);

export async function PATCH(request: Request) {
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

  const body = (await request.json().catch(() => null)) as
    | { insightId?: string; status?: string }
    | null;
  const insightId = body?.insightId;
  const status = body?.status as InsightStatus | undefined;

  if (!insightId || !status) {
    return NextResponse.json({ error: "insight_id_and_status_required" }, { status: 400 });
  }

  if (!allowedStatuses.has(status)) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  const [existing] = await db
    .select({ id: insight.id })
    .from(insight)
    .where(and(eq(insight.id, insightId), eq(insight.orgId, dbUser.orgId)))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "insight_not_found" }, { status: 404 });
  }

  await db
    .update(insight)
    .set({ status, updatedAt: new Date() })
    .where(eq(insight.id, insightId));

  return NextResponse.json({ ok: true });
}
