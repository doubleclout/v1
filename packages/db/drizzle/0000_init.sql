-- Enable pgvector (run manually if needed: CREATE EXTENSION IF NOT EXISTS vector;)
-- For now using jsonb for embedding

CREATE TYPE "plan" AS ENUM ('free', 'pro', 'team', 'enterprise');
CREATE TYPE "integration_source" AS ENUM ('slack', 'zoom', 'google', 'gmail', 'linkedin');
CREATE TYPE "insight_status" AS ENUM ('pending', 'draft_generated', 'published', 'internal', 'ignored');
CREATE TYPE "publication_status" AS ENUM ('pending', 'published', 'failed');
CREATE TYPE "tone" AS ENUM ('educational', 'insightful', 'tactical', 'contrarian', 'reflective', 'executive_summary');
CREATE TYPE "draft_variation" AS ENUM ('educational', 'tactical', 'reflective');

CREATE TABLE "org" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "slack_team_id" text UNIQUE,
  "plan" "plan" NOT NULL DEFAULT 'free',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE "user" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "org"("id") ON DELETE CASCADE,
  "email" text NOT NULL,
  "auth_user_id" text UNIQUE,
  "slack_user_id" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE "integration" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "org"("id") ON DELETE CASCADE,
  "source" "integration_source" NOT NULL,
  "config" jsonb DEFAULT '{}',
  "tokens" jsonb,
  "status" text NOT NULL DEFAULT 'active',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE "execution_event" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "org"("id") ON DELETE CASCADE,
  "source" "integration_source" NOT NULL,
  "type" text NOT NULL,
  "actors" jsonb DEFAULT '[]',
  "raw_content" text NOT NULL,
  "structured_metadata" jsonb DEFAULT '{}',
  "sensitivity_score" real DEFAULT 0,
  "embedding" jsonb,
  "external_id" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE "insight" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "org"("id") ON DELETE CASCADE,
  "execution_event_ids" jsonb NOT NULL DEFAULT '[]',
  "summary" text NOT NULL,
  "confidence" real NOT NULL,
  "sensitivity" text NOT NULL,
  "status" "insight_status" NOT NULL DEFAULT 'pending',
  "slack_channel_id" text,
  "slack_message_ts" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE "draft" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "org"("id") ON DELETE CASCADE,
  "insight_id" uuid NOT NULL REFERENCES "insight"("id") ON DELETE CASCADE,
  "variation" "draft_variation" NOT NULL,
  "content" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE "publication" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "org"("id") ON DELETE CASCADE,
  "draft_id" uuid NOT NULL REFERENCES "draft"("id") ON DELETE CASCADE,
  "platform" text NOT NULL,
  "status" "publication_status" NOT NULL DEFAULT 'pending',
  "published_at" timestamp,
  "error_message" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE "billing_subscription" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL UNIQUE REFERENCES "org"("id") ON DELETE CASCADE,
  "dodo_customer_id" text,
  "dodo_subscription_id" text,
  "plan" "plan" NOT NULL DEFAULT 'free',
  "status" text NOT NULL DEFAULT 'active',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE "sensitivity_config" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL UNIQUE REFERENCES "org"("id") ON DELETE CASCADE,
  "toggles" jsonb DEFAULT '{}',
  "redaction_strictness" text NOT NULL DEFAULT 'moderate',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE "tone_config" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL UNIQUE REFERENCES "org"("id") ON DELETE CASCADE,
  "default_tone" "tone" NOT NULL DEFAULT 'educational',
  "custom_notes" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE "audit_log" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "org"("id") ON DELETE CASCADE,
  "action" text NOT NULL,
  "user_id" uuid REFERENCES "user"("id"),
  "metadata" jsonb DEFAULT '{}',
  "source" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);
