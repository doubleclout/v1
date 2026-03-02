import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { insight, integration, draft, publication } from "@doubleclout/db";
import { eq, and } from "@doubleclout/db";
import { generateDraft } from "@doubleclout/ai";
import { logAudit } from "@/lib/audit";

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

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-slack-signature") ?? "";

  if (!verifySlackSignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const params = new URLSearchParams(body);
  const payload = JSON.parse(params.get("payload") ?? "{}");

  if (payload.type === "view_submission") {
    const metadata = JSON.parse(payload.view.private_metadata ?? "{}") as { insightId: string; platform?: string };
    const insightId = metadata.insightId ?? payload.view.private_metadata;
    const platform = payload.view.state.values.platform_block?.platform_select?.selected_option?.value as string ?? metadata.platform ?? "slack";
    const draftContent =
      payload.view.state.values.draft_block?.draft_input?.value ?? "";

    const [insightRow] = await db
      .select()
      .from(insight)
      .where(eq(insight.id, insightId))
      .limit(1);

    if (!insightRow) {
      return NextResponse.json({ response_action: "errors", errors: { draft_block: "Insight not found" } });
    }

    const variation = (payload.view.state.values.variation_block?.variation_select?.selected_option?.value as "educational" | "tactical" | "reflective") ?? "educational";

    const [draftRow] = await db
      .insert(draft)
      .values({
        orgId: insightRow.orgId,
        insightId,
        variation,
        content: draftContent,
      })
      .returning();

    await db
      .update(insight)
      .set({ status: "draft_generated", updatedAt: new Date() })
      .where(eq(insight.id, insightId));

    if (platform === "linkedin") {
      const { publishToLinkedIn } = await import("@/lib/linkedin");
      const result = await publishToLinkedIn(insightRow.orgId, draftContent);
      await db.insert(publication).values({
        orgId: insightRow.orgId,
        draftId: draftRow!.id,
        platform: "linkedin",
        status: result.success ? "published" : "failed",
        publishedAt: result.success ? new Date() : undefined,
        errorMessage: result.error,
        externalId: result.postUrn,
      });
      await logAudit(insightRow.orgId, "draft_published", { metadata: { platform, insightId } });
      if (!result.success && insightRow.slackChannelId) {
        const [slackInt] = await db.select().from(integration).where(and(eq(integration.orgId, insightRow.orgId), eq(integration.source, "slack"))).limit(1);
        const botToken = (slackInt?.tokens as { bot?: string })?.bot;
        if (botToken) {
          await fetch("https://slack.com/api/chat.postMessage", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${botToken}` },
            body: JSON.stringify({
              channel: insightRow.slackChannelId,
              text: `LinkedIn publish failed: ${result.error}`,
            }),
          });
        }
      }
    } else {
      await logAudit(insightRow.orgId, "draft_published", { metadata: { platform: "slack", insightId } });
      await db.insert(publication).values({
        orgId: insightRow.orgId,
        draftId: draftRow!.id,
        platform: "slack",
        status: "published",
        publishedAt: new Date(),
      });
      const [slackInt] = await db.select().from(integration).where(and(eq(integration.orgId, insightRow.orgId), eq(integration.source, "slack"))).limit(1);
      const botToken = (slackInt?.tokens as { bot?: string })?.bot;
      if (botToken && insightRow.slackChannelId) {
        await fetch("https://slack.com/api/chat.postMessage", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${botToken}` },
          body: JSON.stringify({ channel: insightRow.slackChannelId, text: draftContent }),
        });
      }
    }

    return NextResponse.json({ ok: true });
  }

  const actionId = payload.actions?.[0]?.action_id;
  const value = payload.actions?.[0]?.value;
  const triggerId = payload.trigger_id;

  if (!value) {
    return NextResponse.json({ error: "No value" }, { status: 400 });
  }

  const insightId = value;

  if (actionId === "ignore_insight") {
    const [i] = await db.select().from(insight).where(eq(insight.id, insightId)).limit(1);
    if (i) await logAudit(i.orgId, "insight_ignored", { metadata: { insightId } });
    await db
      .update(insight)
      .set({ status: "ignored", updatedAt: new Date() })
      .where(eq(insight.id, insightId));
    return NextResponse.json({ ok: true });
  }

  if (actionId === "save_internal") {
    const [i] = await db.select().from(insight).where(eq(insight.id, insightId)).limit(1);
    if (i) await logAudit(i.orgId, "insight_saved_internal", { metadata: { insightId } });
    await db
      .update(insight)
      .set({ status: "internal", updatedAt: new Date() })
      .where(eq(insight.id, insightId));
    return NextResponse.json({ ok: true });
  }

  if (actionId === "generate_draft") {
    const [insightRow] = await db
      .select()
      .from(insight)
      .where(eq(insight.id, insightId))
      .limit(1);

    if (!insightRow) {
      return NextResponse.json({ error: "Insight not found" }, { status: 404 });
    }

    const [linkedInInt] = await db.select().from(integration).where(and(eq(integration.orgId, insightRow.orgId), eq(integration.source, "linkedin"))).limit(1);
    const hasLinkedIn = !!linkedInInt;

    const [educational, tactical, reflective] = await Promise.all([
      generateDraft(insightRow.summary, "educational"),
      generateDraft(insightRow.summary, "tactical"),
      generateDraft(insightRow.summary, "reflective"),
    ]);

    const defaultDraft = educational;
    const privateMetadata = JSON.stringify({ insightId, platform: "slack" });

    const blocks: Record<string, unknown>[] = [
      {
        type: "section",
        text: { type: "mrkdwn", text: `*Insight:* ${insightRow.summary}` },
      },
      {
        type: "input",
        block_id: "variation_block",
        label: { type: "plain_text", text: "Draft style", emoji: true },
        element: {
          type: "radio_buttons",
          action_id: "variation_select",
          options: [
            { text: { type: "plain_text", text: "Educational — teach the lesson", emoji: true }, value: "educational" },
            { text: { type: "plain_text", text: "Tactical — how-to breakdown", emoji: true }, value: "tactical" },
            { text: { type: "plain_text", text: "Reflective — lessons learned", emoji: true }, value: "reflective" },
          ],
          initial_option: { text: { type: "plain_text", text: "Educational", emoji: true }, value: "educational" },
        },
      },
      {
        type: "input",
        block_id: "draft_block",
        label: { type: "plain_text", text: "Draft (editable)", emoji: true },
        element: {
          type: "plain_text_input",
          action_id: "draft_input",
          multiline: true,
          initial_value: defaultDraft,
        },
      },
    ];

    if (hasLinkedIn) {
      blocks.splice(1, 0, {
        type: "input",
        block_id: "platform_block",
        label: { type: "plain_text", text: "Publish to", emoji: true },
        element: {
          type: "radio_buttons",
          action_id: "platform_select",
          options: [
            { text: { type: "plain_text", text: "Slack channel", emoji: true }, value: "slack" },
            { text: { type: "plain_text", text: "LinkedIn", emoji: true }, value: "linkedin" },
          ],
          initial_option: { text: { type: "plain_text", text: "Slack", emoji: true }, value: "slack" },
        },
      });
    }

    const [slackInt] = await db.select().from(integration).where(and(eq(integration.orgId, insightRow.orgId), eq(integration.source, "slack"))).limit(1);
    const botToken = (slackInt?.tokens as { bot?: string })?.bot;

    if (botToken && triggerId) {
      await fetch("https://slack.com/api/views.open", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${botToken}` },
        body: JSON.stringify({
          trigger_id: triggerId,
          view: {
            type: "modal",
            callback_id: "draft_modal",
            title: { type: "plain_text", text: "Generate Draft", emoji: true },
            submit: { type: "plain_text", text: "Publish", emoji: true },
            close: { type: "plain_text", text: "Cancel", emoji: true },
            private_metadata: privateMetadata,
            blocks,
          },
        }),
      });
    }
  }

  return NextResponse.json({ ok: true });
}
