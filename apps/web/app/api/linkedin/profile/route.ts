import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { integration } from "@doubleclout/db";
import { and, eq } from "@doubleclout/db";

export const dynamic = "force-dynamic";

type LinkedInUserInfo = {
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  sub?: string;
  headline?: string;
};

export async function GET() {
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

  const [linkedInInt] = await db
    .select()
    .from(integration)
    .where(and(eq(integration.orgId, dbUser.orgId), eq(integration.source, "linkedin")))
    .limit(1);

  const accessToken = (linkedInInt?.tokens as { access?: string } | null)?.access;
  if (!accessToken) {
    return NextResponse.json({ error: "linkedin_not_connected" }, { status: 404 });
  }

  const response = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    return NextResponse.json({ error: "profile_fetch_failed" }, { status: 502 });
  }

  const payload = (await response.json().catch(() => null)) as LinkedInUserInfo | null;
  const name =
    payload?.name ||
    [payload?.given_name, payload?.family_name].filter(Boolean).join(" ").trim() ||
    [dbUser.firstName, dbUser.lastName].filter(Boolean).join(" ").trim() ||
    dbUser.email;

  return NextResponse.json({
    profile: {
      name,
      headline: payload?.headline || "LinkedIn member",
      avatarUrl: payload?.picture || dbUser.avatarUrl || null,
    },
  });
}
