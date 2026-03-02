import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { toneConfig } from "@doubleclout/db";
import { eq } from "drizzle-orm";
import { ToneClient } from "./tone-client";

export default async function TonePage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return null;

  const dbUser = await db.query.user.findFirst({
    where: (u, { eq }) => eq(u.authUserId, authUser.id),
  });
  if (!dbUser) return null;

  const [config] = await db.select().from(toneConfig).where(eq(toneConfig.orgId, dbUser.orgId)).limit(1);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Tone Profile</h1>
        <p className="text-muted-foreground">
          Written in your voice. Set default tone and optional creator-inspired styles.
        </p>
      </div>

      <ToneClient
        orgId={dbUser.orgId}
        defaultTone={config?.defaultTone ?? "educational"}
        customNotes={config?.customNotes ?? ""}
        activeVoiceId={config?.activeVoiceId ?? "my_voice"}
      />
    </div>
  );
}
