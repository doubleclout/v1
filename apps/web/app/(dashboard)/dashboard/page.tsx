import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { insight, publication, draft, integration, executionEvent, toneConfig, sensitivityConfig } from "@doubleclout/db";
import { eq, and, sql, desc } from "@doubleclout/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

function cleanSummary(text: string) {
  return text
    .replace(/\s+/g, " ")
    .replace(/\s+([.,!?;:])/g, "$1")
    .trim();
}

function getInsightTitle(text: string) {
  const cleaned = cleanSummary(text);
  const lower = cleaned.toLowerCase();
  const markers = [" date:", " reporting lead:", " today focused:"];
  let end = cleaned.length;
  for (const marker of markers) {
    const idx = lower.indexOf(marker);
    if (idx > 0) end = Math.min(end, idx);
  }
  return cleaned.slice(0, end).trim() || "Insight";
}

function getSourceLabel(sourceAttribution?: string | null) {
  const text = (sourceAttribution ?? "").toLowerCase();
  if (text.includes("google drive") || text.includes("google doc")) return "Google Workspace";
  if (text.includes("gmail")) return "Gmail";
  if (text.includes("slack")) return "Slack";
  if (text.includes("zoom")) return "Zoom";
  if (text.includes("github")) return "GitHub";
  return "Connected source";
}

