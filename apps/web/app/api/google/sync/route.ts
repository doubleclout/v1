import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { integration, executionEvent } from "@doubleclout/db";
import { eq, and } from "drizzle-orm";
import { Queue } from "bullmq";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await db.query.user.findFirst({
    where: (u, { eq }) => eq(u.authUserId, authUser.id),
  });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const [int] = await db.select().from(integration).where(and(eq(integration.orgId, dbUser.orgId), eq(integration.source, "google"))).limit(1);
  if (!int?.tokens) return NextResponse.json({ error: "Google not connected" }, { status: 400 });

  const tokens = int.tokens as { access?: string; refresh?: string };
  const config = int.config as { folderIds?: string[] };
  const folderIds = config?.folderIds ?? [];

  const connection = process.env.REDIS_URL
    ? { host: new URL(process.env.REDIS_URL).hostname, port: parseInt(new URL(process.env.REDIS_URL).port || "6379"), password: new URL(process.env.REDIS_URL).password }
    : { host: "localhost", port: 6379 };

  const queue = new Queue("process-google-doc", { connection });
  for (const folderId of folderIds) {
    await queue.add("process-google-doc", { orgId: dbUser.orgId, folderId, integrationId: int.id });
  }
  if (folderIds.length === 0) {
    await queue.add("process-google-doc", { orgId: dbUser.orgId, integrationId: int.id });
  }

  return NextResponse.json({ queued: true });
}
