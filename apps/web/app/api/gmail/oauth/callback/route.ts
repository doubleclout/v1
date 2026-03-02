import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { integration } from "@doubleclout/db";
import { eq, and } from "@doubleclout/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/sources?error=gmail_denied`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/sources?error=no_code`
    );
  }

  const orgId = state?.startsWith("org:") ? state.slice(4) : null;
  if (!orgId) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/sources?error=no_org`
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/gmail/oauth/callback`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId!,
      client_secret: clientSecret!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const tokenData = await tokenRes.json();

  if (tokenData.error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/sources?error=token_failed`
    );
  }

  const existingIntegration = await db.query.integration.findFirst({
    where: (i, { and, eq }) =>
      and(eq(i.orgId, orgId), eq(i.source, "gmail")),
  });

  if (existingIntegration) {
    await db
      .update(integration)
      .set({
        tokens: {
          access: tokenData.access_token,
          refresh: tokenData.refresh_token,
          ...(tokenData.expires_in && { expiry: String(Date.now() + tokenData.expires_in * 1000) }),
        },
        status: "active",
        updatedAt: new Date(),
      })
      .where(eq(integration.id, existingIntegration.id));
  } else {
    await db.insert(integration).values({
      orgId,
      source: "gmail",
      config: { labelIds: [], senderWhitelist: [] },
      tokens: {
        access: tokenData.access_token,
        refresh: tokenData.refresh_token,
        ...(tokenData.expires_in && { expiry: String(Date.now() + tokenData.expires_in * 1000) }),
      },
      status: "active",
    });
  }

  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/sources?success=gmail`
  );
}
