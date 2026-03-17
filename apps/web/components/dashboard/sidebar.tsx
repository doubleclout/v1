"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { org as orgSchema, user as userSchema } from "@doubleclout/db";

const navItems = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/insights", label: "Insights" },
  { href: "/dashboard/sources", label: "Sources" },
  { href: "/dashboard/sensitivity", label: "Sensitivity Controls" },
  { href: "/dashboard/tone", label: "Tone Profile" },
  { href: "/dashboard/publishing", label: "Publishing" },
  { href: "/dashboard/billing", label: "Billing" },
  { href: "/dashboard/audit", label: "Audit Logs" },
  { href: "/dashboard/settings", label: "Settings" },
];

type UserWithOrg = typeof userSchema.$inferSelect & { org: typeof orgSchema.$inferSelect | null };

export function Sidebar({ org, user }: { org: typeof orgSchema.$inferSelect; user: UserWithOrg }) {
  const workspaceLabel = user?.firstName
    ? `${user.firstName}'s Workspace`
    : org.name;
  const pathname = usePathname();

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-zinc-200/80 bg-white h-screen overflow-y-auto">
      <div className="border-b border-zinc-200/80 p-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image src="/dc_logo.svg" alt="DoubleClout" width={28} height={28} className="h-7 w-7" unoptimized />
          <h2 className="font-display font-semibold text-lg tracking-tight text-zinc-900">DoubleClout</h2>
        </Link>
        <div className="mt-2 flex items-center gap-2">
          {user?.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt=""
              width={24}
              height={24}
              className="rounded-full object-cover shrink-0"
              unoptimized
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-medium text-zinc-500 shrink-0">
              {(user?.firstName ?? user?.email ?? "?")[0]?.toUpperCase()}
            </div>
          )}
          <p className="text-sm text-zinc-600 truncate flex-1 min-w-0" title={workspaceLabel}>{workspaceLabel}</p>
        </div>
        <span className="mt-2 inline-block rounded-md bg-[var(--accent)]/10 px-2 py-0.5 text-xs font-medium text-[var(--accent)]">
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
                  ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
