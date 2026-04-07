import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { Worker, Queue } from "bullmq";
import { createDb, executionEvent, insight, integration } from "@doubleclout/db";
import { eq, and } from "drizzle-orm";
import { extractInsight } from "@doubleclout/ai";

const currentFile = fileURLToPath(import.meta.url);
const workersDir = path.dirname(currentFile);
const repoRoot = path.resolve(workersDir, "..");

dotenv.config({ path: path.join(repoRoot, ".env.local") });
dotenv.config({ path: path.join(repoRoot, "apps/web/.env.local") });

const connection = {
  host: process.env.REDIS_URL ? new URL(process.env.REDIS_URL).hostname : "localhost",
  port: process.env.REDIS_URL ? parseInt(new URL(process.env.REDIS_URL).port || "6379") : 6379,
  password: process.env.REDIS_URL ? new URL(process.env.REDIS_URL).password : undefined,
};

const insightQueue = new Queue("insight-extraction", { connection });

type GoogleTokens = {
  access?: string;
  refresh?: string;
  expiry?: string;
};

type GoogleConfig = {
  folderIds?: string[];
  includeMimeTypes?: string[];
  driveCursor?: string | null;
  syncEnabled?: boolean;
  lastSyncAt?: string | null;
};

async function getZoomAccessToken(integrationId: string): Promise<string | null> {
  const db = createDb();
  const [int] = await db.select().from(integration).where(eq(integration.id, integrationId)).limit(1);
  const tokens = int?.tokens as { access?: string; refresh?: string } | undefined;
  if (!tokens?.access) return null;
  return tokens.access;
}

async function refreshGoogleAccessToken(integrationId: string, refreshToken: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || tokenData.error || !tokenData.access_token) {
    return null;
  }

  const db = createDb();
  const [int] = await db.select().from(integration).where(eq(integration.id, integrationId)).limit(1);
  const existing = (int?.tokens as GoogleTokens | undefined) ?? {};
  const nextTokens: GoogleTokens = {
    ...existing,
    access: tokenData.access_token,
    ...(tokenData.expires_in ? { expiry: String(Date.now() + tokenData.expires_in * 1000) } : {}),
  };
  await db
    .update(integration)
    .set({ tokens: nextTokens as Record<string, string>, updatedAt: new Date() })
    .where(eq(integration.id, integrationId));

  return nextTokens.access ?? null;
}

async function getGoogleAccessToken(integrationId: string) {
  const db = createDb();
  const [int] = await db.select().from(integration).where(eq(integration.id, integrationId)).limit(1);
  const tokens = (int?.tokens as GoogleTokens | undefined) ?? {};
  const expiry = tokens.expiry ? Number(tokens.expiry) : 0;
  const isExpired = expiry > 0 && Date.now() >= expiry - 30_000;

  if (tokens.access && !isExpired) return tokens.access;
  if (!tokens.refresh) return tokens.access ?? null;
  return await refreshGoogleAccessToken(integrationId, tokens.refresh);
}

async function googleApiRequest(accessToken: string, url: string) {
  return fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
}

async function getGoogleDocText(accessToken: string, fileId: string) {
  const docRes = await googleApiRequest(
    accessToken,
    `https://docs.googleapis.com/v1/documents/${fileId}?fields=title,body`
  );
  if (!docRes.ok) return "";
  const doc = await docRes.json();
  const content = doc.body?.content ?? [];
  return content
    .map(
      (c: {
        paragraph?: { elements?: { textRun?: { content?: string } }[] };
        table?: { tableRows?: { tableCells?: { content?: { paragraph?: { elements?: { textRun?: { content?: string } }[] } }[] }[] }[] };
      }) =>
        c.paragraph?.elements?.map((e) => e.textRun?.content ?? "").join("") ??
        c.table?.tableRows
          ?.flatMap((row) => row.tableCells ?? [])
          .flatMap((cell) => cell.content ?? [])
          .map((cellContent) =>
            cellContent.paragraph?.elements?.map((e) => e.textRun?.content ?? "").join("") ?? ""
          )
          .join(" ") ??
        ""
    )
    .join("");
}

async function getGoogleSheetText(accessToken: string, fileId: string) {
  const sheetRes = await googleApiRequest(
    accessToken,
    `https://sheets.googleapis.com/v4/spreadsheets/${fileId}?includeGridData=false`
  );
  if (!sheetRes.ok) return "";
  const sheet = await sheetRes.json();
  const sheetNames = (sheet.sheets ?? [])
    .map((s: { properties?: { title?: string } }) => s.properties?.title)
    .filter(Boolean)
    .join(", ");
  return `${sheet.properties?.title ?? "Spreadsheet"}\nSheets: ${sheetNames}`;
}

