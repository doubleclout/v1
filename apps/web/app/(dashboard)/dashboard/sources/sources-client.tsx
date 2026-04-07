"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const PRIMARY_SOURCES = [
  {
    id: "slack",
    name: "Slack",
    description: "Channels, threads, and messages. Pick which channels to ingest. We capture conversations and context, classify signals, and surface actionable insights from team discussions.",
    logo: "/logos/slack.svg",
  },
  {
    id: "zoom",
    name: "Zoom",
    description: "Meeting transcripts and recordings. AI processes every call, extracts takeaways and action items, and surfaces insights without manual note-taking.",
    logo: "/logos/zoom.svg",
  },
  {
    id: "gmail",
    name: "Gmail",
    description: "Your inbox, emails, threads, labels, and sender metadata. We surface insights from customer conversations, internal discussions, and important updates.",
    logo: "/logos/gmail.svg",
  },
  {
    id: "github",
    name: "GitHub",
    description: "Repos, pull requests, issues, and releases. We turn engineering activity into shareable insights and content.",
    logo: "https://cdn.simpleicons.org/github",
  },
];

const GOOGLE_WORKSPACE = {
  id: "google_workspace",
  name: "Google Workspace",
  description:
    "One-click connect for Drive plus Docs/Sheets signals, including Meet transcript docs saved in Drive.",
  logo: "/logos/icons8-google.svg",
  connectAs: "google",
};

const GOOGLE_WORKSPACE_APPS = [
  { id: "drive", name: "Drive", logo: "/logos/drive.svg" },
  { id: "meet", name: "Meet transcripts (via Drive)", logo: "/logos/google-meet.svg" },
  { id: "docs", name: "Docs", logo: "https://cdn.simpleicons.org/googledocs" },
  { id: "sheets", name: "Sheets", logo: "https://cdn.simpleicons.org/googlesheets" },
];

