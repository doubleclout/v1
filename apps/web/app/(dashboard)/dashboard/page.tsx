import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { insight, draft, publication } from "@doubleclout/db";
import { eq, and, sql, desc } from "@doubleclout/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

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

  const [insightsResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(insight)
    .where(eq(insight.orgId, orgId));

  const [draftsResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(draft)
    .where(eq(draft.orgId, orgId));

  const [publishedResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(publication)
    .where(and(eq(publication.orgId, orgId), eq(publication.status, "published")));

  const recentInsights = await db
    .select()
    .from(insight)
    .where(eq(insight.orgId, orgId))
    .orderBy(desc(insight.createdAt))
    .limit(5);

  const published = await db
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
    .limit(5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Overview</h1>
        <p className="mt-1 text-muted-foreground">
          High-level system health & recent activity
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium uppercase tracking-wider">Insights Generated</CardDescription>
            <CardTitle className="text-3xl font-semibold">{insightsResult?.count ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium uppercase tracking-wider">Drafts Pending</CardDescription>
            <CardTitle className="text-3xl font-semibold">{draftsResult?.count ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium uppercase tracking-wider">Published Posts</CardDescription>
            <CardTitle className="text-3xl font-semibold">{publishedResult?.count ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium uppercase tracking-wider">Sensitivity Flags</CardDescription>
            <CardTitle className="text-3xl font-semibold">0</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Recent Insights</CardTitle>
            <CardDescription>Surfaced from Slack, Zoom, Google, Gmail</CardDescription>
          </CardHeader>
          <CardContent>
            {recentInsights.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm font-medium text-foreground">No insights yet</p>
                <p className="mt-1 text-sm text-muted-foreground">Insights are generated automatically from connected sources.</p>
                <Link href="/dashboard/sources" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
                  Connect Source →
                </Link>
              </div>
            ) : (
              <ul className="space-y-4">
                {recentInsights.map((i) => (
                  <li key={i.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                    <Link href={`/dashboard/insights?selected=${i.id}`} className="block rounded-lg hover:bg-muted/50 -m-2 p-2 transition-colors">
                      <p className="text-sm font-medium text-foreground">{i.summary}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {i.sourceAttribution ?? "From your work"} · {i.confidence.toFixed(2)} confidence
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Published</CardTitle>
            <CardDescription>Track what went live. See what&apos;s resonating.</CardDescription>
          </CardHeader>
          <CardContent>
            {published.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No published posts yet.
              </p>
            ) : (
              <ul className="space-y-4">
                {published.map((p) => (
                  <li key={p.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                    <p className="text-sm line-clamp-2 text-foreground">{p.content?.slice(0, 120)}...</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {p.platform} · {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString() : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
