import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { org, user } from "@doubleclout/db";
import { Sidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { SetReturningCookie } from "@/components/dashboard/set-returning-cookie";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/login");
  }

  let dbUser = await db.query.user.findFirst({
    where: (u, { eq }) => eq(u.authUserId, authUser.id),
    with: { org: true },
  });

  // Create org + user for new sign-ups (email/password flow doesn't go through OAuth callback)
  if (!dbUser) {
    const email = authUser.email ?? "";
    const [newOrg] = await db
      .insert(org)
      .values({ name: `${email.split("@")[0]}'s Workspace` })
      .returning();

    if (newOrg) {
      const [newUser] = await db
        .insert(user)
        .values({
          orgId: newOrg.id,
          email,
          authUserId: authUser.id,
        })
        .returning();

      if (newUser) {
        dbUser = await db.query.user.findFirst({
          where: (u, { eq }) => eq(u.id, newUser.id),
          with: { org: true },
        });
      }
    }
  }

  if (!dbUser || !dbUser.org) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#fafaf9]">
      <SetReturningCookie />
      <Sidebar org={dbUser.org} user={dbUser} />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <DashboardHeader />
        <main className="flex-1">
          <div className="p-6 max-w-5xl mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
