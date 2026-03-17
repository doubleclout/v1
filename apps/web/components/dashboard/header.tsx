"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function DashboardHeader() {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-end border-b border-zinc-200/80 bg-white px-6">
      <button
        type="button"
        onClick={handleSignOut}
        className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
      >
        Sign out
      </button>
    </header>
  );
}
