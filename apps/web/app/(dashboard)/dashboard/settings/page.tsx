import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { eq } from "@doubleclout/db";
import { redirect } from "next/navigation";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const dbUser = await db.query.user.findFirst({
    where: (u, { eq }) => eq(u.authUserId, authUser.id),
    with: { org: true },
  });
  if (!dbUser) redirect("/login");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-zinc-600 mt-1">
          Update your profile picture, name, and contact info
        </p>
      </div>
      <SettingsForm user={dbUser} />
    </div>
  );
}
