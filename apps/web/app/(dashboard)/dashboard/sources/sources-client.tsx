"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const SOURCES = [
  {
    id: "slack",
    name: "Slack",
    description: "Selected channels only. Thread capture and message classification.",
  },
  {
    id: "zoom",
    name: "Zoom",
    description: "Transcript ingestion. Post-call processing and auto insight detection.",
  },
  {
    id: "google",
    name: "Google Workspace",
    description: "Docs, Sheets, Slides, Drive folder monitoring.",
  },
  {
    id: "gmail",
    name: "Gmail",
    description: "Labels, senders, and thread types.",
  },
  {
    id: "github",
    name: "GitHub",
    description: "PRs, issues, and releases. Turn engineering activity into insights.",
  },
] as const;

type SourceId = (typeof SOURCES)[number]["id"];

export function SourcesClient({
  orgId,
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

  const connected: Record<SourceId, boolean> = {
    slack: slackConnected,
    zoom: zoomConnected,
    google: googleConnected,
    gmail: gmailConnected,
    github: githubConnected,
  };

  const connectUrls: Record<SourceId, string> = {
    slack: `/api/slack/oauth?org_id=${orgId}`,
    zoom: `/api/zoom/oauth?org_id=${orgId}`,
    google: `/api/google/oauth?org_id=${orgId}`,
    gmail: `/api/gmail/oauth?org_id=${orgId}`,
    github: `/api/github/oauth?org_id=${orgId}`,
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

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {SOURCES.map((source) => (
        <Card key={source.id}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{source.name}</CardTitle>
              <CardDescription>{source.description}</CardDescription>
            </div>
            {connected[source.id] ? (
              <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                Connected
              </span>
            ) : (
              <Button size="sm" onClick={() => (window.location.href = connectUrls[source.id])}>
                Connect
              </Button>
            )}
          </CardHeader>
          {source.id === "slack" && slackConnected && (
            <CardContent className="space-y-4">
              <div>
                <Label>Select channels to ingest</Label>
                {loadingChannels ? (
                  <p className="text-sm text-muted-foreground mt-2">Loading channels...</p>
                ) : (
                  <div className="mt-2 max-h-48 overflow-y-auto border rounded-lg p-2 space-y-2">
                    {channels.map((ch) => (
                      <label key={ch.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedChannels.has(ch.id)}
                          onChange={() => toggleChannel(ch.id)}
                          className="rounded"
                        />
                        <span className="text-sm">#{ch.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <Button size="sm" onClick={saveChannels} disabled={savingChannels || loadingChannels}>
                {savingChannels ? "Saving..." : "Save channels"}
              </Button>
            </CardContent>
          )}
          {source.id === "zoom" && zoomConnected && (
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Auto transcript processing: {zoomConfig.autoProcessTranscripts !== false ? "On" : "Off"}
              </p>
            </CardContent>
          )}
          {source.id === "google" && googleConnected && (
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {googleConfig.folderIds?.length ?? 0} folders monitored. Docs: {googleConfig.monitorDocs ? "On" : "Off"}
              </p>
            </CardContent>
          )}
          {source.id === "gmail" && gmailConnected && (
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {gmailConfig.labelIds?.length ?? 0} labels. Senders: {gmailConfig.senderWhitelist?.length ?? 0}
              </p>
            </CardContent>
          )}
          {source.id === "github" && githubConnected && (
            <CardContent>
              <p className="text-sm text-muted-foreground">
                PRs: {githubConfig.includePRs !== false ? "On" : "Off"} · Issues: {githubConfig.includeIssues !== false ? "On" : "Off"} · Releases: {githubConfig.includeReleases !== false ? "On" : "Off"}
              </p>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
