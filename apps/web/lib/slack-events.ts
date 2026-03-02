import crypto from "crypto";
import { Queue } from "bullmq";
import { db } from "@/lib/db";
import { integration } from "@doubleclout/db";
import { eq, and } from "@doubleclout/db";

const connection = process.env.REDIS_URL
  ? {
      host: new URL(process.env.REDIS_URL).hostname,
      port: parseInt(new URL(process.env.REDIS_URL).port || "6379"),
      password: new URL(process.env.REDIS_URL).password || undefined,
    }
  : { host: "localhost", port: 6379 };

const slackQueue = new Queue("process-slack-message", { connection });
const insightQueue = new Queue("insight-extraction", { connection });

function verifySlackSignature(body: string, signature: string): boolean {
  const secret = process.env.SLACK_SIGNING_SECRET;
  if (!secret) return false;

  const sigBasestring = `v0:${body}`;
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(sigBasestring);
  const computed = `v0=${hmac.digest("hex")}`;
  return crypto.timingSafeEqual(
    Buffer.from(signature, "utf8"),
    Buffer.from(computed, "utf8")
  );
}

export async function handleSlackEvent(body: string, signature: string) {
  if (!verifySlackSignature(body, signature)) {
    throw new Error("Invalid signature");
  }

  const payload = JSON.parse(body);

  if (payload.type === "url_verification") {
    return { challenge: payload.challenge };
  }

  if (payload.type === "event_callback") {
    const event = payload.event;

    if (event.type === "message") {
      if (event.bot_id || event.subtype === "bot_message") {
        return {};
      }

      const channelId = event.channel;
      const messageTs = event.ts;
      const text = event.text ?? "";
      const userId = event.user;

      const integrations = await db
        .select()
        .from(integration)
        .where(
          and(eq(integration.source, "slack"), eq(integration.status, "active"))
        );

      for (const int of integrations) {
        const config = int.config as { channelIds?: string[] };
        const channelIds = config?.channelIds ?? [];
        if (channelIds.length === 0 || channelIds.includes(channelId)) {
          await slackQueue.add("process-slack-message", {
            orgId: int.orgId,
            channelId,
            messageTs,
            text,
            userId,
          });
        }
      }
    }
  }

  return {};
}

export { slackQueue, insightQueue };
