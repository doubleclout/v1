"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { org } from "@doubleclout/db";

const navItems = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/insights", label: "Insights" },
  { href: "/dashboard/sources", label: "Sources" },
  { href: "/dashboard/sensitivity", label: "Sensitivity Controls" },
  { href: "/dashboard/tone", label: "Tone Profile" },
  { href: "/dashboard/publishing", label: "Publishing" },
  { href: "/dashboard/billing", label: "Billing" },
  { href: "/dashboard/audit", label: "Audit Logs" },
];

export function Sidebar({ org }: { org: typeof org.$inferSelect }) {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="w-64 border-r border-border bg-card text-card-foreground flex flex-col">
      <div className="p-6 border-b border-border">
        <h2 className="font-semibold text-lg">Doubleclout</h2>
        <p className="text-sm text-muted-foreground truncate">{org.name}</p>
        <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded bg-muted">
          {org.plan}
        </span>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block px-3 py-2 rounded-lg text-sm hover:bg-accent"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-border">
        <button
          type="button"
          onClick={handleSignOut}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
