import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { sensitivityConfig } from "@doubleclout/db";
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
  const { toggles, redactionStrictness } = body as { toggles?: Record<string, string>; redactionStrictness?: string };

  const [existing] = await db.select().from(sensitivityConfig).where(eq(sensitivityConfig.orgId, dbUser.orgId)).limit(1);

  if (existing) {
    await db
      .update(sensitivityConfig)
      .set({
        toggles: toggles ?? {},
        redactionStrictness: redactionStrictness ?? "moderate",
        updatedAt: new Date(),
      })
      .where(eq(sensitivityConfig.orgId, dbUser.orgId));
  } else {
    await db.insert(sensitivityConfig).values({
      orgId: dbUser.orgId,
      toggles: toggles ?? {},
      redactionStrictness: redactionStrictness ?? "moderate",
    });
  }

  return NextResponse.json({ success: true });
}
