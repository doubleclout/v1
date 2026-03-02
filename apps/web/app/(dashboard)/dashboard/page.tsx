import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { insight, draft, publication } from "@doubleclout/db";
import { eq, and, sql, desc } from "drizzle-orm";
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
        <h1 className="text-2xl font-semibold">Your Pipeline</h1>
        <p className="text-muted-foreground">
          From idea to published. All in one place.
        </p>
      </div>

      <div className="flex gap-2 border-b pb-4">
        <Link href="/dashboard" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
          Overview
        </Link>
        <Link href="/dashboard/insights" className="px-4 py-2 rounded-lg text-sm hover:bg-muted">
          Ideas
        </Link>
        <Link href="/dashboard/insights" className="px-4 py-2 rounded-lg text-sm hover:bg-muted">
          Drafts
        </Link>
        <Link href="/dashboard/insights" className="px-4 py-2 rounded-lg text-sm hover:bg-muted">
          Published
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ideas</CardDescription>
            <CardTitle className="text-3xl">{insightsResult?.count ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Drafts</CardDescription>
            <CardTitle className="text-3xl">{draftsResult?.count ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Published</CardDescription>
            <CardTitle className="text-3xl">{publishedResult?.count ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sensitivity Flags</CardDescription>
            <CardTitle className="text-3xl">0</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ideas from your work</CardTitle>
            <CardDescription>Surfaced from Slack, Zoom, Google, Gmail</CardDescription>
          </CardHeader>
          <CardContent>
            {recentInsights.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No insights yet. Connect a source to get started.
              </p>
            ) : (
              <ul className="space-y-4">
                {recentInsights.map((i) => (
                  <li key={i.id} className="border-b border-border pb-4 last:border-0">
                    <Link href={`/dashboard/insights?selected=${i.id}`} className="block">
                      <p className="text-sm font-medium">{i.summary}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {i.sourceAttribution ?? "From your work"} · {i.confidence.toFixed(2)} confidence
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Published</CardTitle>
            <CardDescription>Track what went live. See what&apos;s resonating.</CardDescription>
          </CardHeader>
          <CardContent>
            {published.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No published posts yet.
              </p>
            ) : (
              <ul className="space-y-4">
                {published.map((p) => (
                  <li key={p.id} className="border-b border-border pb-4 last:border-0">
                    <p className="text-sm line-clamp-2">{p.content?.slice(0, 120)}...</p>
                    <p className="text-xs text-muted-foreground mt-1">
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
