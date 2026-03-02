import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  real,
  varchar,
  pgEnum,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enable pgvector - run manually: CREATE EXTENSION IF NOT EXISTS vector;
// For embedding column we use real[] or custom type - Drizzle doesn't have native vector
// Using jsonb for embedding for portability; migrate to vector when needed

export const planEnum = pgEnum("plan", ["free", "pro", "team", "enterprise"]);
export const integrationSourceEnum = pgEnum("integration_source", [
  "slack",
  "zoom",
  "google",
  "gmail",
  "linkedin",
  "github",
]);
export const insightStatusEnum = pgEnum("insight_status", [
  "pending",
  "draft_generated",
  "published",
  "internal",
  "ignored",
]);
export const publicationStatusEnum = pgEnum("publication_status", [
  "pending",
  "published",
  "failed",
]);
export const toneEnum = pgEnum("tone", [
  "educational",
  "insightful",
  "tactical",
  "contrarian",
  "reflective",
  "executive_summary",
]);
export const draftVariationEnum = pgEnum("draft_variation", [
  "educational",
  "tactical",
  "reflective",
]);

export const org = pgTable("org", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slackTeamId: text("slack_team_id").unique(),
  plan: planEnum("plan").notNull().default("free"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const user = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => org.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  authUserId: text("auth_user_id").unique(), // Supabase auth.users.id
  slackUserId: text("slack_user_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const integration = pgTable("integration", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => org.id, { onDelete: "cascade" }),
  source: integrationSourceEnum("source").notNull(),
  config: jsonb("config").$type<Record<string, unknown>>().default({}),
  tokens: jsonb("tokens").$type<Record<string, string>>(), // Encrypted OAuth tokens
  status: text("status").notNull().default("active"), // active, disconnected, error
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const executionEvent = pgTable("execution_event", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => org.id, { onDelete: "cascade" }),
  source: integrationSourceEnum("source").notNull(),
  type: text("type").notNull(), // message, transcript, doc, email
  actors: jsonb("actors").$type<string[]>().default([]),
  rawContent: text("raw_content").notNull(),
  structuredMetadata: jsonb("structured_metadata").$type<Record<string, unknown>>().default({}),
  sensitivityScore: real("sensitivity_score").default(0),
  embedding: jsonb("embedding").$type<number[]>(), // pgvector: use real[] in migration
  externalId: text("external_id"), // Slack message ID, Zoom recording ID, etc.
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insight = pgTable("insight", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => org.id, { onDelete: "cascade" }),
  executionEventIds: jsonb("execution_event_ids").$type<string[]>().notNull().default([]),
  summary: text("summary").notNull(),
  confidence: real("confidence").notNull(),
  sensitivity: text("sensitivity").notNull(), // low, moderate, high
  status: insightStatusEnum("status").notNull().default("pending"),
  slackChannelId: text("slack_channel_id"),
  slackMessageTs: text("slack_message_ts"),
  sourceAttribution: text("source_attribution"), // "From #product-planning · 2 days ago"
  tags: jsonb("tags").$type<string[]>().default([]), // ["Customer Success", "Product"]
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const draft = pgTable("draft", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => org.id, { onDelete: "cascade" }),
  insightId: uuid("insight_id")
    .notNull()
    .references(() => insight.id, { onDelete: "cascade" }),
  variation: draftVariationEnum("variation").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const publication = pgTable("publication", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => org.id, { onDelete: "cascade" }),
  draftId: uuid("draft_id")
    .notNull()
    .references(() => draft.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(), // linkedin, slack
  status: publicationStatusEnum("status").notNull().default("pending"),
  publishedAt: timestamp("published_at"),
  errorMessage: text("error_message"),
  externalId: text("external_id"), // LinkedIn post URN
  metrics: jsonb("metrics").$type<{ impressions?: number; likes?: number; comments?: number }>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const billingSubscription = pgTable("billing_subscription", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => org.id, { onDelete: "cascade" })
    .unique(),
  dodoCustomerId: text("dodo_customer_id"),
  dodoSubscriptionId: text("dodo_subscription_id"),
  plan: planEnum("plan").notNull().default("free"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sensitivityConfig = pgTable("sensitivity_config", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => org.id, { onDelete: "cascade" })
    .unique(),
  toggles: jsonb("toggles").$type<Record<string, unknown>>().default({}),
  redactionStrictness: text("redaction_strictness").notNull().default("moderate"), // low, moderate, high
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const toneConfig = pgTable("tone_config", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => org.id, { onDelete: "cascade" })
    .unique(),
  defaultTone: toneEnum("default_tone").notNull().default("educational"),
  customNotes: text("custom_notes"),
  activeVoiceId: text("active_voice_id"), // "my_voice" | "casual_friday" | creator id
  voices: jsonb("voices").$type<Record<string, { name: string; description: string; style?: string }>>().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const orgRetention = pgTable("org_retention", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => org.id, { onDelete: "cascade" })
    .unique(),
  retentionDays: integer("retention_days").notNull().default(30), // 7, 30, 90
  deleteTranscriptsAfter: boolean("delete_transcripts_after").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => org.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  userId: uuid("user_id").references(() => user.id),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  source: text("source"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const orgRelations = relations(org, ({ many }) => ({
  users: many(user),
  integrations: many(integration),
  executionEvents: many(executionEvent),
  insights: many(insight),
  drafts: many(draft),
  publications: many(publication),
  billingSubscription: many(billingSubscription),
  sensitivityConfig: many(sensitivityConfig),
  toneConfig: many(toneConfig),
  auditLogs: many(auditLog),
}));

export const userRelations = relations(user, ({ one }) => ({
  org: one(org),
}));

export const integrationRelations = relations(integration, ({ one }) => ({
  org: one(org),
}));

export const executionEventRelations = relations(executionEvent, ({ one }) => ({
  org: one(org),
}));

export const insightRelations = relations(insight, ({ one, many }) => ({
  org: one(org),
  drafts: many(draft),
}));

export const draftRelations = relations(draft, ({ one, many }) => ({
  org: one(org),
  insight: one(insight),
  publications: many(publication),
}));

export const publicationRelations = relations(publication, ({ one }) => ({
  org: one(org),
  draft: one(draft),
}));
