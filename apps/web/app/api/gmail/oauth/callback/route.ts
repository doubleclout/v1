import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { integration } from "@doubleclout/db";
import { eq, and } from "@doubleclout/db";
import {
  buildGoogleTokens,
  exchangeGoogleOAuthCode,
  getDefaultGoogleConfig,
} from "@/lib/google-oauth";
import { parseOAuthState } from "@/lib/oauth-state";

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

  const parsedState = parseOAuthState(state, "gmail");
  if (!parsedState.ok) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/sources?error=${parsedState.error}`
    );
  }
  const orgId = parsedState.orgId;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/gmail/oauth/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/sources?error=google_not_configured`
    );
  }
  const tokenData = await exchangeGoogleOAuthCode({
    code,
    clientId,
    clientSecret,
    redirectUri,
  });

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
    const mergedTokens = buildGoogleTokens(
      tokenData,
      existingIntegration.tokens as Record<string, string> | undefined
    );
    const mergedConfig = getDefaultGoogleConfig(
      (existingIntegration.config as Record<string, unknown>) ?? {},
      "gmail"
    );
    await db
      .update(integration)
      .set({
        tokens: mergedTokens,
        config: mergedConfig,
        status: "active",
        updatedAt: new Date(),
      })
      .where(eq(integration.id, existingIntegration.id));
  } else {
    const defaultConfig = getDefaultGoogleConfig(undefined, "gmail");
    await db.insert(integration).values({
      orgId,
      source: "gmail",
      config: {
        ...defaultConfig,
        labelIds: [],
        senderWhitelist: [],
      },
      tokens: buildGoogleTokens(tokenData),
      status: "active",
    });
  }

  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/sources?success=gmail`
  );
}
