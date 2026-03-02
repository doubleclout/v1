import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("org_id");

  const clientId = process.env.ZOOM_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/zoom/oauth/callback`;

  if (!clientId) {
    return NextResponse.json({ error: "Zoom not configured" }, { status: 500 });
  }

  const state = orgId ? `org:${orgId}` : "";
  const url = new URL("https://zoom.us/oauth/authorize");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "recording:read meeting:read user:read");
  if (state) url.searchParams.set("state", state);

  return NextResponse.redirect(url.toString());
}
