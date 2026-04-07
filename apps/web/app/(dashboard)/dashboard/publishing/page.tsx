import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { integration, insight, publication, draft } from "@doubleclout/db";
import { eq, and, desc } from "@doubleclout/db";
import { PublishingClient } from "./publishing-client";

export default async function PublishingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return null;

  const dbUser = await db.query.user.findFirst({
    where: (u, { eq }) => eq(u.authUserId, authUser.id),
  });
  if (!dbUser) return null;

  const [linkedInInt] = await db.select().from(integration).where(and(eq(integration.orgId, dbUser.orgId), eq(integration.source, "linkedin"))).limit(1);
  const linkedInConfigured = Boolean(
    process.env.LINKEDIN_CLIENT_ID &&
    process.env.LINKEDIN_CLIENT_SECRET &&
    process.env.NEXT_PUBLIC_APP_URL
  );

  const queuedIdeas = await db
    .select({
      id: insight.id,
      summary: insight.summary,
      sourceAttribution: insight.sourceAttribution,
      createdAt: insight.createdAt,
      status: insight.status,
    })
    .from(insight)
    .where(and(eq(insight.orgId, dbUser.orgId), eq(insight.status, "draft_generated")))
    .orderBy(desc(insight.createdAt))
    .limit(20);

  const publishedRows = await db
    .select({
      id: publication.id,
      platform: publication.platform,
      status: publication.status,
      publishedAt: publication.publishedAt,
      metrics: publication.metrics,
      content: draft.content,
    })
    .from(publication)
    .innerJoin(draft, eq(publication.draftId, draft.id))
    .where(and(eq(publication.orgId, dbUser.orgId), eq(publication.status, "published")))
    .orderBy(desc(publication.publishedAt))
    .limit(50);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Publishing</h1>
        <p className="text-muted-foreground">
          Publish refined ideas from your Google Workspace pipeline to LinkedIn.
        </p>
      </div>

      <PublishingClient
        orgId={dbUser.orgId}
        linkedInConnected={!!linkedInInt}
        linkedInConfigured={linkedInConfigured}
        oauthSuccess={params?.success ?? null}
        oauthError={params?.error ?? null}
        config={(linkedInInt?.config as { defaultVisibility?: string; hashtagsEnabled?: boolean }) ?? {}}
        queuedIdeas={queuedIdeas}
        publishedRows={publishedRows}
      />
    </div>
  );
}