async function getGoogleSlidesText(accessToken: string, fileId: string) {
  const slidesRes = await googleApiRequest(
    accessToken,
    `https://slides.googleapis.com/v1/presentations/${fileId}`
  );
  if (!slidesRes.ok) return "";
  const slides = await slidesRes.json();
  const title = slides.title ?? "Presentation";
  const slideTexts = (slides.slides ?? []).flatMap(
    (slide: {
      pageElements?: {
        shape?: { text?: { textElements?: { textRun?: { content?: string } }[] } };
      }[];
    }) =>
      (slide.pageElements ?? [])
        .flatMap((pe) => pe.shape?.text?.textElements ?? [])
        .map((te) => te.textRun?.content ?? "")
        .filter(Boolean)
  );
  return `${title}\n${slideTexts.join(" ")}`;
}

function isMeetTranscriptDoc(fileName: string, text: string) {
  const name = fileName.toLowerCase();
  const body = text.slice(0, 4000).toLowerCase();
  return (
    (name.includes("transcript") || name.includes("meeting notes") || name.includes("meet")) &&
    (body.includes("speaker") || body.includes("meeting") || body.includes("action items"))
  );
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

insightExtraction.on("failed", (job, err) => {
  console.error("[insight-extraction] job failed", {
    jobId: job?.id,
    orgId: job?.data?.orgId,
    source: job?.data?.source,
    error: err.message,
  });
});

const processGoogleDoc = new Worker(
  "process-google-doc",
  async (job) => {
    const { orgId, folderId, integrationId, incremental = false } = job.data;
    console.log("[process-google-doc] job start", { orgId, folderId, integrationId, incremental });
    const db = createDb();
    const [int] = await db.select().from(integration).where(eq(integration.id, integrationId)).limit(1);
    const config = (int?.config as GoogleConfig | undefined) ?? {};
    const includeMimeTypes =
      config.includeMimeTypes?.length
        ? config.includeMimeTypes
        : [
            "application/vnd.google-apps.document",
            "application/vnd.google-apps.spreadsheet",
            "application/vnd.google-apps.presentation",
            "application/pdf",
          ];

    const accessTokenOrNull = await getGoogleAccessToken(integrationId);
    if (!accessTokenOrNull) return { error: "No token" };
    const accessToken: string = accessTokenOrNull;

    async function listFilesInFolder(parentId?: string) {
      let pageToken = "";
      const out: Array<{
        id: string;
        name: string;
        mimeType: string;
        modifiedTime?: string;
        parents?: string[];
      }> = [];
      do {
        const q = parentId
          ? `'${parentId}' in parents and trashed=false`
          : `trashed=false and mimeType!='application/vnd.google-apps.folder'`;
        const listRes = await googleApiRequest(
          accessToken,
          `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
            q
          )}&fields=nextPageToken,files(id,name,mimeType,modifiedTime,parents)&pageSize=200${
            pageToken ? `&pageToken=${pageToken}` : ""
          }`
        );
        if (!listRes.ok) {
          console.error("[process-google-doc] listFilesInFolder failed", {
            status: listRes.status,
            parentId,
          });
          break;
        }
        const data = await listRes.json();
        out.push(...(data.files ?? []));
        pageToken = data.nextPageToken ?? "";
      } while (pageToken);
      return out;
    }

    async function listFoldersRecursively(rootFolderId: string) {
      const folderIds = new Set<string>([rootFolderId]);
      const queue = [rootFolderId];
      while (queue.length > 0) {
        const current = queue.shift()!;
        let pageToken = "";
        do {
          const q = `'${current}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
          const listRes = await googleApiRequest(
            accessToken,
            `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
              q
            )}&fields=nextPageToken,files(id)&pageSize=200${pageToken ? `&pageToken=${pageToken}` : ""}`
          );
          if (!listRes.ok) {
            console.error("[process-google-doc] listFoldersRecursively failed", {
              status: listRes.status,
              current,
            });
            break;
          }
          const data = await listRes.json();
          for (const f of data.files ?? []) {
            if (!folderIds.has(f.id)) {
              folderIds.add(f.id);
              queue.push(f.id);
            }
          }
          pageToken = data.nextPageToken ?? "";
        } while (pageToken);
      }

      return Array.from(folderIds);
    }

    const configuredFolders = folderId ? [folderId] : config.folderIds ?? [];
    const targetFolderIds = new Set<string>();
    for (const configuredFolder of configuredFolders) {
      const nested = await listFoldersRecursively(configuredFolder);
      for (const id of nested) targetFolderIds.add(id);
    }

    const files: Array<{
      id: string;
      name: string;
      mimeType: string;
      modifiedTime?: string;
      parents?: string[];
    }> = [];

    let nextDriveCursor: string | null = config.driveCursor ?? null;
    if (incremental) {
      let pageToken = config.driveCursor ?? null;
      if (!pageToken) {
        const startRes = await googleApiRequest(
          accessToken,
          "https://www.googleapis.com/drive/v3/changes/startPageToken"
        );
        if (startRes.ok) {
          const startData = await startRes.json();
          nextDriveCursor = startData.startPageToken ?? null;
        }
      } else {
        do {
          const changesRes = await googleApiRequest(
            accessToken,
            `https://www.googleapis.com/drive/v3/changes?pageToken=${pageToken}&fields=nextPageToken,newStartPageToken,changes(fileId,removed,file(id,name,mimeType,modifiedTime,parents))&pageSize=200`
          );
          if (!changesRes.ok) {
            console.error("[process-google-doc] changes API failed", {
              status: changesRes.status,
            });
            break;
          }
          const changesData = await changesRes.json();
          for (const change of changesData.changes ?? []) {
            if (change.removed || !change.file) continue;
            const file = change.file as {
              id: string;
              name: string;
              mimeType: string;
              modifiedTime?: string;
              parents?: string[];
            };
            if (
              targetFolderIds.size > 0 &&
              !file.parents?.some((parentId) => targetFolderIds.has(parentId))
            ) {
              continue;
            }
            files.push(file);
          }
          pageToken = changesData.nextPageToken ?? null;
          if (changesData.newStartPageToken) {
            nextDriveCursor = changesData.newStartPageToken;
          }
        } while (pageToken);
      }
    } else if (targetFolderIds.size > 0) {
      for (const targetFolderId of targetFolderIds) {
        files.push(...(await listFilesInFolder(targetFolderId)));
      }
    } else {
      files.push(...(await listFilesInFolder()));
    }

    let processed = 0;
    let skipped = 0;
    for (const file of files) {
      if (file.mimeType === "application/vnd.google-apps.folder") continue;
      if (!includeMimeTypes.includes(file.mimeType)) {
        skipped++;
        continue;
      }

      const externalId = `google-${file.id}`;
      const existing = await db
        .select()
        .from(executionEvent)
        .where(eq(executionEvent.externalId, externalId))
        .limit(1);
      const prev = existing[0];
      const prevModified = (prev?.structuredMetadata as { modifiedTime?: string } | undefined)?.modifiedTime;
      if (incremental && prevModified && file.modifiedTime && prevModified === file.modifiedTime) {
        skipped++;
        continue;
      }

      let text = "";
      let eventType = "file";
      if (file.mimeType === "application/vnd.google-apps.document") {
        text = await getGoogleDocText(accessToken, file.id);
        eventType = "doc";
      } else if (file.mimeType === "application/vnd.google-apps.spreadsheet") {
        text = await getGoogleSheetText(accessToken, file.id);
        eventType = "sheet";
      } else if (file.mimeType === "application/vnd.google-apps.presentation") {
        text = await getGoogleSlidesText(accessToken, file.id);
        eventType = "slide";
      } else {
        text = `${file.name}\nFile updated at ${file.modifiedTime ?? "unknown time"}`;
        eventType = "file";
      }

      const isTranscript = isMeetTranscriptDoc(file.name, text);
      const sourceAttribution = isTranscript
        ? `From Google Meet transcript: ${file.name} · ${new Date().toLocaleDateString()}`
        : `From Google Drive: ${file.name} · ${new Date().toLocaleDateString()}`;

      const payload = {
        orgId,
        source: "google" as const,
        type: isTranscript ? "meeting_transcript" : eventType,
        rawContent: (text || file.name).slice(0, 50000),
        structuredMetadata: {
          fileId: file.id,
          fileName: file.name,
          mimeType: file.mimeType,
          modifiedTime: file.modifiedTime ?? null,
          parentIds: file.parents ?? [],
          isMeetTranscript: isTranscript,
        },
        externalId,
      };

      if (prev) {
        await db
          .update(executionEvent)
          .set({
            type: payload.type,
            rawContent: payload.rawContent,
            structuredMetadata: payload.structuredMetadata,
          })
          .where(eq(executionEvent.id, prev.id));
      } else {
        await db.insert(executionEvent).values(payload);
      }

      if (text.length >= 100) {
        await insightQueue.add("insight-extraction", {
          orgId,
          text: text.slice(0, 15000),
          source: "google",
          sourceAttribution,
          externalId,
        });
      }
      processed++;
    }

    await db
      .update(integration)
      .set({
        config: {
          ...config,
          folderIds: config.folderIds ?? configuredFolders,
          includeMimeTypes,
          driveCursor: nextDriveCursor,
          lastSyncAt: new Date().toISOString(),
        } as Record<string, unknown>,
        updatedAt: new Date(),
      })
      .where(eq(integration.id, integrationId));

    const result = { processed, skipped, total: files.length };
    console.log("[process-google-doc] job done", result);
    return result;
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
    const { orgId, integrationId, incremental = true } = job.data;
    const db = createDb();
    const [int] = await db.select().from(integration).where(eq(integration.id, integrationId)).limit(1);
    const config =
      (int?.config as {
        labelIds?: string[];
        senderWhitelist?: string[];
        gmailHistoryId?: string | null;
        syncEnabled?: boolean;
        lastSyncAt?: string | null;
      } | undefined) ?? {};

    const accessToken = await getGoogleAccessToken(integrationId);
    if (!accessToken) return { error: "No token" };

    const messageIds = new Set<string>();
    let latestHistoryId: string | null = config.gmailHistoryId ?? null;

    const appendListMessages = async (maxResults: number) => {
      const query = new URLSearchParams();
      query.set("maxResults", String(maxResults));
      for (const labelId of config.labelIds ?? []) {
        query.append("labelIds", labelId);
      }
      const listRes = await googleApiRequest(
        accessToken,
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?${query.toString()}`
      );
      if (!listRes.ok) return;
      const list = await listRes.json();
      for (const m of list.messages ?? []) {
        if (m.id) messageIds.add(m.id);
      }
      if (list.historyId) latestHistoryId = String(list.historyId);
    };

    if (incremental && config.gmailHistoryId) {
      const historyQuery = new URLSearchParams({
        startHistoryId: String(config.gmailHistoryId),
        historyTypes: "messageAdded",
        maxResults: "100",
      });
      const historyRes = await googleApiRequest(
        accessToken,
        `https://gmail.googleapis.com/gmail/v1/users/me/history?${historyQuery.toString()}`
      );
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        for (const h of historyData.history ?? []) {
          for (const added of h.messagesAdded ?? []) {
            if (added.message?.id) messageIds.add(added.message.id);
          }
        }
        if (historyData.historyId) latestHistoryId = String(historyData.historyId);
      } else {
        await appendListMessages(25);
      }
    } else {
      await appendListMessages(25);
    }

    const senderWhitelist = new Set((config.senderWhitelist ?? []).map((s) => s.toLowerCase()));
    let processed = 0;
    let skipped = 0;

    for (const messageId of messageIds) {
      const msgRes = await googleApiRequest(
        accessToken,
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`
      );
      if (!msgRes.ok) {
        skipped++;
        continue;
      }
      const m = await msgRes.json();
      const snippet = m.snippet ?? "";
      const subject = m.payload?.headers?.find((h: { name: string }) => h.name === "Subject")?.value ?? "";
      const from = m.payload?.headers?.find((h: { name: string }) => h.name === "From")?.value ?? "";

      if (senderWhitelist.size > 0) {
        const sender = from.toLowerCase();
        const matched = Array.from(senderWhitelist).some((allowed) => sender.includes(allowed));
        if (!matched) {
          skipped++;
          continue;
        }
      }

      if (snippet.length > 50) {
        const externalId = `gmail-${messageId}`;
        const existing = await db
          .select()
          .from(executionEvent)
          .where(eq(executionEvent.externalId, externalId))
          .limit(1);
        if (existing.length === 0) {
          await db.insert(executionEvent).values({
            orgId,
            source: "gmail",
            type: "email",
            rawContent: `${subject}\n\n${snippet}`.slice(0, 50000),
            structuredMetadata: {
              messageId,
              threadId: m.threadId ?? null,
              subject,
              from,
              historyId: m.historyId ? String(m.historyId) : null,
            },
            externalId,
          });
          await insightQueue.add("insight-extraction", {
            orgId,
            text: snippet.slice(0, 8000),
            source: "gmail",
            sourceAttribution: `From Gmail: ${subject || "Email"} · ${new Date().toLocaleDateString()}`,
            externalId,
          });
          processed++;
        } else {
          skipped++;
        }
      } else {
        skipped++;
      }
    }

    await db
      .update(integration)
      .set({
        config: {
          ...config,
          gmailHistoryId: latestHistoryId ?? config.gmailHistoryId ?? null,
          lastSyncAt: new Date().toISOString(),
          syncEnabled: config.syncEnabled !== false,
        } as Record<string, unknown>,
        updatedAt: new Date(),
      })
      .where(eq(integration.id, integrationId));

    return { processed, skipped, checked: messageIds.size };
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
