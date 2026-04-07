import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { draft, insight } from "@doubleclout/db";
import { and, desc, eq } from "@doubleclout/db";
import { DraftLabClient } from "./draft-lab-client";

type PageProps = {
  params: { insightId: string };
};

export default async function InsightDraftLabPage({ params }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const dbUser = await db.query.user.findFirst({
    where: (u, { eq: userEq }) => userEq(u.authUserId, authUser.id),
  });

  if (!dbUser) return null;

  const [insightRow] = await db
    .select({
      id: insight.id,
      summary: insight.summary,
      status: insight.status,
      sourceAttribution: insight.sourceAttribution,
      createdAt: insight.createdAt,
    })
    .from(insight)
    .where(and(eq(insight.id, params.insightId), eq(insight.orgId, dbUser.orgId)))
    .limit(1);

  if (!insightRow) notFound();

  const [latestDraft] = await db
    .select({
      id: draft.id,
      content: draft.content,
      variation: draft.variation,
      createdAt: draft.createdAt,
    })
    .from(draft)
    .where(and(eq(draft.insightId, insightRow.id), eq(draft.orgId, dbUser.orgId)))
    .orderBy(desc(draft.createdAt))
    .limit(1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Draft Lab</h1>
          <p className="text-muted-foreground">Refine this idea in conversation, then publish.</p>
        </div>
        <Link href="/dashboard/insights" className="text-sm text-zinc-600 hover:text-zinc-900">
          Back to ideas
        </Link>
      </div>

      <DraftLabClient
        insight={{
          id: insightRow.id,
          summary: insightRow.summary,
          status: insightRow.status,
          sourceAttribution: insightRow.sourceAttribution,
          createdAt: insightRow.createdAt,
        }}
        user={{
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
          avatarUrl: dbUser.avatarUrl,
        }}
        initialDraft={latestDraft?.content ?? null}
      />
    </div>
  );
}
