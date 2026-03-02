import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { integration } from "@doubleclout/db";
import { eq } from "drizzle-orm";

const ZOOM_VERIFICATION_TOKEN = process.env.ZOOM_VERIFICATION_TOKEN;

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (body.event === "endpoint.url_validation") {
    const challenge = body.payload?.plainToken;
    return NextResponse.json({
      plainToken: challenge,
      encryptedToken: ZOOM_VERIFICATION_TOKEN
        ? crypto.createHmac("sha256", ZOOM_VERIFICATION_TOKEN).update(challenge).digest("hex")
        : challenge,
    });
  }

  if (body.event === "recording.transcript_completed" || body.event === "recording.completed") {
    const payload = body.payload?.object ?? body.payload;
    const meetingId = payload?.id ?? payload?.meeting_id;
    const recordingId = payload?.recording_id ?? payload?.id;

    if (!meetingId) {
      return NextResponse.json({ error: "No meeting id" }, { status: 400 });
    }

    const integrations = await db
      .select()
      .from(integration)
      .where(eq(integration.source, "zoom"));

    for (const int of integrations) {
      if (int.status !== "active") continue;

      const { Queue } = await import("bullmq");
      const connection = process.env.REDIS_URL
        ? {
            host: new URL(process.env.REDIS_URL).hostname,
            port: parseInt(new URL(process.env.REDIS_URL).port || "6379"),
            password: new URL(process.env.REDIS_URL).password || undefined,
          }
        : { host: "localhost", port: 6379 };

      const queue = new Queue("process-zoom-transcript", { connection });
      await queue.add("process-zoom-transcript", {
        orgId: int.orgId,
        meetingId,
        recordingId,
        integrationId: int.id,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
