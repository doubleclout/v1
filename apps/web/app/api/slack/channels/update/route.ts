import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { integration } from "@doubleclout/db";
import { eq, and } from "@doubleclout/db";

export async function POST(request: Request) {
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

  const body = await request.json();
  const { channelIds } = body as { channelIds: string[] };

  if (!Array.isArray(channelIds)) {
    return NextResponse.json(
      { error: "channelIds must be an array" },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(integration)
    .set({
      config: { channelIds },
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(integration.orgId, dbUser.orgId),
        eq(integration.source, "slack")
      )
    )
    .returning();

  if (!updated) {
    return NextResponse.json(
      { error: "Slack integration not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
