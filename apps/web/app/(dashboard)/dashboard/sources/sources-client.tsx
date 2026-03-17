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

const GOOGLE_APPS = [
  {
    id: "drive",
    name: "Google Drive",
    description: "Files and folders. We monitor docs, sheets, and drive content for changes and surface insights from your team's work.",
    logo: "/logos/drive.svg",
    connectAs: "google",
  },
  {
    id: "meet",
    name: "Google Meet",
    description: "Meeting transcripts and recordings. AI extracts takeaways and action items from every call.",
    logo: "/logos/google-meet.svg",
    connectAs: "google",
  },
  {
    id: "chat",
    name: "Google Chat",
    description: "Chat spaces and direct messages. We capture conversations and context to surface insights from team discussions.",
    logo: "/logos/google-chat.svg",
    connectAs: "google",
  },
  {
    id: "calendar",
    name: "Google Calendar",
    description: "Your calendar. Events and scheduling context inform when and how we surface insights.",
    logo: "/logos/google-calendar.svg",
    connectAs: "google",
  },
  {
    id: "docs",
    name: "Google Docs",
    description: "Documents and collaborative editing. We track changes and surface insights from shared knowledge.",
    logo: "https://cdn.simpleicons.org/googledocs",
    connectAs: "google",
  },
  {
    id: "sheets",
    name: "Google Sheets",
    description: "Spreadsheets. Data, updates, and changes inform content and insights.",
    logo: "https://cdn.simpleicons.org/googlesheets",
    connectAs: "google",
  },
  {
    id: "forms",
    name: "Google Forms",
    description: "Form responses. Survey data and feedback surface insights from customer and team input.",
    logo: "https://cdn.simpleicons.org/googleforms",
    connectAs: "google",
  },
  {
    id: "tasks",
    name: "Google Tasks",
    description: "Task lists. Project context and progress inform insights and content.",
    logo: "https://cdn.simpleicons.org/googletasks",
    connectAs: "google",
  },
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
  googleConfig: { folderIds?: string[]; monitorDocs?: boolean };
  gmailConnected: boolean;
  gmailConfig: { labelIds?: string[]; senderWhitelist?: string[] };
  githubConnected: boolean;
  githubConfig: { repos?: string[]; includePRs?: boolean; includeIssues?: boolean; includeReleases?: boolean };
}) {
  const [channels, setChannels] = useState<{ id: string; name: string }[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(new Set(slackChannelIds));
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [savingChannels, setSavingChannels] = useState(false);

  const showGoogleWorkspace = plan === "team" || plan === "enterprise";

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
    if (slackConnected) {
      setLoadingChannels(true);
      fetch("/api/slack/channels")
        .then((r) => r.json())
        .then((data) => setChannels(data.channels ?? []))
        .finally(() => setLoadingChannels(false));
    }
  }, [slackConnected]);

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
            <Button
              size="sm"
              className="shrink-0 bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 transition-colors"
              onClick={() => handleConnect(connectUrls[source.connectAs ?? source.id])}
            >
              Connect
            </Button>
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
      {source.id === "gmail" && gmailConnected && (
        <CardContent className="pt-0 text-sm text-zinc-600">
          {gmailConfig.labelIds?.length ?? 0} labels · {gmailConfig.senderWhitelist?.length ?? 0} senders
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
      {/* Primary: Slack, Zoom, Gmail, GitHub */}
      <div className="grid gap-5 sm:grid-cols-2">
        {PRIMARY_SOURCES.map((source) =>
          renderSourceCard(source, connected(source.id))
        )}
      </div>

      {/* Google apps: Drive, Meet, Chat, Calendar, Docs, Sheets, Forms, Tasks */}
      <div className="grid gap-5 sm:grid-cols-2">
        {GOOGLE_APPS.map((source) =>
          renderSourceCard(source, connected(source.connectAs ?? source.id))
        )}
      </div>

      {/* Google Workspace one-click - only for team/enterprise */}
      {showGoogleWorkspace && (
        <div className="pt-4 border-t border-zinc-200">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-zinc-900">Google Workspace</h2>
            <p className="mt-1 text-sm text-zinc-600">
              One-click connect for your organization. Access all apps above in a single sign-on.
            </p>
          </div>
          <Card className="border-zinc-200/80 bg-white overflow-hidden transition-shadow hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-50 overflow-hidden">
                    <Image
                      src="https://cdn.simpleicons.org/google"
                      alt="Google Workspace"
                      width={28}
                      height={28}
                      unoptimized
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900">Connect entire workspace</h3>
                    <p className="mt-1.5 text-sm text-zinc-600">
                      Single sign-on for your organization. Gmail, Drive, Meet, Chat, Calendar, Tasks, Docs, Sheets, Forms, all connected at once.
                    </p>
                  </div>
                </div>
                {googleConnected ? (
                  <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Connected
                  </span>
                ) : (
                  <Button
                    size="sm"
                    className="shrink-0 bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 transition-colors"
                    onClick={() => handleConnect(connectUrls.google)}
                  >
                    Connect
                  </Button>
                )}
              </div>
            </CardHeader>
            {googleConnected && (
              <CardContent className="pt-0 text-sm text-zinc-600">
                {googleConfig.folderIds?.length ?? 0} folders · Docs: {googleConfig.monitorDocs ? "On" : "Off"}
              </CardContent>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
