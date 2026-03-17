"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { setReturningCookie } from "@/lib/dc-cookie";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const getSupabase = () => {
    if (!supabaseRef.current) supabaseRef.current = createClient();
    return supabaseRef.current;
  };

  const handleGoogleSignIn = async () => {
    if (!isSupabaseConfigured()) {
      setError("Supabase is not configured. Add credentials to .env.local");
      return;
    }
    setReturningCookie();
    setError(null);
    setLoading(true);
    const { error } = await getSupabase().auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isSupabaseConfigured()) {
      setError("Supabase is not configured. Add credentials to .env.local");
      return;
    }

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    const { error } = await getSupabase().auth.signInWithPassword({
      email: trimmedEmail,
      password: trimmedPassword,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setReturningCookie();
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#fafaf9] p-4">
      <Link href="/" className="absolute top-6 left-6 text-sm font-display font-medium text-zinc-600 transition-colors hover:text-zinc-900">
        ← Back
      </Link>
      <div className="mb-8 flex items-center gap-2 font-display text-lg font-semibold text-zinc-900">
        <Image src="/dc_logo.svg" alt="Doubleclout" width={32} height={32} className="h-8 w-8" unoptimized />
        DoubleClout
      </div>
      <Card className="w-full max-w-md border-zinc-200/80 bg-white shadow-xl rounded-2xl transition-shadow duration-300 hover:shadow-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-display font-semibold text-zinc-900">Welcome back</CardTitle>
          <CardDescription className="text-zinc-600">
            Sign in to your DoubleClout workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isSupabaseConfigured() ? (
            <div className="space-y-4 pt-2">
              <p className="text-sm text-zinc-600">
                Supabase is not configured. Add <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs">.env.local</code> (copy from <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs">.env.example</code>).
              </p>
              <p className="text-xs text-zinc-500">
                Get these from your <a href="https://supabase.com/dashboard/project/_/settings/api" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">Supabase project settings</a>.
              </p>
            </div>
          ) : (
          <form className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 transition-colors disabled:opacity-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-zinc-500">Or continue with email</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10"
                required
              />
              <Link href="/forgot-password" className="text-xs text-[var(--accent)] hover:underline">
                Forgot password?
              </Link>
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <div className="space-y-4 pt-2">
              <Button
                type="submit"
                onClick={handleLogin}
                disabled={loading}
                className="w-full bg-[var(--accent)] hover:opacity-90 text-white"
              >
                {loading ? "Signing in..." : "Sign in"}
              </Button>
              <p className="text-center text-sm text-zinc-600">
                Don&apos;t have an account?{" "}
                <Link href="/sign-up" className="font-medium text-[var(--accent)] hover:underline">
                  Sign up
                </Link>
              </p>
            </div>
          </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
