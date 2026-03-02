import { Worker, Queue } from "bullmq";
import { createDb, executionEvent, insight, integration } from "@doubleclout/db";
import { eq, and } from "drizzle-orm";
import { extractInsight } from "@doubleclout/ai";

const connection = {
  host: process.env.REDIS_URL ? new URL(process.env.REDIS_URL).hostname : "localhost",
  port: process.env.REDIS_URL ? parseInt(new URL(process.env.REDIS_URL).port || "6379") : 6379,
  password: process.env.REDIS_URL ? new URL(process.env.REDIS_URL).password : undefined,
};

const insightQueue = new Queue("insight-extraction", { connection });

async function getZoomAccessToken(integrationId: string): Promise<string | null> {
  const db = createDb();
  const [int] = await db.select().from(integration).where(eq(integration.id, integrationId)).limit(1);
  const tokens = int?.tokens as { access?: string; refresh?: string } | undefined;
  if (!tokens?.access) return null;
  return tokens.access;
}

const processZoomTranscript = new Worker(
  "process-zoom-transcript",
  async (job) => {
    const { orgId, meetingId, recordingId, integrationId } = job.data;
    const db = createDb();

    const accessToken = await getZoomAccessToken(integrationId);
    if (!accessToken) return { error: "No Zoom token" };

    const meetingRes = await fetch(
      `https://api.zoom.us/v2/meetings/${meetingId}/recordings`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!meetingRes.ok) {
      const err = await meetingRes.text();
      return { error: err };
    }

    const records = await meetingRes.json();
    const transcriptUrl = records?.recording_files?.find(
      (f: { file_type?: string }) => f.file_type === "TRANSCRIPT" || f.file_type === "VTT"
    )?.download_url;

    if (!transcriptUrl) {
      return { error: "No transcript available" };
    }

    const transcriptRes = await fetch(transcriptUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const transcriptText = await transcriptRes.text();

    const meetingInfo = records?.topic ?? `Zoom meeting ${meetingId}`;
    const sourceAttribution = `From Zoom call: ${meetingInfo} · ${new Date().toLocaleDateString()}`;

    const [event] = await db
      .insert(executionEvent)
      .values({
        orgId,
        source: "zoom",
        type: "transcript",
        rawContent: transcriptText.slice(0, 50000),
        structuredMetadata: { meetingId, recordingId },
        externalId: `zoom-${meetingId}-${recordingId}`,
      })
      .returning();

    await insightQueue.add("insight-extraction", {
      orgId,
      text: transcriptText.slice(0, 15000),
      source: "zoom",
      sourceAttribution,
      externalId: event.id,
    });

    return { orgId, meetingId };
  },
  { connection }
);

const processSlackMessage = new Worker(
  "process-slack-message",
  async (job) => {
    const { orgId, channelId, messageTs, text, userId } = job.data;
    const db = createDb();

    await db.insert(executionEvent).values({
      orgId,
      source: "slack",
      type: "message",
      actors: userId ? [userId] : [],
      rawContent: text,
      structuredMetadata: { channelId, messageTs },
      externalId: `${channelId}-${messageTs}`,
    });

    await insightQueue.add("insight-extraction", {
      orgId,
      channelId,
      messageTs,
      text,
    });

    return { orgId, channelId, messageTs, text };
  },
  { connection }
);

const insightExtraction = new Worker(
  "insight-extraction",
  async (job) => {
    const { orgId, channelId, messageTs, text, source, sourceAttribution, externalId } = job.data;
    const db = createDb();

    const result = await extractInsight(text);

    if (result.confidence > 0.7) {
      let event;
      if (externalId) {
        const isUuid = /^[0-9a-f-]{36}$/i.test(externalId);
        if (isUuid) {
          event = await db.query.executionEvent.findFirst({
            where: (e, { eq }) => eq(e.id, externalId),
          });
        } else {
          [event] = await db.select().from(executionEvent).where(eq(executionEvent.externalId, externalId)).limit(1);
        }
      } else {
        [event] = await db
          .select()
          .from(executionEvent)
          .where(eq(executionEvent.externalId, `${channelId}-${messageTs}`))
          .limit(1);
      }

      if (event) {
        let postChannel = channelId;
        if (!postChannel) {
          const [slackInt] = await db.select().from(integration).where(and(eq(integration.orgId, orgId), eq(integration.source, "slack"))).limit(1);
          const config = slackInt?.config as { channelIds?: string[]; defaultChannelId?: string } | undefined;
          postChannel = config?.defaultChannelId ?? config?.channelIds?.[0];
        }
        const attribution = sourceAttribution ?? (channelId ? `From Slack · ${new Date().toLocaleDateString()}` : null);

        const [insightRow] = await db
          .insert(insight)
          .values({
            orgId,
            executionEventIds: [event.id],
            summary: result.summary,
            confidence: result.confidence,
            sensitivity: result.sensitivity,
            status: "pending",
            slackChannelId: postChannel ?? null,
            sourceAttribution: attribution,
          })
          .returning();

        const [slackInt] = await db
          .select()
          .from(integration)
          .where(
            and(eq(integration.orgId, orgId), eq(integration.source, "slack"))
          )
          .limit(1);

        const botToken = (slackInt?.tokens as { bot?: string })?.bot;
        if (botToken && postChannel) {
          await fetch("https://slack.com/api/chat.postMessage", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${botToken}`,
            },
            body: JSON.stringify({
              channel: postChannel,
              text: "New Insight Detected",
              blocks: [
                {
                  type: "header",
                  text: { type: "plain_text", text: "New Insight Detected", emoji: true },
                },
                {
                  type: "section",
                  fields: [
                    { type: "mrkdwn", text: `*Source:* ${source === "zoom" ? "Zoom" : "Slack"}` },
                    { type: "mrkdwn", text: `*Confidence:* ${result.confidence > 0.8 ? "High" : "Medium"}` },
                    { type: "mrkdwn", text: `*Sensitivity:* ${result.sensitivity}` },
                    { type: "mrkdwn", text: `*Insight:* ${result.summary}` },
                  ],
                },
                {
                  type: "actions",
                  elements: [
                    {
                      type: "button",
                      text: { type: "plain_text", text: "Generate Draft", emoji: true },
                      action_id: "generate_draft",
                      value: insightRow.id,
                    },
                    {
                      type: "button",
                      text: { type: "plain_text", text: "Save Internal", emoji: true },
                      action_id: "save_internal",
                      value: insightRow.id,
                    },
                    {
                      type: "button",
                      text: { type: "plain_text", text: "Ignore", emoji: true },
                      action_id: "ignore_insight",
                      value: insightRow.id,
                    },
                  ],
                },
              ],
            }),
          });
        }

        return { insightId: insightRow.id, channelId, summary: result.summary };
      }
    }

    return { skipped: true, confidence: result.confidence };
  },
  { connection }
);

const processGoogleDoc = new Worker(
  "process-google-doc",
  async (job) => {
    const { orgId, folderId, integrationId } = job.data;
    const db = createDb();
    const [int] = await db.select().from(integration).where(eq(integration.id, integrationId)).limit(1);
    const tokens = int?.tokens as { access?: string } | undefined;
    if (!tokens?.access) return { error: "No token" };

    const driveRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${folderId ? `'${folderId}' in parents` : "mimeType='application/vnd.google-apps.document'"}&fields=files(id,name,mimeType,modifiedTime)&pageSize=10`,
      { headers: { Authorization: `Bearer ${tokens.access}` } }
    );
    const driveData = await driveRes.json();
    const files = driveData.files ?? [];

    for (const file of files) {
      if (file.mimeType?.includes("document")) {
        const docRes = await fetch(
          `https://docs.googleapis.com/v1/documents/${file.id}?fields=body`,
          { headers: { Authorization: `Bearer ${tokens.access}` } }
        );
        const doc = await docRes.json();
        const text = doc.body?.content?.map((c: { paragraph?: { elements?: { textRun?: { content?: string }[] }[] } }) =>
          c.paragraph?.elements?.map((e) => e.textRun?.content ?? "").join("") ?? ""
        ).join("") ?? "";

        if (text.length > 100) {
          await db.insert(executionEvent).values({
            orgId,
            source: "google",
            type: "doc",
            rawContent: text.slice(0, 50000),
            structuredMetadata: { fileId: file.id, fileName: file.name },
            externalId: `google-${file.id}`,
          });
          await insightQueue.add("insight-extraction", {
            orgId,
            text: text.slice(0, 15000),
            source: "google",
            sourceAttribution: `From Google Doc: ${file.name} · ${new Date().toLocaleDateString()}`,
            externalId: `google-${file.id}`,
          });
        }
      }
    }
    return { processed: files.length };
  },
  { connection }
);


const processGithub = new Worker(
  "process-github",
  async (job) => {
    const { orgId, integrationId } = job.data;
    const db = createDb();
    const [int] = await db.select().from(integration).where(eq(integration.id, integrationId)).limit(1);
    const tokens = int?.tokens as { access?: string } | undefined;
    const config = int?.config as { repos?: string[]; includePRs?: boolean; includeIssues?: boolean; includeReleases?: boolean } | undefined;
    if (!tokens?.access) return { error: "No token" };

    const accessToken = tokens.access;
    const includePRs = config?.includePRs !== false;
    const includeIssues = config?.includeIssues !== false;
    const includeReleases = config?.includeReleases !== false;

    const reposRes = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const repos = await reposRes.json();
    const repoList = Array.isArray(repos) ? repos : [];
    const targetRepos = (config?.repos?.length ? config.repos : repoList.slice(0, 5).map((r: { full_name: string }) => r.full_name)) as string[];

    let processed = 0;

    for (const repo of targetRepos) {
      const [owner, repoName] = repo.split("/");
      if (!owner || !repoName) continue;

      if (includePRs) {
        const prRes = await fetch(
          `https://api.github.com/repos/${owner}/${repoName}/pulls?state=closed&per_page=20`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const prs = await prRes.json();
        for (const pr of Array.isArray(prs) ? prs : []) {
          const externalId = `github-pr-${pr.id}`;
          const existing = await db.select().from(executionEvent).where(eq(executionEvent.externalId, externalId)).limit(1);
          if (existing.length === 0 && pr.title && pr.body) {
            const text = `${pr.title}\n\n${pr.body}`.slice(0, 15000);
            await db.insert(executionEvent).values({
              orgId,
              source: "github",
              type: "pr",
              rawContent: text.slice(0, 50000),
              structuredMetadata: { prNumber: pr.number, repo, url: pr.html_url },
              externalId,
            });
            await insightQueue.add("insight-extraction", {
              orgId,
              text,
              source: "github",
              sourceAttribution: `From GitHub PR #${pr.number} in ${repo} · ${new Date().toLocaleDateString()}`,
              externalId,
            });
            processed++;
          }
        }
      }

      if (includeIssues) {
        const issuesRes = await fetch(
          `https://api.github.com/repos/${owner}/${repoName}/issues?state=all&per_page=20`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const issues = await issuesRes.json();
        for (const issue of Array.isArray(issues) ? issues : []) {
          if (issue.pull_request) continue;
          const externalId = `github-issue-${issue.id}`;
          const existing = await db.select().from(executionEvent).where(eq(executionEvent.externalId, externalId)).limit(1);
          if (existing.length === 0 && issue.title && issue.body) {
            const text = `${issue.title}\n\n${issue.body}`.slice(0, 15000);
            await db.insert(executionEvent).values({
              orgId,
              source: "github",
              type: "issue",
              rawContent: text.slice(0, 50000),
              structuredMetadata: { issueNumber: issue.number, repo, url: issue.html_url },
              externalId,
            });
            await insightQueue.add("insight-extraction", {
              orgId,
              text,
              source: "github",
              sourceAttribution: `From GitHub issue #${issue.number} in ${repo} · ${new Date().toLocaleDateString()}`,
              externalId,
            });
            processed++;
          }
        }
      }

      if (includeReleases) {
        const relRes = await fetch(
          `https://api.github.com/repos/${owner}/${repoName}/releases?per_page=10`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const releases = await relRes.json();
        for (const rel of Array.isArray(releases) ? releases : []) {
          const externalId = `github-release-${rel.id}`;
          const existing = await db.select().from(executionEvent).where(eq(executionEvent.externalId, externalId)).limit(1);
          if (existing.length === 0 && rel.name && rel.body) {
            const text = `${rel.name}\n\n${rel.body}`.slice(0, 15000);
            await db.insert(executionEvent).values({
              orgId,
              source: "github",
              type: "release",
              rawContent: text.slice(0, 50000),
              structuredMetadata: { tagName: rel.tag_name, repo, url: rel.html_url },
              externalId,
            });
            await insightQueue.add("insight-extraction", {
              orgId,
              text,
              source: "github",
              sourceAttribution: `From GitHub release ${rel.tag_name} in ${repo} · ${new Date().toLocaleDateString()}`,
              externalId,
            });
            processed++;
          }
        }
      }
    }

    return { processed };
  },
  { connection }
);

const processGmail = new Worker(
  "process-gmail",
  async (job) => {
    const { orgId, integrationId } = job.data;
    const db = createDb();
    const [int] = await db.select().from(integration).where(eq(integration.id, integrationId)).limit(1);
    const tokens = int?.tokens as { access?: string } | undefined;
    const config = int?.config as { labelIds?: string[] } | undefined;
    if (!tokens?.access) return { error: "No token" };

    const labelQuery = config?.labelIds?.length ? `&labelIds=${config.labelIds.join(",")}` : "";
    const listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10${labelQuery}`,
      { headers: { Authorization: `Bearer ${tokens.access}` } }
    );
    const list = await listRes.json();
    const messages = list.messages ?? [];
    let processed = 0;

    for (const msg of messages) {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
        { headers: { Authorization: `Bearer ${tokens.access}` } }
      );
      const m = await msgRes.json();
      const snippet = m.snippet ?? "";
      const subject = m.payload?.headers?.find((h: { name: string }) => h.name === "Subject")?.value ?? "";

      if (snippet.length > 50) {
        const existing = await db.select().from(executionEvent).where(eq(executionEvent.externalId, `gmail-${msg.id}`)).limit(1);
        if (existing.length === 0) {
          await db.insert(executionEvent).values({
            orgId,
            source: "gmail",
            type: "email",
            rawContent: `${subject}\n\n${snippet}`.slice(0, 50000),
            structuredMetadata: { messageId: msg.id },
            externalId: `gmail-${msg.id}`,
          });
          await insightQueue.add("insight-extraction", {
            orgId,
            text: snippet.slice(0, 8000),
            source: "gmail",
            sourceAttribution: `From Gmail: ${subject} · ${new Date().toLocaleDateString()}`,
            externalId: `gmail-${msg.id}`,
          });
          processed++;
        }
      }
    }
    return { processed };
  },
  { connection }
);

console.log("Workers started: process-slack-message, process-zoom-transcript, process-google-doc, process-gmail, process-github, insight-extraction");

process.on("SIGTERM", async () => {
  await processSlackMessage.close();
  await processZoomTranscript.close();
  await processGoogleDoc.close();
  await processGmail.close();
  await processGithub.close();
  await insightExtraction.close();
  process.exit(0);
});