function getStatusLabel(status: string) {
  if (status === "internal") return "Selected";
  if (status === "draft_generated") return "Drafted";
  if (status === "published") return "Published";
  if (status === "ignored") return "Archived";
  return "Idea";
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) redirect("/login");

  const dbUser = await db.query.user.findFirst({
    where: (u, { eq }) => eq(u.authUserId, authUser.id),
    with: { org: true },
  });

  if (!dbUser) redirect("/login");

  const orgId = dbUser.orgId;

  const [
    insightsResult,
    draftsResult,
    publishedResult,
    recentInsights,
    connectedSourcesResult,
    eventsResult,
    ideaQueueResult,
    recentEvents,
    tone,
    sensitivity,
    published,
  ] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(insight)
      .where(eq(insight.orgId, orgId))
      .then((rows) => rows[0]),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(insight)
      .where(and(eq(insight.orgId, orgId), eq(insight.status, "draft_generated")))
      .then((rows) => rows[0]),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(publication)
      .where(and(eq(publication.orgId, orgId), eq(publication.status, "published")))
      .then((rows) => rows[0]),
    db
      .select()
      .from(insight)
      .where(eq(insight.orgId, orgId))
      .orderBy(desc(insight.createdAt))
      .limit(5),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(integration)
      .where(
        and(
          eq(integration.orgId, orgId),
          eq(integration.status, "active"),
          sql`${integration.source} != 'linkedin'`
        )
      )
      .then((rows) => rows[0]),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(executionEvent)
      .where(eq(executionEvent.orgId, orgId))
      .then((rows) => rows[0]),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(insight)
      .where(and(eq(insight.orgId, orgId), sql`${insight.status} in ('pending', 'internal', 'draft_generated')`))
      .then((rows) => rows[0]),
    db
      .select({
        id: executionEvent.id,
        source: executionEvent.source,
        type: executionEvent.type,
        createdAt: executionEvent.createdAt,
      })
      .from(executionEvent)
      .where(eq(executionEvent.orgId, orgId))
      .orderBy(desc(executionEvent.createdAt))
      .limit(5),
    db.select().from(toneConfig).where(eq(toneConfig.orgId, orgId)).limit(1).then((rows) => rows[0]),
    db.select().from(sensitivityConfig).where(eq(sensitivityConfig.orgId, orgId)).limit(1).then((rows) => rows[0]),
    db
      .select({
        id: publication.id,
        platform: publication.platform,
        publishedAt: publication.publishedAt,
        content: draft.content,
      })
      .from(publication)
      .innerJoin(draft, eq(publication.draftId, draft.id))
      .where(and(eq(publication.orgId, orgId), eq(publication.status, "published")))
      .orderBy(desc(publication.publishedAt))
      .limit(5),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-semibold tracking-tight text-zinc-900">Overview</h1>
        <p className="mt-1 text-zinc-600">
          Command center for source health, insight quality, and publishing momentum.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/dashboard/sources">
          <Card className="border-zinc-200/80 bg-white transition-all hover:border-zinc-300 hover:shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-medium uppercase tracking-wider text-zinc-600">Connected Sources</CardDescription>
              <CardTitle className="text-3xl font-semibold">{connectedSourcesResult?.count ?? 0}</CardTitle>
              <p className="text-xs text-zinc-500">Open Sources</p>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/dashboard/sources">
          <Card className="border-zinc-200/80 bg-white transition-all hover:border-zinc-300 hover:shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-medium uppercase tracking-wider text-zinc-600">Events Ingested</CardDescription>
              <CardTitle className="text-3xl font-semibold">{eventsResult?.count ?? 0}</CardTitle>
              <p className="text-xs text-zinc-500">View sync controls</p>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/dashboard/insights">
          <Card className="border-zinc-200/80 bg-white transition-all hover:border-zinc-300 hover:shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-medium uppercase tracking-wider text-zinc-600">Idea Queue</CardDescription>
              <CardTitle className="text-3xl font-semibold">{ideaQueueResult?.count ?? 0}</CardTitle>
              <p className="text-xs text-zinc-500">Open Insights inbox</p>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/dashboard/publishing">
          <Card className="border-zinc-200/80 bg-white transition-all hover:border-zinc-300 hover:shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-medium uppercase tracking-wider text-zinc-600">Published Posts</CardDescription>
              <CardTitle className="text-3xl font-semibold">{publishedResult?.count ?? 0}</CardTitle>
              <p className="text-xs text-zinc-500">Open Publishing</p>
            </CardHeader>
          </Card>
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Link href="/dashboard/insights?stage=draft_generated">
          <Card className="border-zinc-200/80 bg-white transition-all hover:border-zinc-300 hover:shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-medium uppercase tracking-wider text-zinc-600">Drafts Pending</CardDescription>
              <CardTitle className="text-2xl font-semibold">{draftsResult?.count ?? 0}</CardTitle>
              <p className="text-xs text-zinc-500">Insights currently in drafted stage</p>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/dashboard/tone">
          <Card className="border-zinc-200/80 bg-white transition-all hover:border-zinc-300 hover:shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-medium uppercase tracking-wider text-zinc-600">Tone Profile</CardDescription>
              <CardTitle className="text-2xl font-semibold capitalize">{tone?.defaultTone ?? "educational"}</CardTitle>
              <p className="text-xs text-zinc-500">Tune your writing voice</p>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/dashboard/sensitivity">
          <Card className="border-zinc-200/80 bg-white transition-all hover:border-zinc-300 hover:shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-medium uppercase tracking-wider text-zinc-600">Redaction Strictness</CardDescription>
              <CardTitle className="text-2xl font-semibold capitalize">{sensitivity?.redactionStrictness ?? "moderate"}</CardTitle>
              <p className="text-xs text-zinc-500">Controls how aggressively sensitive details are masked before publish</p>
            </CardHeader>
          </Card>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-zinc-200/80 bg-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-display font-semibold text-zinc-900">Recent Insights</CardTitle>
                <CardDescription className="text-zinc-600">Clean, ranked ideas ready to act on.</CardDescription>
              </div>
              <Link href="/dashboard/insights" className="text-xs font-medium text-[var(--accent)] hover:underline">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentInsights.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm font-medium text-zinc-900">No insights yet</p>
                <p className="mt-1 text-sm text-zinc-600">Insights are generated automatically from connected sources.</p>
                <Link href="/dashboard/sources" className="mt-4 inline-block text-sm font-medium text-[var(--accent)] hover:underline">
                  Connect Source →
                </Link>
              </div>
            ) : (
              <ul className="space-y-3">
                {recentInsights.map((i) => (
                  <li key={i.id}>
                    <Link
                      href={`/dashboard/insights/${i.id}`}
                      className="block rounded-lg border border-zinc-200 p-3 transition-all hover:border-zinc-300 hover:bg-zinc-50"
                    >
                      <p className="text-sm font-medium text-zinc-900 line-clamp-2">{getInsightTitle(i.summary)}</p>
                      <p className="mt-1 text-xs text-zinc-600">
                        {getSourceLabel(i.sourceAttribution)} · {new Date(i.createdAt).toLocaleDateString()}
                      </p>
                      <p className="mt-2">
                        <span className="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600">
                          {getStatusLabel(i.status)}
                        </span>
                        <span className="ml-2 inline-flex rounded-full bg-violet-50 px-2 py-0.5 text-[11px] text-violet-700">
                          {Math.round((i.confidence ?? 0) * 100)}% confidence
                        </span>
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-zinc-200/80 bg-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-display font-semibold text-zinc-900">Published</CardTitle>
                <CardDescription className="text-zinc-600">Track what went live and how it performed.</CardDescription>
              </div>
              <Link href="/dashboard/publishing" className="text-xs font-medium text-[var(--accent)] hover:underline">
                Open queue
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {published.length === 0 ? (
              <p className="py-12 text-center text-sm text-zinc-600">
                No published posts yet.
              </p>
            ) : (
              <ul className="space-y-3">
                {published.map((p) => (
                  <li key={p.id}>
                    <div className="rounded-lg border border-zinc-200 p-3">
                      <p className="text-sm line-clamp-2 text-zinc-900">{p.content?.slice(0, 140)}...</p>
                      <p className="mt-1 text-xs text-zinc-600">
                        {p.platform} · {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString() : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-zinc-200/80 bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-display font-semibold text-zinc-900">Pipeline Activity</CardTitle>
              <CardDescription className="text-zinc-600">Latest events arriving from your connected sources.</CardDescription>
            </div>
            <Link href="/dashboard/sources" className="text-xs font-medium text-[var(--accent)] hover:underline">
              Manage sources
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentEvents.length === 0 ? (
            <p className="text-sm text-zinc-600">No source events yet. Run sync in Sources to populate activity.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {recentEvents.map((event) => (
                <div key={event.id} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                  <p className="text-sm font-medium capitalize text-zinc-900">{event.source}</p>
                  <p className="text-xs text-zinc-600 capitalize">{event.type}</p>
                  <p className="mt-1 text-xs text-zinc-500">{new Date(event.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
