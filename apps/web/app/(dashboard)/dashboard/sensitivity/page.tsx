import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { sensitivityConfig } from "@doubleclout/db";
import { eq } from "@doubleclout/db";
import { SensitivityClient } from "./sensitivity-client";

export default async function SensitivityPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return null;

  const dbUser = await db.query.user.findFirst({
    where: (u, { eq }) => eq(u.authUserId, authUser.id),
  });
  if (!dbUser) return null;

  const [config] = await db.select().from(sensitivityConfig).where(eq(sensitivityConfig.orgId, dbUser.orgId)).limit(1);

  const toggles = (config?.toggles as Record<string, string>) ?? {};
  const redactionStrictness = config?.redactionStrictness ?? "moderate";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Sensitivity Controls</h1>
        <p className="text-muted-foreground">
          Configure what data is allowed in published content. Safe by default.
        </p>
      </div>

      <SensitivityClient
        orgId={dbUser.orgId}
        initialToggles={toggles}
        initialStrictness={redactionStrictness}
      />
    </div>
  );
}
