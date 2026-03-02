import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("org_id");

  const clientId = process.env.SLACK_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/slack/oauth/callback`;

  if (!clientId) {
    return NextResponse.json({ error: "Slack not configured" }, { status: 500 });
  }

  const scopes = [
    "channels:history",
    "channels:read",
    "chat:write",
    "commands",
    "groups:history",
    "groups:read",
    "im:history",
    "mpim:history",
    "users:read",
    "team:read",
  ].join(",");

  const state = orgId ? `org:${orgId}` : "";
  const url = new URL("https://slack.com/oauth/v2/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("scope", scopes);
  url.searchParams.set("redirect_uri", redirectUri);
  if (state) url.searchParams.set("state", state);

  return NextResponse.redirect(url.toString());
}
