import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { draft, insight, sensitivityConfig } from "@doubleclout/db";
import { and, eq } from "@doubleclout/db";
import { generateDraft } from "@doubleclout/ai";
import { applySensitivityRules } from "@/lib/sensitivity";

type DraftVariation = "educational" | "tactical" | "reflective";

function toVariation(format: string | undefined): DraftVariation {
  if (format === "short") return "educational";
  if (format === "long") return "reflective";
  return "tactical";
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
    | { insightId?: string; format?: "short" | "medium" | "long" }
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

  const variation = toVariation(body?.format);
  const generated = await generateDraft(insightRow.summary, variation);
  const [sensitivity] = await db
    .select()
    .from(sensitivityConfig)
    .where(eq(sensitivityConfig.orgId, dbUser.orgId))
    .limit(1);
  const content = applySensitivityRules(generated, {
    toggles: (sensitivity?.toggles as Record<string, string>) ?? {},
    redactionStrictness: sensitivity?.redactionStrictness ?? "moderate",
  });

  const [draftRow] = await db
    .insert(draft)
    .values({
      orgId: dbUser.orgId,
      insightId: insightRow.id,
      variation,
      content,
    })
    .returning({ id: draft.id, content: draft.content, variation: draft.variation });

  await db
    .update(insight)
    .set({ status: "draft_generated", updatedAt: new Date() })
    .where(eq(insight.id, insightRow.id));

  return NextResponse.json({ draft: draftRow });
}
