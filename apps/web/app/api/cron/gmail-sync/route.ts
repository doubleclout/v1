import { NextResponse } from "next/server";
import { Queue } from "bullmq";
import { db } from "@/lib/db";
import { integration } from "@doubleclout/db";
import { and, eq } from "@doubleclout/db";

function getRedisConnection() {
  return process.env.REDIS_URL
    ? {
        host: new URL(process.env.REDIS_URL).hostname,
        port: parseInt(new URL(process.env.REDIS_URL).port || "6379"),
        password: new URL(process.env.REDIS_URL).password,
      }
    : { host: "localhost", port: 6379 };
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const queue = new Queue("process-gmail", { connection: getRedisConnection() });
  const integrations = await db
    .select()
    .from(integration)
    .where(and(eq(integration.source, "gmail"), eq(integration.status, "active")));

  let queued = 0;
  for (const int of integrations) {
    const config = (int.config as { syncEnabled?: boolean }) ?? {};
    if (config.syncEnabled === false) continue;

    await queue.add("process-gmail", {
      orgId: int.orgId,
      integrationId: int.id,
      incremental: true,
    });
    queued++;
  }

  return NextResponse.json({ queued, integrations: integrations.length, mode: "incremental" });
}
