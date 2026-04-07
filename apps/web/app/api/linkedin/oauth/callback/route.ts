import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { integration } from "@doubleclout/db";
import { eq, and } from "@doubleclout/db";

export async function GET(request: Request) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  const redirectWithError = (err: string) =>
    NextResponse.redirect(`${appUrl}/dashboard/publishing?error=${encodeURIComponent(err)}`);

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      return redirectWithError("linkedin_denied");
    }

    if (!code) {
      return redirectWithError("no_code");
    }

    const orgId = state?.startsWith("org:") ? state.slice(4) : null;
    if (!orgId) {
      return redirectWithError("no_org");
    }

    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    if (!clientId || !clientSecret || !process.env.NEXT_PUBLIC_APP_URL) {
      return redirectWithError("linkedin_not_configured");
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/linkedin/oauth/callback`;
    const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = (await tokenRes.json().catch(() => null)) as {
      access_token?: string;
      expires_in?: number;
      error?: string;
    } | null;

    if (!tokenRes.ok || tokenData?.error || !tokenData?.access_token) {
      return redirectWithError("token_failed");
    }

    const existingIntegration = await db.query.integration.findFirst({
      where: (i, { and: dbAnd, eq: dbEq }) => dbAnd(dbEq(i.orgId, orgId), dbEq(i.source, "linkedin")),
    });

    const tokens = {
      access: tokenData.access_token,
      ...(tokenData.expires_in ? { expiry: String(Date.now() + tokenData.expires_in * 1000) } : {}),
    };

    if (existingIntegration) {
      await db
        .update(integration)
        .set({
          tokens,
          status: "active",
          updatedAt: new Date(),
        })
        .where(eq(integration.id, existingIntegration.id));
    } else {
      await db.insert(integration).values({
        orgId,
        source: "linkedin",
        config: { defaultVisibility: "PUBLIC", hashtagsEnabled: false },
        tokens,
        status: "active",
      });
    }

    return NextResponse.redirect(`${appUrl}/dashboard/publishing?success=linkedin`);
  } catch {
    return redirectWithError("linkedin_callback_failed");
  }
}
