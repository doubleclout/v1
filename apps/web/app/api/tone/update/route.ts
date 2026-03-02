import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { toneConfig } from "@doubleclout/db";
import { eq } from "@doubleclout/db";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await db.query.user.findFirst({
    where: (u, { eq }) => eq(u.authUserId, authUser.id),
  });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await request.json();
  const { defaultTone, customNotes, activeVoiceId } = body as { defaultTone?: string; customNotes?: string; activeVoiceId?: string };

  const validTones = ["educational", "insightful", "tactical", "contrarian", "reflective", "executive_summary"] as const;
  const tone: (typeof validTones)[number] = defaultTone && validTones.includes(defaultTone as any) ? (defaultTone as (typeof validTones)[number]) : "educational";

  const [existing] = await db.select().from(toneConfig).where(eq(toneConfig.orgId, dbUser.orgId)).limit(1);

  if (existing) {
    await db
      .update(toneConfig)
      .set({
        defaultTone: tone,
        customNotes: customNotes ?? "",
        activeVoiceId: activeVoiceId ?? "my_voice",
        updatedAt: new Date(),
      })
      .where(eq(toneConfig.orgId, dbUser.orgId));
  } else {
    await db.insert(toneConfig).values({
      orgId: dbUser.orgId,
      defaultTone: tone,
      customNotes: customNotes ?? "",
      activeVoiceId: activeVoiceId ?? "my_voice",
    });
  }

  return NextResponse.json({ success: true });
}
