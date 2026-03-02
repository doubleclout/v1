import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-3xl font-semibold text-foreground">Doubleclout</h1>
        <p className="text-muted-foreground">
          Execution intelligence for growth teams
        </p>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90"
          >
            Sign in
          </Link>
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-lg border border-border hover:bg-accent"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
