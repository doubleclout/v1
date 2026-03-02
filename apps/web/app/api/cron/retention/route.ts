import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { executionEvent, insight, orgRetention } from "@doubleclout/db";
import { eq, and, lt } from "@doubleclout/db";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const retentions = await db.select().from(orgRetention);
  let deleted = 0;

  for (const r of retentions) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - r.retentionDays);

    const events = await db
      .select({ id: executionEvent.id })
      .from(executionEvent)
      .where(and(eq(executionEvent.orgId, r.orgId), lt(executionEvent.createdAt, cutoff)));

    for (const e of events) {
      await db.delete(executionEvent).where(eq(executionEvent.id, e.id));
      deleted++;
    }

    const oldInsights = await db
      .select({ id: insight.id })
      .from(insight)
      .where(and(eq(insight.orgId, r.orgId), lt(insight.createdAt, cutoff)));

    for (const i of oldInsights) {
      await db.delete(insight).where(eq(insight.id, i.id));
      deleted++;
    }
  }

  return NextResponse.json({ deleted });
}
