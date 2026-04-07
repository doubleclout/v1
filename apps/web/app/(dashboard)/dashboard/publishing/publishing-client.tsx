"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function PublishingClient({
  orgId,
  linkedInConnected,
  linkedInConfigured,
  oauthSuccess,
  oauthError,
  config,
  queuedIdeas,
  publishedRows,
}: {
  orgId: string;
  linkedInConnected: boolean;
  linkedInConfigured: boolean;
  oauthSuccess: string | null;
  oauthError: string | null;
  config: { defaultVisibility?: string; hashtagsEnabled?: boolean };
  queuedIdeas: Array<{
    id: string;
    summary: string;
    sourceAttribution: string | null;
    createdAt: Date;
    status: string;
  }>;
  publishedRows: Array<{
    id: string;
    platform: string;
    status: string;
    publishedAt: Date | null;
    metrics: { impressions?: number; likes?: number; comments?: number } | null;
    content: string;
  }>;
}) {
  return (
    <div className="space-y-6">
      {oauthSuccess === "linkedin" ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          LinkedIn connected successfully.
        </div>
      ) : null}
      {oauthError ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {oauthError === "linkedin_not_configured"
            ? "LinkedIn OAuth is not configured in this environment yet. Add LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, and NEXT_PUBLIC_APP_URL to enable connect."
            : oauthError.startsWith("token_failed")
            ? "LinkedIn token exchange failed. Check LinkedIn app scopes/products and callback URL configuration."
            : oauthError === "linkedin_db_write_failed"
            ? "LinkedIn auth succeeded, but saving the connection failed in database."
            : "LinkedIn connection failed. Please try again."}
        </div>
      ) : null}

      <Card className="border-zinc-200/80 bg-white transition-all hover:border-zinc-300 hover:shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0A66C2]/10">
              <Image src="/logos/LinkedIn_icon.svg" alt="LinkedIn" width={20} height={20} unoptimized />
            </div>
            <div>
            <CardTitle>LinkedIn</CardTitle>
            <CardDescription>
              Publish polished ideas from your workspace directly to LinkedIn.
            </CardDescription>
            </div>
          </div>
          {linkedInConnected ? (
            <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
              Connected
            </span>
          ) : (
            <Button
              size="sm"
              disabled={!linkedInConfigured}
              onClick={() => (window.location.href = `/api/linkedin/oauth?org_id=${orgId}`)}
              title={!linkedInConfigured ? "LinkedIn OAuth is not configured yet" : "Connect LinkedIn"}
            >
              {linkedInConfigured ? "Connect" : "Config needed"}
            </Button>
          )}
        </CardHeader>
        {linkedInConnected && (
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Default visibility: {config.defaultVisibility ?? "PUBLIC"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Hashtags: {config.hashtagsEnabled ? "On" : "Off"}
            </p>
            <p className="text-xs text-zinc-500 mt-2">
              Tip: Generate and refine drafts in Insights Draft Lab, then publish here.
            </p>
          </CardContent>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-zinc-200/80 bg-white transition-all hover:border-zinc-300 hover:shadow-sm">
          <CardHeader>
            <CardTitle>Publish Queue</CardTitle>
            <CardDescription>Ideas that are drafted and ready to publish.</CardDescription>
          </CardHeader>
          <CardContent>
            {queuedIdeas.length === 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">No queued ideas right now.</p>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/dashboard/insights">Open Ideas Inbox</Link>
                </Button>
              </div>
            ) : (
              <ul className="space-y-3">
                {queuedIdeas.map((idea) => (
                  <li key={idea.id} className="rounded-lg border border-zinc-200 p-3 transition-colors hover:bg-zinc-50">
                    <p className="text-sm font-medium text-zinc-900 line-clamp-2">{idea.summary}</p>
                    <p className="mt-1 text-xs text-zinc-600">{idea.sourceAttribution ?? "From your work"}</p>
                    <div className="mt-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/dashboard/insights/${idea.id}`}>Open Draft Lab</Link>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-zinc-200/80 bg-white transition-all hover:border-zinc-300 hover:shadow-sm">
          <CardHeader>
            <CardTitle>Published Performance</CardTitle>
            <CardDescription>Recent published posts and outcome metrics.</CardDescription>
          </CardHeader>
          <CardContent>
            {publishedRows.length === 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">No published posts yet.</p>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/dashboard/insights">Generate your first draft</Link>
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200">
                      <th className="py-2 text-left font-medium text-zinc-600">Post</th>
                      <th className="py-2 text-left font-medium text-zinc-600">Date</th>
                      <th className="py-2 text-left font-medium text-zinc-600">Impr.</th>
                      <th className="py-2 text-left font-medium text-zinc-600">Likes</th>
                      <th className="py-2 text-left font-medium text-zinc-600">Comments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {publishedRows.map((row) => (
                      <tr key={row.id} className="border-b border-zinc-100 transition-colors hover:bg-zinc-50 last:border-0">
                        <td className="py-2 pr-2 text-zinc-800 max-w-[320px]">
                          <span className="line-clamp-2">{row.content}</span>
                        </td>
                        <td className="py-2 text-zinc-600 whitespace-nowrap">
                          {row.publishedAt ? new Date(row.publishedAt).toLocaleDateString() : "—"}
                        </td>
                        <td className="py-2 text-zinc-700">{row.metrics?.impressions ?? "—"}</td>
                        <td className="py-2 text-zinc-700">{row.metrics?.likes ?? "—"}</td>
                        <td className="py-2 text-zinc-700">{row.metrics?.comments ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
