import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { integration, executionEvent } from "@doubleclout/db";
import { eq, and } from "@doubleclout/db";
import { Queue } from "bullmq";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await db.query.user.findFirst({
    where: (u, { eq }) => eq(u.authUserId, authUser.id),
  });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const [int] = await db
    .select()
    .from(integration)
    .where(and(eq(integration.orgId, dbUser.orgId), eq(integration.source, "google")))
    .limit(1);
  if (!int?.tokens) return NextResponse.json({ error: "Google not connected" }, { status: 400 });

  const { mode } = (await request.json().catch(() => ({}))) as { mode?: "backfill" | "incremental" };
  const config = int.config as { folderIds?: string[] };
  const folderIds = config?.folderIds ?? [];

  const connection = process.env.REDIS_URL
    ? { host: new URL(process.env.REDIS_URL).hostname, port: parseInt(new URL(process.env.REDIS_URL).port || "6379"), password: new URL(process.env.REDIS_URL).password }
    : { host: "localhost", port: 6379 };

  const queue = new Queue("process-google-doc", { connection });
  for (const folderId of folderIds) {
    await queue.add("process-google-doc", {
      orgId: dbUser.orgId,
      folderId,
      integrationId: int.id,
      incremental: mode === "incremental",
    });
  }
  if (folderIds.length === 0) {
    await queue.add("process-google-doc", {
      orgId: dbUser.orgId,
      integrationId: int.id,
      incremental: mode === "incremental",
    });
  }

  return NextResponse.json({ queued: true, mode: mode ?? "backfill", folderCount: folderIds.length });
}
