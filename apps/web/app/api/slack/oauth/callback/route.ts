import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { org, integration, eq } from "@doubleclout/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/sources?error=slack_denied`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/sources?error=no_code`
    );
  }

  const orgId = state?.startsWith("org:") ? state.slice(4) : null;

  const clientId = process.env.SLACK_CLIENT_ID;
  const clientSecret = process.env.SLACK_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/slack/oauth/callback`;

  const tokenRes = await fetch("https://slack.com/api/oauth.v2.access", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      code,
      redirect_uri: redirectUri,
    }),
  });

  const tokenData = await tokenRes.json();

  if (!tokenData.ok) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/sources?error=token_failed`
    );
  }

  const teamId = tokenData.team?.id;
  const teamName = tokenData.team?.name ?? "Workspace";
  const botToken = tokenData.access_token;

  let targetOrgId = orgId;

  const existingOrg = await db.query.org.findFirst({
    where: (o, { eq }) => eq(o.slackTeamId, teamId),
  });

  if (existingOrg) {
    targetOrgId = existingOrg.id;
    await db
      .update(org)
      .set({ name: teamName, updatedAt: new Date() })
      .where(eq(org.id, targetOrgId));
  } else if (!targetOrgId) {
    const [newOrg] = await db
      .insert(org)
      .values({
        name: teamName,
        slackTeamId: teamId,
      })
      .returning();
    targetOrgId = newOrg!.id;
  } else {
    await db
      .update(org)
      .set({ slackTeamId: teamId, name: teamName, updatedAt: new Date() })
      .where(eq(org.id, targetOrgId));
  }

  const existingIntegration = await db.query.integration.findFirst({
    where: (i, { and, eq }) =>
      and(eq(i.orgId, targetOrgId!), eq(i.source, "slack")),
  });

  if (existingIntegration) {
    await db
      .update(integration)
      .set({
        tokens: { bot: botToken },
        status: "active",
        updatedAt: new Date(),
      })
      .where(eq(integration.id, existingIntegration.id));
  } else {
    await db.insert(integration).values({
      orgId: targetOrgId!,
      source: "slack",
      config: { channelIds: [] },
      tokens: { bot: botToken },
      status: "active",
    });
  }

  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/sources?success=slack`
  );
}
