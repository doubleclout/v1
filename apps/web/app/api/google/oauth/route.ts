import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { createOAuthState } from "@/lib/oauth-state";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("org_id");

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/google/oauth/callback`;

  if (!clientId) {
    return NextResponse.json({ error: "Google not configured" }, { status: 500 });
  }
  if (!orgId) {
    return NextResponse.json({ error: "Missing org_id" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await db.query.user.findFirst({
    where: (u, { eq }) => eq(u.authUserId, authUser.id),
  });
  if (!dbUser || dbUser.orgId !== orgId) {
    return NextResponse.json({ error: "Invalid org context" }, { status: 403 });
  }

  const scopes = [
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/documents.readonly",
    "https://www.googleapis.com/auth/spreadsheets.readonly",
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/tasks.readonly",
    "https://www.googleapis.com/auth/forms.readonly",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
  ].join(" ");

  const state = createOAuthState(orgId, "google");
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", scopes);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", state);

  return NextResponse.redirect(url.toString());
}
