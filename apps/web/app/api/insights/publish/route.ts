import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { draft, insight, publication, sensitivityConfig } from "@doubleclout/db";
import { and, desc, eq } from "@doubleclout/db";
import { generateDraft } from "@doubleclout/ai";
import { applySensitivityRules } from "@/lib/sensitivity";

type DraftVariation = "educational" | "tactical" | "reflective";
type ContentFormat = "short" | "medium" | "long";

function toVariation(format: ContentFormat | undefined): DraftVariation {
  if (format === "short") return "educational";
  if (format === "long") return "reflective";
  return "tactical";
}

function estimateMetrics(content: string) {
  const base = Math.max(800, Math.min(18000, content.length * 25));
  return {
    impressions: base,
    likes: Math.round(base * 0.035),
    comments: Math.round(base * 0.006),
  };
}

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

  const body = (await request.json().catch(() => null)) as
    | { insightId?: string; format?: ContentFormat }
    | null;
  const insightId = body?.insightId;
  if (!insightId) {
    return NextResponse.json({ error: "insight_id_required" }, { status: 400 });
  }

  const [insightRow] = await db
    .select()
    .from(insight)
    .where(and(eq(insight.id, insightId), eq(insight.orgId, dbUser.orgId)))
    .limit(1);

  if (!insightRow) {
    return NextResponse.json({ error: "insight_not_found" }, { status: 404 });
  }

  let [latestDraft] = await db
    .select({
      id: draft.id,
      content: draft.content,
      variation: draft.variation,
      createdAt: draft.createdAt,
    })
    .from(draft)
    .where(and(eq(draft.orgId, dbUser.orgId), eq(draft.insightId, insightRow.id)))
    .orderBy(desc(draft.createdAt))
    .limit(1);

  if (!latestDraft) {
    const variation = toVariation(body?.format);
    const content = await generateDraft(insightRow.summary, variation);
    const [draftRow] = await db
      .insert(draft)
      .values({
        orgId: dbUser.orgId,
        insightId: insightRow.id,
        variation,
        content,
      })
      .returning({ id: draft.id, content: draft.content, variation: draft.variation, createdAt: draft.createdAt });
    latestDraft = draftRow;
  }

  const [sensitivity] = await db
    .select()
    .from(sensitivityConfig)
    .where(eq(sensitivityConfig.orgId, dbUser.orgId))
    .limit(1);

  const safeContent = applySensitivityRules(latestDraft.content, {
    toggles: (sensitivity?.toggles as Record<string, string>) ?? {},
    redactionStrictness: sensitivity?.redactionStrictness ?? "moderate",
  });

  if (safeContent !== latestDraft.content) {
    await db
      .update(draft)
      .set({ content: safeContent })
      .where(eq(draft.id, latestDraft.id));
    latestDraft = { ...latestDraft, content: safeContent };
  }

  const metrics = estimateMetrics(latestDraft.content);

  const [publicationRow] = await db
    .insert(publication)
    .values({
      orgId: dbUser.orgId,
      draftId: latestDraft.id,
      platform: "linkedin",
      status: "published",
      publishedAt: new Date(),
      metrics,
    })
    .returning({
      id: publication.id,
      platform: publication.platform,
      status: publication.status,
      publishedAt: publication.publishedAt,
      metrics: publication.metrics,
    });

  await db
    .update(insight)
    .set({ status: "published", updatedAt: new Date() })
    .where(eq(insight.id, insightRow.id));

  return NextResponse.json({
    publication: publicationRow,
    draft: latestDraft,
  });
}
