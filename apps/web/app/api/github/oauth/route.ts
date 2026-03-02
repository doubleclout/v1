import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("org_id");

  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/github/oauth/callback`;

  if (!clientId) {
    return NextResponse.json({ error: "GitHub not configured" }, { status: 500 });
  }

  const scopes = ["repo", "read:org", "read:user"].join(" ");
  const state = orgId ? `org:${orgId}` : "";

  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", scopes);
  url.searchParams.set("state", state);

  return NextResponse.redirect(url.toString());
}
