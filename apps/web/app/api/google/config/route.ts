import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { integration } from "@doubleclout/db";
import { and, eq } from "@doubleclout/db";

type GoogleConfig = {
  folderIds?: string[];
  includeMimeTypes?: string[];
  monitorDocs?: boolean;
  driveCursor?: string | null;
  lastSyncAt?: string | null;
  syncEnabled?: boolean;
};

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await db.query.user.findFirst({
    where: (u, { eq }) => eq(u.authUserId, authUser.id),
  });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const [googleInt] = await db
    .select()
    .from(integration)
    .where(and(eq(integration.orgId, dbUser.orgId), eq(integration.source, "google")))
    .limit(1);
  if (!googleInt) return NextResponse.json({ error: "Google not connected" }, { status: 400 });

  const config = (googleInt.config as GoogleConfig | undefined) ?? {};
  return NextResponse.json({
    folderIds: config.folderIds ?? [],
    includeMimeTypes: config.includeMimeTypes ?? [],
    monitorDocs: config.monitorDocs !== false,
    driveCursor: config.driveCursor ?? null,
    syncEnabled: config.syncEnabled !== false,
    lastSyncAt: config.lastSyncAt ?? null,
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await db.query.user.findFirst({
    where: (u, { eq }) => eq(u.authUserId, authUser.id),
  });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const [googleInt] = await db
    .select()
    .from(integration)
    .where(and(eq(integration.orgId, dbUser.orgId), eq(integration.source, "google")))
    .limit(1);
  if (!googleInt) return NextResponse.json({ error: "Google not connected" }, { status: 400 });

  const payload = (await request.json().catch(() => ({}))) as {
    folderIds?: string[];
    syncEnabled?: boolean;
    includeMimeTypes?: string[];
    monitorDocs?: boolean;
  };

  const existing = (googleInt.config as GoogleConfig | undefined) ?? {};
  const nextConfig: GoogleConfig = {
    ...existing,
    folderIds: Array.isArray(payload.folderIds)
      ? payload.folderIds.filter((id) => typeof id === "string" && id.length > 0)
      : existing.folderIds ?? [],
    syncEnabled: typeof payload.syncEnabled === "boolean" ? payload.syncEnabled : existing.syncEnabled ?? true,
    includeMimeTypes: Array.isArray(payload.includeMimeTypes)
      ? payload.includeMimeTypes.filter((m) => typeof m === "string" && m.length > 0)
      : existing.includeMimeTypes ?? [],
    monitorDocs: typeof payload.monitorDocs === "boolean" ? payload.monitorDocs : existing.monitorDocs ?? true,
  };

  await db
    .update(integration)
    .set({
      config: nextConfig as Record<string, unknown>,
      updatedAt: new Date(),
    })
    .where(eq(integration.id, googleInt.id));

  return NextResponse.json({ ok: true, config: nextConfig });
}
