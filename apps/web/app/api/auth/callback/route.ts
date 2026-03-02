import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { org, user } from "@doubleclout/db";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const authUserId = data.user.id;
      const email = data.user.email ?? "";

      const existingUser = await db.query.user.findFirst({
        where: (u, { eq }) => eq(u.authUserId, authUserId),
      });

      if (!existingUser) {
        const [newOrg] = await db
          .insert(org)
          .values({ name: `${email.split("@")[0]}'s Workspace` })
          .returning();

        if (newOrg) {
          await db.insert(user).values({
            orgId: newOrg.id,
            email,
            authUserId,
          });
          return NextResponse.redirect(`${origin}/dashboard/sources?onboarding=1`);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
