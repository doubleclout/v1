import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { integration } from "@doubleclout/db";
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

  const [int] = await db.select().from(integration).where(and(eq(integration.orgId, dbUser.orgId), eq(integration.source, "github"))).limit(1);
  if (!int?.tokens) return NextResponse.json({ error: "GitHub not connected" }, { status: 400 });

  const connection = process.env.REDIS_URL
    ? { host: new URL(process.env.REDIS_URL).hostname, port: parseInt(new URL(process.env.REDIS_URL).port || "6379"), password: new URL(process.env.REDIS_URL).password }
    : { host: "localhost", port: 6379 };

  const queue = new Queue("process-github", { connection });
  await queue.add("process-github", { orgId: dbUser.orgId, integrationId: int.id });

  return NextResponse.json({ queued: true });
}
