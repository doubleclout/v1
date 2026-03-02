import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { integration } from "@doubleclout/db";
import { eq, and } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/publishing?error=linkedin_denied`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/publishing?error=no_code`
    );
  }

  const orgId = state?.startsWith("org:") ? state.slice(4) : null;
  if (!orgId) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/publishing?error=no_org`
    );
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/linkedin/oauth/callback`;

  const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: clientId!,
      client_secret: clientSecret!,
      redirect_uri: redirectUri,
    }),
  });

  const tokenData = await tokenRes.json();

  if (tokenData.error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/publishing?error=token_failed`
    );
  }

  const existingIntegration = await db.query.integration.findFirst({
    where: (i, { and, eq }) =>
      and(eq(i.orgId, orgId), eq(i.source, "linkedin")),
  });

  if (existingIntegration) {
    await db
      .update(integration)
      .set({
        tokens: {
          access: tokenData.access_token,
          expiry: tokenData.expires_in ? Date.now() + tokenData.expires_in * 1000 : undefined,
        },
        status: "active",
        updatedAt: new Date(),
      })
      .where(eq(integration.id, existingIntegration.id));
  } else {
    await db.insert(integration).values({
      orgId,
      source: "linkedin",
      config: { defaultVisibility: "PUBLIC", hashtagsEnabled: false },
      tokens: {
        access: tokenData.access_token,
        expiry: tokenData.expires_in ? Date.now() + tokenData.expires_in * 1000 : undefined,
      },
      status: "active",
    });
  }

  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/publishing?success=linkedin`
  );
}
