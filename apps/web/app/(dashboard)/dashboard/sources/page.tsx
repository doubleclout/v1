import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { integration } from "@doubleclout/db";
import { eq } from "drizzle-orm";
import { SourcesClient } from "./sources-client";

export default async function SourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ onboarding?: string }>;
}) {
  const params = await searchParams;
  const isOnboarding = params?.onboarding === "1";
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) return null;

  const dbUser = await db.query.user.findFirst({
    where: (u, { eq }) => eq(u.authUserId, authUser.id),
  });

  if (!dbUser) return null;

  const integrations = await db
    .select()
    .from(integration)
    .where(eq(integration.orgId, dbUser.orgId));

  const slackInt = integrations.find((i) => i.source === "slack");
  const zoomInt = integrations.find((i) => i.source === "zoom");
  const googleInt = integrations.find((i) => i.source === "google");
  const gmailInt = integrations.find((i) => i.source === "gmail");
  const githubInt = integrations.find((i) => i.source === "github");

  return (
    <div className="space-y-8">
      {isOnboarding && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/50 p-4">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Welcome to Doubleclout! Connect your first source to start turning work into insights.
          </p>
        </div>
      )}
      <div>
        <h1 className="text-2xl font-semibold">Sources</h1>
        <p className="text-muted-foreground">
          Connect Slack, Zoom, Google Workspace, Gmail, and GitHub. Ideas surface from your actual work.
        </p>
      </div>

      <SourcesClient
        orgId={dbUser.orgId}
        slackConnected={!!slackInt}
        slackChannelIds={(slackInt?.config as { channelIds?: string[] })?.channelIds ?? []}
        zoomConnected={!!zoomInt}
        zoomConfig={(zoomInt?.config as { autoProcessTranscripts?: boolean; recordedOnly?: boolean }) ?? {}}
        googleConnected={!!googleInt}
        googleConfig={(googleInt?.config as { folderIds?: string[]; monitorDocs?: boolean }) ?? {}}
        gmailConnected={!!gmailInt}
        gmailConfig={(gmailInt?.config as { labelIds?: string[]; senderWhitelist?: string[] }) ?? {}}
        githubConnected={!!githubInt}
        githubConfig={(githubInt?.config as { repos?: string[]; includePRs?: boolean; includeIssues?: boolean; includeReleases?: boolean }) ?? {}}
      />
    </div>
  );
}
