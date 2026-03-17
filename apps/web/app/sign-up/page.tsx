"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { setReturningCookie } from "@/lib/dc-cookie";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function validatePassword(password: string): string | null {
  if (password.length < 6) return "Password must be at least 6 characters.";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one capital letter.";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number.";
  return null;
}

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const router = useRouter();
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const getSupabase = () => {
    if (!supabaseRef.current) supabaseRef.current = createClient();
    return supabaseRef.current;
  };

  const handleGoogleSignUp = async () => {
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setConfirmationSent(false);
    if (!isSupabaseConfigured()) {
      setError("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local");
      return;
    }

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError("Please enter your email and password.");
      return;
    }
    if (!trimmedFirstName) {
      setError("First name is required.");
      return;
    }
    if (!trimmedLastName) {
      setError("Last name is required.");
      return;
    }
    if (!trimmedPhone) {
      setError("Phone number is required.");
      return;
    }
    const pwdErr = validatePassword(trimmedPassword);
    if (pwdErr) {
      setError(pwdErr);
      return;
    }

    setLoading(true);

    const { data, error } = await getSupabase().auth.signUp({
      email: trimmedEmail,
      password: trimmedPassword,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        data: {
          first_name: trimmedFirstName,
          last_name: trimmedLastName,
          phone: trimmedPhone,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // If email confirmation is required, user won't have a session yet
    if (data.user && !data.session) {
      setReturningCookie();
      setConfirmationSent(true);
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
        <Image src="/dc_logo.svg" alt="DoubleClout" width={32} height={32} className="h-8 w-8" unoptimized />
        DoubleClout
      </div>
      <Card className="w-full max-w-md border-zinc-200/80 bg-white shadow-xl rounded-2xl transition-shadow duration-300 hover:shadow-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-display font-semibold text-zinc-900">Create your account</CardTitle>
        </CardHeader>
        <CardContent>
          {confirmationSent ? (
            <div className="space-y-6 py-4">
              <div className="rounded-lg bg-[var(--accent)]/5 border border-[var(--accent)]/20 p-4">
                <h3 className="font-display font-semibold text-zinc-900">Confirmation email sent</h3>
                <p className="mt-2 text-sm text-zinc-600">
                  We&apos;ve sent a confirmation link to your inbox. Please check your email and click the link to verify your account.
                </p>
                <p className="mt-2 text-sm text-zinc-500">
                  Once confirmed, you&apos;ll be able to sign in and access your dashboard.
                </p>
              </div>
              <Link
                href="/login"
                className="block w-full rounded-lg bg-[var(--accent)] py-3 text-center font-semibold text-white hover:opacity-90 transition-opacity"
              >
                Go to sign in
              </Link>
              <p className="text-center text-sm text-zinc-500">
                Didn&apos;t receive the email? Check your spam folder or{" "}
                <button type="button" onClick={() => setConfirmationSent(false)} className="font-medium text-[var(--accent)] hover:underline">
                  try again
                </button>
              </p>
            </div>
          ) : !isSupabaseConfigured() ? (
            <div className="space-y-4 pt-2">
              <p className="text-sm text-zinc-600">
                Supabase is not configured. Add <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs">.env.local</code> (copy from <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs">.env.example</code>).
              </p>
              <p className="text-xs text-zinc-500">
                Get these from your <a href="https://supabase.com/dashboard/project/_/settings/api" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">Supabase project settings</a>.
              </p>
            </div>
          ) : (
          <form onSubmit={handleSignUp} className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 transition-colors disabled:opacity-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign up with Google
            </button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-zinc-500">Or continue with email</span>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name <span className="text-red-500">*</span></Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="h-10"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name <span className="text-red-500">*</span></Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="h-10"
                  required
                />
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
                placeholder="Min 6 characters, 1 uppercase letter, 1 number"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone number <span className="text-red-500">*</span></Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 234 567 8900"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-10"
                required
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--accent)] hover:opacity-90 text-white"
            >
              {loading ? "Creating account..." : "Create account"}
            </Button>
            <p className="text-center text-sm text-zinc-600">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-[var(--accent)] hover:underline">
                Sign in
              </Link>
            </p>
          </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
