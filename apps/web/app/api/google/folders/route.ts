import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { integration } from "@doubleclout/db";
import { and, eq } from "@doubleclout/db";
import { getGoogleAccessTokenForIntegration } from "@/lib/google-server";

export async function GET(request: Request) {
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
  if (!googleInt) {
    return NextResponse.json({ error: "Google not connected" }, { status: 400 });
  }

  const accessToken = await getGoogleAccessTokenForIntegration(googleInt.id);
  if (!accessToken) {
    return NextResponse.json({ error: "Google token unavailable" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const parentId = searchParams.get("parentId");
  const q = parentId
    ? `'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
    : "'root' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false";
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      q
    )}&fields=files(id,name,parents),nextPageToken&pageSize=200&orderBy=name_natural&supportsAllDrives=true&includeItemsFromAllDrives=true`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) {
    const details = await res.text().catch(() => "");
    console.error("[api/google/folders] failed", { status: res.status, details });
    return NextResponse.json(
      { error: `Failed to fetch folders (${res.status})`, details: details.slice(0, 400) },
      { status: 502 }
    );
  }
  const data = await res.json();
  return NextResponse.json({ folders: data.files ?? [] });
}
