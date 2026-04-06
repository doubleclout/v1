import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { org, integration } from "@doubleclout/db";
import { eq } from "@doubleclout/db";
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
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/sources?error=google_denied`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/sources?error=no_code`
    );
  }

  const parsedState = parseOAuthState(state, "google");
  if (!parsedState.ok) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/sources?error=${parsedState.error}`
    );
  }
  const orgId = parsedState.orgId;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/google/oauth/callback`;

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

  let targetOrgId: string | null = orgId;
  if (!targetOrgId) {
    const [newOrg] = await db
      .insert(org)
      .values({ name: "Google Workspace" })
      .returning();
    targetOrgId = newOrg!.id;
  }

  const existingOrg = await db.query.org.findFirst({
    where: (o, { eq }) => eq(o.id, targetOrgId!),
  });
  if (!existingOrg) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/sources?error=invalid_org`
    );
  }

  const existingIntegration = await db.query.integration.findFirst({
    where: (i, { and, eq }) =>
      and(eq(i.orgId, targetOrgId!), eq(i.source, "google")),
  });

  if (existingIntegration) {
    const mergedTokens = buildGoogleTokens(
      tokenData,
      existingIntegration.tokens as Record<string, string> | undefined
    );
    const mergedConfig = getDefaultGoogleConfig(
      (existingIntegration.config as Record<string, unknown>) ?? {},
      "google"
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
    const defaultConfig = getDefaultGoogleConfig(undefined, "google");
    await db.insert(integration).values({
      orgId: targetOrgId!,
      source: "google",
      config: defaultConfig,
      tokens: buildGoogleTokens(tokenData),
      status: "active",
    });
  }

  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/sources?success=google`
  );
}
