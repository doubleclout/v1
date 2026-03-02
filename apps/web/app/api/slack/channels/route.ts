import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { integration } from "@doubleclout/db";
import { eq, and } from "@doubleclout/db";

export async function GET() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await db.query.user.findFirst({
    where: (u, { eq }) => eq(u.authUserId, authUser.id),
  });

  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const slackIntegration = await db.query.integration.findFirst({
    where: (i, { and, eq }) =>
      and(eq(i.orgId, dbUser.orgId), eq(i.source, "slack")),
  });

  if (!slackIntegration?.tokens?.bot) {
    return NextResponse.json({ error: "Slack not connected" }, { status: 400 });
  }

  const res = await fetch("https://slack.com/api/conversations.list", {
    headers: {
      Authorization: `Bearer ${slackIntegration.tokens.bot}`,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();

  if (!data.ok) {
    return NextResponse.json(
      { error: data.error ?? "Failed to fetch channels" },
      { status: 400 }
    );
  }

  const channels = (data.channels ?? [])
    .filter((c: { is_channel?: boolean; is_member?: boolean }) => c.is_channel)
    .map((c: { id: string; name: string }) => ({ id: c.id, name: c.name }));

  return NextResponse.json({ channels });
}
