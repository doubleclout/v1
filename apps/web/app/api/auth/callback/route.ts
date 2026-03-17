import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { org, user } from "@doubleclout/db";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  // Create redirect response first so Supabase can set session cookies on it
  let redirectTo = `${origin}/login?error=auth`;
  const response = NextResponse.redirect(redirectTo);

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options as object)
        );
      },
    },
  });

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const authUserId = data.user.id;
      const email = data.user.email ?? "";
      const meta = data.user.user_metadata ?? {};
      const firstName = meta.given_name ?? meta.first_name ?? meta.full_name?.split(" ")[0] ?? null;
      const lastName = (meta.family_name ?? meta.last_name ?? meta.full_name?.split(" ").slice(1).join(" ")) || null;
      const avatarUrl = meta.avatar_url ?? meta.picture ?? null;
      const phone = meta.phone ?? null;

      const existingUser = await db.query.user.findFirst({
        where: (u, { eq }) => eq(u.authUserId, authUserId),
      });

      if (!existingUser) {
        const workspaceName = firstName
          ? `${firstName}'s Workspace`
          : `${email.split("@")[0]}'s Workspace`;
        const [newOrg] = await db
          .insert(org)
          .values({ name: workspaceName })
          .returning();

        if (newOrg) {
          await db.insert(user).values({
            orgId: newOrg.id,
            email,
            authUserId,
            firstName,
            lastName,
            avatarUrl,
            phone,
          });
          redirectTo = `${origin}/dashboard/sources?onboarding=1`;
        } else {
          redirectTo = `${origin}${next}`;
        }
      } else {
        // Only fill in empty profile fields from Google — never overwrite user-set data (e.g. custom avatar)
        const profileUpdate: { firstName?: string; lastName?: string; avatarUrl?: string; phone?: string } = {};
        if (firstName != null && !existingUser.firstName?.trim()) profileUpdate.firstName = firstName;
        if (lastName != null && !existingUser.lastName?.trim()) profileUpdate.lastName = lastName;
        if (avatarUrl != null && !existingUser.avatarUrl?.trim()) profileUpdate.avatarUrl = avatarUrl;
        if (phone != null && !existingUser.phone?.trim()) profileUpdate.phone = phone;
        if (Object.keys(profileUpdate).length > 0) {
          await db.update(user).set(profileUpdate).where(eq(user.authUserId, authUserId));
        }
        redirectTo = `${origin}${next}`;
      }

      const successResponse = NextResponse.redirect(redirectTo);
      for (const cookie of response.cookies.getAll()) {
        successResponse.cookies.set(cookie.name, cookie.value);
      }
      return successResponse;
    }
  }

  return response;
}
