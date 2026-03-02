#!/usr/bin/env node
/**
 * Add all Doubleclout env vars to Vercel project.
 * Requires: VERCEL_TOKEN, and either VERCEL_PROJECT_ID or project name "v1"
 * Run: VERCEL_TOKEN=xxx node scripts/vercel-env.mjs
 */
const PROJECT = process.env.VERCEL_PROJECT_ID || "v1";
const TEAM = process.env.VERCEL_TEAM_ID || process.env.VERCEL_ORG_ID;
const TOKEN = process.env.VERCEL_TOKEN;

const ENV_VARS = [
  { key: "NEXT_PUBLIC_SUPABASE_URL", value: "https://bafowilqrykdwycgpnbd.supabase.co", type: "plain" },
  { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", value: "sb_publishable_iKkF_x8fjhlbIWF0JYC8QQ_lxEs3QY2", type: "plain" },
  { key: "SUPABASE_SERVICE_ROLE_KEY", value: process.env.SUPABASE_SERVICE_ROLE_KEY || "", type: "secret" },
  { key: "DATABASE_URL", value: process.env.DATABASE_URL || "", type: "secret" },
  { key: "NEXT_PUBLIC_APP_URL", value: process.env.NEXT_PUBLIC_APP_URL || "https://doubleclout.com", type: "plain" },
  { key: "GITHUB_CLIENT_ID", value: process.env.GITHUB_CLIENT_ID || "", type: "secret" },
  { key: "GITHUB_CLIENT_SECRET", value: process.env.GITHUB_CLIENT_SECRET || "", type: "secret" },
  { key: "SLACK_CLIENT_ID", value: process.env.SLACK_CLIENT_ID || "", type: "secret" },
  { key: "SLACK_CLIENT_SECRET", value: process.env.SLACK_CLIENT_SECRET || "", type: "secret" },
  { key: "SLACK_BOT_TOKEN", value: process.env.SLACK_BOT_TOKEN || "", type: "secret" },
  { key: "SLACK_SIGNING_SECRET", value: process.env.SLACK_SIGNING_SECRET || "", type: "secret" },
  { key: "ZOOM_CLIENT_ID", value: process.env.ZOOM_CLIENT_ID || "", type: "secret" },
  { key: "ZOOM_CLIENT_SECRET", value: process.env.ZOOM_CLIENT_SECRET || "", type: "secret" },
  { key: "ZOOM_VERIFICATION_TOKEN", value: process.env.ZOOM_VERIFICATION_TOKEN || "", type: "secret" },
  { key: "GOOGLE_CLIENT_ID", value: process.env.GOOGLE_CLIENT_ID || "", type: "secret" },
  { key: "GOOGLE_CLIENT_SECRET", value: process.env.GOOGLE_CLIENT_SECRET || "", type: "secret" },
  { key: "LINKEDIN_CLIENT_ID", value: process.env.LINKEDIN_CLIENT_ID || "", type: "secret" },
  { key: "LINKEDIN_CLIENT_SECRET", value: process.env.LINKEDIN_CLIENT_SECRET || "", type: "secret" },
  { key: "OPENAI_API_KEY", value: process.env.OPENAI_API_KEY || "", type: "secret" },
  { key: "ANTHROPIC_API_KEY", value: process.env.ANTHROPIC_API_KEY || "", type: "secret" },
  { key: "REDIS_URL", value: process.env.REDIS_URL || "", type: "secret" },
  { key: "UPSTASH_REDIS_REST_URL", value: process.env.UPSTASH_REDIS_REST_URL || "", type: "secret" },
  { key: "UPSTASH_REDIS_REST_TOKEN", value: process.env.UPSTASH_REDIS_REST_TOKEN || "", type: "secret" },
  { key: "DODO_API_KEY", value: process.env.DODO_API_KEY || "", type: "secret" },
  { key: "DODO_WEBHOOK_SECRET", value: process.env.DODO_WEBHOOK_SECRET || "", type: "secret" },
  { key: "CRON_SECRET", value: process.env.CRON_SECRET || "", type: "secret" },
];

async function main() {
  if (!TOKEN) {
    console.error("VERCEL_TOKEN required");
    process.exit(1);
  }
  const url = TEAM
    ? `https://api.vercel.com/v10/projects/${PROJECT}/env?teamId=${TEAM}`
    : `https://api.vercel.com/v10/projects/${PROJECT}/env`;
  for (const v of ENV_VARS) {
    const body = {
      key: v.key,
      value: v.value,
      type: v.type,
      target: ["production", "preview", "development"],
    };
    const res = await fetch(`${url}${url.includes("?") ? "&" : "?"}upsert=true`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error(`Failed ${v.key}:`, await res.text());
    } else {
      console.log(`Added ${v.key}`);
    }
  }
}

main().catch(console.error);
