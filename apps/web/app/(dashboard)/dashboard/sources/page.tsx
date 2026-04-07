import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { integration } from "@doubleclout/db";
import { eq } from "@doubleclout/db";
import { SourcesClient } from "./sources-client";

export default async function SourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ onboarding?: string; success?: string; error?: string }>;
}) {
  const params = await searchParams;
  const isOnboarding = params?.onboarding === "1";
  const oauthSuccess = params?.success;
  const oauthError = params?.error;
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) return null;

  const dbUser = await db.query.user.findFirst({
    where: (u, { eq }) => eq(u.authUserId, authUser.id),
    with: { org: true },
  });

  if (!dbUser || !dbUser.org) return null;

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
    <div className="space-y-10">
      {isOnboarding && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-medium text-blue-900">
            Welcome to Doubleclout! Connect your first source to start turning work into insights.
          </p>
        </div>
      )}
      {oauthSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-medium text-emerald-800">
            {oauthSuccess === "slack" && "Slack connected successfully."}
            {oauthSuccess === "zoom" && "Zoom connected successfully."}
            {oauthSuccess === "google" && "Google Workspace connected successfully."}
            {oauthSuccess === "gmail" && "Gmail connected successfully."}
            {oauthSuccess === "github" && "GitHub connected successfully."}
          </p>
        </div>
      )}
      {oauthError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">
            {oauthError.includes("denied") && "Connection was cancelled."}
            {oauthError.includes("token_failed") && "Connection failed. Please try again."}
            {!oauthError.includes("denied") && !oauthError.includes("token_failed") && "Something went wrong. Please try again."}
          </p>
        </div>
      )}
      <div>
        <h1 className="text-2xl font-display font-semibold tracking-tight text-zinc-900">Sources</h1>
        <p className="mt-1 text-zinc-600">
          Connect Google Workspace first, then add other sources as they become available.
        </p>
      </div>

      <SourcesClient
        orgId={dbUser.orgId}
        plan={dbUser.org.plan}
        slackConnected={!!slackInt}
        slackChannelIds={(slackInt?.config as { channelIds?: string[] })?.channelIds ?? []}
        zoomConnected={!!zoomInt}
        zoomConfig={(zoomInt?.config as { autoProcessTranscripts?: boolean; recordedOnly?: boolean }) ?? {}}
        googleConnected={!!googleInt}
        googleConfig={
          (googleInt?.config as {
            folderIds?: string[];
            monitorDocs?: boolean;
            driveCursor?: string | null;
            syncEnabled?: boolean;
            lastSyncAt?: string | null;
          }) ?? {}
        }
        gmailConnected={!!gmailInt}
        gmailConfig={
          (gmailInt?.config as {
            labelIds?: string[];
            senderWhitelist?: string[];
            gmailHistoryId?: string | null;
            syncEnabled?: boolean;
            lastSyncAt?: string | null;
          }) ?? {}
        }
        githubConnected={!!githubInt}
        githubConfig={(githubInt?.config as { repos?: string[]; includePRs?: boolean; includeIssues?: boolean; includeReleases?: boolean }) ?? {}}
      />
    </div>
  );
}
