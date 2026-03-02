import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("org_id");

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/linkedin/oauth/callback`;

  if (!clientId) {
    return NextResponse.json({ error: "LinkedIn not configured" }, { status: 500 });
  }

  const scopes = ["openid", "profile", "w_member_social"].join(" ");
  const state = orgId ? `org:${orgId}` : "";

  const url = new URL("https://www.linkedin.com/oauth/v2/authorization");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", scopes);
  if (state) url.searchParams.set("state", state);

  return NextResponse.redirect(url.toString());
}
