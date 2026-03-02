"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { org as orgSchema } from "@doubleclout/db";

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

export function Sidebar({ org }: { org: typeof orgSchema.$inferSelect }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="flex w-64 flex-col border-r border-border bg-card">
      <div className="border-b border-border p-6">
        <Link href="/dashboard" className="block">
          <h2 className="font-semibold text-lg tracking-tight text-foreground">Doubleclout</h2>
        </Link>
        <p className="mt-1 text-sm text-muted-foreground truncate">{org.name}</p>
        <span className="mt-2 inline-block rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {org.plan}
        </span>
      </div>
      <nav className="flex-1 space-y-0.5 p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-4">
        <button
          type="button"
          onClick={handleSignOut}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
