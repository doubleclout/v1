import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { integration } from "@doubleclout/db";
import { eq, and } from "drizzle-orm";
import { PublishingClient } from "./publishing-client";

export default async function PublishingPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return null;

  const dbUser = await db.query.user.findFirst({
    where: (u, { eq }) => eq(u.authUserId, authUser.id),
  });
  if (!dbUser) return null;

  const [linkedInInt] = await db.select().from(integration).where(and(eq(integration.orgId, dbUser.orgId), eq(integration.source, "linkedin"))).limit(1);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Publishing</h1>
        <p className="text-muted-foreground">
          Connect LinkedIn to publish drafts straight from Slack or the dashboard.
        </p>
      </div>

      <PublishingClient
        orgId={dbUser.orgId}
        linkedInConnected={!!linkedInInt}
        config={(linkedInInt?.config as { defaultVisibility?: string; hashtagsEnabled?: boolean }) ?? {}}
      />
    </div>
  );
}
