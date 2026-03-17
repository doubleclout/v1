import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { user } from "@doubleclout/db";
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
  const { firstName, lastName, avatarUrl, phone } = body as {
    firstName?: string | null;
    lastName?: string | null;
    avatarUrl?: string | null;
    phone?: string | null;
  };

  if (!firstName?.trim()) return NextResponse.json({ error: "First name is required" }, { status: 400 });
  if (!lastName?.trim()) return NextResponse.json({ error: "Last name is required" }, { status: 400 });
  if (!phone?.trim()) return NextResponse.json({ error: "Phone number is required" }, { status: 400 });

  await db
    .update(user)
    .set({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      avatarUrl: avatarUrl?.trim() || null,
      phone: phone.trim(),
    })
    .where(eq(user.id, dbUser.id));

  return NextResponse.json({ success: true });
}
