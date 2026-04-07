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
    <header className="sticky top-0 z-10 flex h-16 items-start justify-end bg-[#fafaf9] px-6 pt-4">
      <button
        type="button"
        onClick={handleSignOut}
        className="text-sm font-medium leading-none text-zinc-600 transition-colors hover:text-zinc-900"
      >
        Sign out
      </button>
    </header>
  );
}
