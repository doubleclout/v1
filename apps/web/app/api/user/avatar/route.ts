import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { user } from "@doubleclout/db";
import { eq } from "@doubleclout/db";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await db.query.user.findFirst({
    where: (u, { eq }) => eq(u.authUserId, authUser.id),
  });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file || !file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Valid image file required" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${authUser.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
  const avatarUrl = urlData.publicUrl;

  await db.update(user).set({ avatarUrl }).where(eq(user.id, dbUser.id));

  return NextResponse.json({ avatarUrl });
}