export function SourcesClient({
  orgId,
  plan,
  slackConnected,
  slackChannelIds,
  zoomConnected,
  zoomConfig,
  googleConnected,
  googleConfig,
  gmailConnected,
  gmailConfig,
  githubConnected,
  githubConfig,
}: {
  orgId: string;
  plan: "free" | "pro" | "team" | "enterprise";
  slackConnected: boolean;
  slackChannelIds: string[];
  zoomConnected: boolean;
  zoomConfig: { autoProcessTranscripts?: boolean; recordedOnly?: boolean };
  googleConnected: boolean;
  googleConfig: {
    folderIds?: string[];
    monitorDocs?: boolean;
    driveCursor?: string | null;
    syncEnabled?: boolean;
    lastSyncAt?: string | null;
  };
  gmailConnected: boolean;
  gmailConfig: {
    labelIds?: string[];
    senderWhitelist?: string[];
    gmailHistoryId?: string | null;
    syncEnabled?: boolean;
    lastSyncAt?: string | null;
  };
  githubConnected: boolean;
  githubConfig: { repos?: string[]; includePRs?: boolean; includeIssues?: boolean; includeReleases?: boolean };
}) {
  const [channels, setChannels] = useState<{ id: string; name: string }[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(new Set(slackChannelIds));
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [savingChannels, setSavingChannels] = useState(false);
  const [googleFolders, setGoogleFolders] = useState<{ id: string; name: string }[]>([]);
  const [selectedGoogleFolders, setSelectedGoogleFolders] = useState<Set<string>>(
    new Set(googleConfig.folderIds ?? [])
  );
  const [loadingGoogleFolders, setLoadingGoogleFolders] = useState(false);
  const [savingGoogleConfig, setSavingGoogleConfig] = useState(false);
  const [googleSyncEnabled, setGoogleSyncEnabled] = useState(googleConfig.syncEnabled !== false);
  const [googleSyncing, setGoogleSyncing] = useState(false);
  const [gmailSyncing, setGmailSyncing] = useState(false);
  const [googleLastSyncAt, setGoogleLastSyncAt] = useState<string | null>(googleConfig.lastSyncAt ?? null);
  const [gmailLastSyncAt, setGmailLastSyncAt] = useState<string | null>(gmailConfig.lastSyncAt ?? null);
  const [googleFoldersError, setGoogleFoldersError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const connectUrls: Record<string, string> = {
    slack: `/api/slack/oauth?org_id=${orgId}`,
    zoom: `/api/zoom/oauth?org_id=${orgId}`,
    google: `/api/google/oauth?org_id=${orgId}`,
    gmail: `/api/gmail/oauth?org_id=${orgId}`,
    github: `/api/github/oauth?org_id=${orgId}`,
  };

  const handleConnect = (url: string) => {
    window.location.href = url;
  };

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (slackConnected) {
      setLoadingChannels(true);
      fetch("/api/slack/channels")
        .then((r) => r.json())
        .then((data) => setChannels(data.channels ?? []))
        .finally(() => setLoadingChannels(false));
    }
  }, [slackConnected]);

  useEffect(() => {
    if (!googleConnected) return;
    setLoadingGoogleFolders(true);
    setGoogleFoldersError(null);
    Promise.all([
      fetch("/api/google/folders").then(async (r) => {
        if (r.ok) return r.json();
        const data = await r.json().catch(() => ({}));
        return {
          folders: [],
          error:
            [data.error, data.details].filter(Boolean).join(" - ") ||
            "Failed to fetch folders",
        };
      }),
      fetch("/api/google/config").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([foldersData, configData]) => {
        setGoogleFolders(foldersData.folders ?? []);
        if (foldersData.error) setGoogleFoldersError(foldersData.error);
        if (configData) {
          setSelectedGoogleFolders(new Set(configData.folderIds ?? []));
          setGoogleSyncEnabled(configData.syncEnabled !== false);
          setGoogleLastSyncAt(configData.lastSyncAt ?? null);
        }
      })
      .finally(() => setLoadingGoogleFolders(false));
  }, [googleConnected]);

  const toggleChannel = (id: string) => {
    setSelectedChannels((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const saveChannels = async () => {
    setSavingChannels(true);
    await fetch("/api/slack/channels/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channelIds: Array.from(selectedChannels) }),
    });
    setSavingChannels(false);
  };

  const toggleGoogleFolder = (id: string) => {
    setSelectedGoogleFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const saveGoogleSettings = async () => {
    setSavingGoogleConfig(true);
    await fetch("/api/google/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        folderIds: Array.from(selectedGoogleFolders),
        syncEnabled: googleSyncEnabled,
      }),
    });
    setSavingGoogleConfig(false);
  };

  const runGoogleSync = async (mode: "backfill" | "incremental") => {
    setGoogleSyncing(true);
    await fetch("/api/google/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode }),
    });
    setGoogleLastSyncAt(new Date().toISOString());
    setGoogleSyncing(false);
  };

  const runGmailSync = async (mode: "backfill" | "incremental") => {
    setGmailSyncing(true);
    await fetch("/api/gmail/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode }),
    });
    setGmailLastSyncAt(new Date().toISOString());
    setGmailSyncing(false);
  };

  const formatLastSync = (value: string | null) => {
    if (!value) return "Never";
    if (!hydrated) return "Syncing...";
    return new Date(value).toLocaleString();
  };

  const connected = (id: string) =>
    id === "slack" ? slackConnected : id === "zoom" ? zoomConnected : id === "gmail" ? gmailConnected : id === "github" ? githubConnected : googleConnected;

  const renderSourceCard = (
    source: { id: string; name: string; description: string; logo: string; connectAs?: string },
    isConnected: boolean
  ) => (
    <Card
      key={source.id}
      className="border-zinc-200/80 bg-white overflow-hidden transition-shadow hover:shadow-md"
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-50 overflow-hidden">
              <Image
                src={source.logo}
                alt={source.name}
                width={28}
                height={28}
                unoptimized
              />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-zinc-900">{source.name}</h3>
              <p className="mt-1.5 text-sm text-zinc-600 leading-relaxed">
                {source.description}
              </p>
            </div>
          </div>
          {isConnected ? (
            <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Connected
            </span>
          ) : (
            source.id === "google_workspace" ? (
              <Button
                size="sm"
                className="shrink-0 bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 transition-colors"
                onClick={() => handleConnect(connectUrls[source.connectAs ?? source.id])}
              >
                Connect
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                disabled
                className="shrink-0 cursor-not-allowed text-zinc-500"
              >
                Coming soon
              </Button>
            )
          )}
        </div>
      </CardHeader>
      {source.id === "slack" && slackConnected && (
        <CardContent className="pt-0 space-y-4">
          <div>
            <Label className="text-sm font-medium text-zinc-700">Select channels to ingest</Label>
            {loadingChannels ? (
              <p className="text-sm text-zinc-500 mt-2">Loading channels...</p>
            ) : (
              <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-zinc-200 p-3 space-y-2">
                {channels.map((ch) => (
                  <label
                    key={ch.id}
                    className="flex items-center gap-2 cursor-pointer hover:bg-zinc-50 rounded px-2 py-1.5 -mx-2"
                  >
                    <input
                      type="checkbox"
                      checked={selectedChannels.has(ch.id)}
                      onChange={() => toggleChannel(ch.id)}
                      className="rounded border-zinc-300 text-[var(--accent)] focus:ring-[var(--accent)]"
                    />
                    <span className="text-sm text-zinc-700">#{ch.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={saveChannels}
            disabled={savingChannels || loadingChannels}
          >
            {savingChannels ? "Saving..." : "Save channels"}
          </Button>
        </CardContent>
      )}
      {source.id === "zoom" && zoomConnected && (
        <CardContent className="pt-0 text-sm text-zinc-600">
          Transcripts: {zoomConfig.autoProcessTranscripts !== false ? "On" : "Off"}
        </CardContent>
      )}
      {source.id === "google_workspace" && (
        <CardContent className="pt-0 space-y-4">
          <div>
            <Label className="text-sm font-medium text-zinc-700">Included apps</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {GOOGLE_WORKSPACE_APPS.map((app) => (
                <span
                  key={app.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs text-zinc-700"
                >
                  <Image src={app.logo} alt={app.name} width={14} height={14} unoptimized />
                  {app.name}
                </span>
              ))}
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              Gmail is connected separately using the Gmail card below.
            </p>
          </div>
          {googleConnected && (
            <>
          <div className="text-sm text-zinc-600">
            {selectedGoogleFolders.size} folders selected · Docs: {googleConfig.monitorDocs ? "On" : "Off"}
          </div>
          <div>
            <Label className="text-sm font-medium text-zinc-700">Folders to monitor</Label>
            {loadingGoogleFolders ? (
              <p className="text-sm text-zinc-500 mt-2">Loading Google Drive folders...</p>
            ) : (
              <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-zinc-200 p-3 space-y-2">
                {googleFolders.map((folder) => (
                  <label
                    key={folder.id}
                    className="flex items-center gap-2 cursor-pointer hover:bg-zinc-50 rounded px-2 py-1.5 -mx-2"
                  >
                    <input
                      type="checkbox"
                      checked={selectedGoogleFolders.has(folder.id)}
                      onChange={() => toggleGoogleFolder(folder.id)}
                      className="rounded border-zinc-300 text-[var(--accent)] focus:ring-[var(--accent)]"
                    />
                    <span className="text-sm text-zinc-700">{folder.name}</span>
                  </label>
                ))}
                {googleFolders.length === 0 && (
                  <p className="text-sm text-zinc-500">No folders returned by Drive API.</p>
                )}
              </div>
            )}
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={googleSyncEnabled}
              onChange={(e) => setGoogleSyncEnabled(e.target.checked)}
              className="rounded border-zinc-300 text-[var(--accent)] focus:ring-[var(--accent)]"
            />
            <span className="text-sm text-zinc-700">Enable periodic sync</span>
          </label>
          <div className="text-xs text-zinc-500">
            Last sync: {formatLastSync(googleLastSyncAt)}
          </div>
          {googleFoldersError && (
            <div className="text-xs text-red-600">
              Google folder fetch error: {googleFoldersError}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={savingGoogleConfig}
              onClick={saveGoogleSettings}
            >
              {savingGoogleConfig ? "Saving..." : "Save folders"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={googleSyncing}
              onClick={() => runGoogleSync("incremental")}
            >
              {googleSyncing ? "Syncing..." : "Run sync now"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={googleSyncing}
              onClick={() => runGoogleSync("backfill")}
            >
              Full backfill
            </Button>
          </div>
            </>
          )}
        </CardContent>
      )}
      {source.id === "gmail" && gmailConnected && (
        <CardContent className="pt-0 text-sm text-zinc-600 space-y-3">
          <div>
            {gmailConfig.labelIds?.length ?? 0} labels · {gmailConfig.senderWhitelist?.length ?? 0} senders
          </div>
          <div className="text-xs text-zinc-500">
            Last sync: {formatLastSync(gmailLastSyncAt)}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={gmailSyncing}
              onClick={() => runGmailSync("incremental")}
            >
              {gmailSyncing ? "Syncing..." : "Run sync now"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={gmailSyncing}
              onClick={() => runGmailSync("backfill")}
            >
              Full backfill
            </Button>
          </div>
        </CardContent>
      )}
      {source.id === "github" && githubConnected && (
        <CardContent className="pt-0 text-sm text-zinc-600">
          PRs · Issues · Releases
        </CardContent>
      )}
    </Card>
  );

  return (
    <div className="space-y-10">
      <div className="grid gap-5">
        {renderSourceCard(GOOGLE_WORKSPACE, connected(GOOGLE_WORKSPACE.connectAs))}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {PRIMARY_SOURCES.map((source) =>
          renderSourceCard(source, connected(source.id))
        )}
      </div>
    </div>
  );
}
