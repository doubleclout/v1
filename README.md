# Doubleclout

Slack-native execution intelligence platform. **Better than Standout.** Multi-source ingestion (Slack, Zoom, Google Workspace, Gmail) → Execution normalization → Insight extraction → Sensitivity filtering → Draft generation (3 variations) → Human approval → LinkedIn publish.

## Tech Stack

- **Frontend:** Next.js 14 (App Router), TailwindCSS, shadcn/ui, Vercel
- **Backend:** Node.js (TypeScript), Drizzle ORM, Railway
- **Database:** Supabase Postgres (pgvector, RLS)
- **Auth:** Supabase Auth, Slack OAuth
- **Queue:** BullMQ, Upstash Redis
- **AI:** OpenAI, Anthropic (via `@doubleclout/ai`)

## Integrations

| Source | OAuth | Ingestion |
|--------|-------|-----------|
| Slack | Yes | Event API, selected channels |
| Zoom | Yes | Webhook `recording.transcript_completed` |
| Google Workspace | Yes | Drive/Docs API, folder selection |
| Gmail | Yes | Gmail API, labels/senders |
| GitHub | Yes | PRs, issues, releases → insights |
| LinkedIn | Yes | Publish from Slack modal or dashboard |

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in:

- **Supabase:** Create project at supabase.com. Get URL, anon key, service role key. Set `DATABASE_URL`.
- **Slack:** Create app at api.slack.com. Event Subscriptions → `https://your-domain/api/slack/events`. Interactivity → `https://your-domain/api/slack/interactions`. Slash Commands → `/arc-settings` → `https://your-domain/api/slack/commands`. OAuth redirect → `https://your-domain/api/slack/oauth/callback`.
- **Zoom:** Create app at marketplace.zoom.us. OAuth redirect → `https://your-domain/api/zoom/oauth/callback`. Webhook → `https://your-domain/api/webhooks/zoom` (subscribe to `recording.transcript_completed`).
- **Google:** Create OAuth client. Redirect URIs: `.../api/google/oauth/callback`, `.../api/gmail/oauth/callback`.
- **LinkedIn:** Create app. OAuth redirect → `https://your-domain/api/linkedin/oauth/callback`. Add Share on LinkedIn product.
- **GitHub:** Create OAuth app. Authorization callback URL → `https://your-domain/api/github/oauth/callback`. Set `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`.
- **Redis:** Upstash Redis for BullMQ. Set `REDIS_URL`.
- **AI:** `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`

### 3. Database migrations

Run `packages/db/drizzle/0000_init.sql` and `0001_add_insight_publication_tone_retention.sql` in Supabase SQL editor.

### 4. Run development

```bash
pnpm dev          # Next.js
pnpm worker       # BullMQ workers (separate terminal)
```

## Project structure

```
doubleclout/
├── apps/web/          # Next.js (API + Dashboard)
├── packages/
│   ├── db/            # Drizzle schema, migrations
│   ├── ai/            # extractInsight, generateDraft, applyRedaction
│   └── shared/        # Shared types
├── workers/           # BullMQ: slack, zoom, google, gmail, github, insight-extraction
└── .env.example
```

## Deployment

- **Vercel:** Deploy `apps/web`. Set env vars.
- **Railway:** Deploy workers with `pnpm worker`.
- **Cron:** Call `POST /api/cron/retention` with `Authorization: Bearer CRON_SECRET` for retention cleanup.
