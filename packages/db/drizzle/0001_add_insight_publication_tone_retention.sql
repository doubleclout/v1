ALTER TABLE "insight" ADD COLUMN IF NOT EXISTS "source_attribution" text;
ALTER TABLE "insight" ADD COLUMN IF NOT EXISTS "tags" jsonb DEFAULT '[]';

ALTER TABLE "publication" ADD COLUMN IF NOT EXISTS "external_id" text;
ALTER TABLE "publication" ADD COLUMN IF NOT EXISTS "metrics" jsonb;

ALTER TABLE "tone_config" ADD COLUMN IF NOT EXISTS "active_voice_id" text;
ALTER TABLE "tone_config" ADD COLUMN IF NOT EXISTS "voices" jsonb DEFAULT '{}';

CREATE TABLE IF NOT EXISTS "org_retention" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL UNIQUE REFERENCES "org"("id") ON DELETE CASCADE,
  "retention_days" integer NOT NULL DEFAULT 30,
  "delete_transcripts_after" boolean DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
