import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { org, integration } from "@doubleclout/db";
import { eq, and } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/sources?error=zoom_denied`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/sources?error=no_code`
    );
  }

  const orgId = state?.startsWith("org:") ? state.slice(4) : null;

  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/zoom/oauth/callback`;

  const tokenRes = await fetch("https://zoom.us/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  const tokenData = await tokenRes.json();

  if (tokenData.error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/sources?error=token_failed`
    );
  }

  const accessToken = tokenData.access_token;
  const refreshToken = tokenData.refresh_token;

  const userRes = await fetch("https://api.zoom.us/v2/users/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const userData = await userRes.json();

  let targetOrgId = orgId;
  if (!targetOrgId) {
    const [newOrg] = await db
      .insert(org)
      .values({ name: userData.email?.split("@")[0] + "'s Workspace" ?? "Workspace" })
      .returning();
    targetOrgId = newOrg!.id;
  }

  const existingIntegration = await db.query.integration.findFirst({
    where: (i, { and, eq }) =>
      and(eq(i.orgId, targetOrgId!), eq(i.source, "zoom")),
  });

  if (existingIntegration) {
    await db
      .update(integration)
      .set({
        tokens: { access: accessToken, refresh: refreshToken },
        status: "active",
        updatedAt: new Date(),
      })
      .where(eq(integration.id, existingIntegration.id));
  } else {
    await db.insert(integration).values({
      orgId: targetOrgId!,
      source: "zoom",
      config: { autoProcessTranscripts: true, recordedOnly: true },
      tokens: { access: accessToken, refresh: refreshToken },
      status: "active",
    });
  }

  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/sources?success=zoom`
  );
}
