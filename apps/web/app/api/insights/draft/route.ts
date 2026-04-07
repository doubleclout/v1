import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { draft, insight } from "@doubleclout/db";
import { and, eq } from "@doubleclout/db";

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const dbUser = await db.query.user.findFirst({
    where: (u, { eq: userEq }) => userEq(u.authUserId, authUser.id),
  });

  if (!dbUser) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as { insightId?: string } | null;
  const insightId = body?.insightId;
  if (!insightId) {
    return NextResponse.json({ error: "insight_id_required" }, { status: 400 });
  }

  const [insightRow] = await db
    .select({ id: insight.id })
    .from(insight)
    .where(and(eq(insight.id, insightId), eq(insight.orgId, dbUser.orgId)))
    .limit(1);
  if (!insightRow) {
    return NextResponse.json({ error: "insight_not_found" }, { status: 404 });
  }

  await db
    .delete(draft)
    .where(and(eq(draft.orgId, dbUser.orgId), eq(draft.insightId, insightId)));
  await db
    .update(insight)
    .set({ status: "internal", updatedAt: new Date() })
    .where(eq(insight.id, insightId));

  return NextResponse.json({ ok: true, deleted: "all" });
}
