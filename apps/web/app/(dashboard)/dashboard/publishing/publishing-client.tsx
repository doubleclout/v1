"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function PublishingClient({
  orgId,
  linkedInConnected,
  config,
}: {
  orgId: string;
  linkedInConnected: boolean;
  config: { defaultVisibility?: string; hashtagsEnabled?: boolean };
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>LinkedIn</CardTitle>
            <CardDescription>
              Publish drafts straight to your LinkedIn. One-click from Slack.
            </CardDescription>
          </div>
          {linkedInConnected ? (
            <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
              Connected
            </span>
          ) : (
            <Button size="sm" onClick={() => (window.location.href = `/api/linkedin/oauth?org_id=${orgId}`)}>
              Connect
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
          </CardContent>
        )}
      </Card>
    </div>
  );
}
