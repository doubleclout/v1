"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const getSupabase = () => {
    if (!supabaseRef.current) supabaseRef.current = createClient();
    return supabaseRef.current;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isSupabaseConfigured()) {
      setError("Supabase is not configured.");
      return;
    }
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Please enter your email.");
      return;
    }
    setLoading(true);
    const { error } = await getSupabase().auth.resetPasswordForEmail(trimmed, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setSent(true);
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#fafaf9] p-4">
      <Link href="/login" className="absolute top-6 left-6 text-sm font-display font-medium text-zinc-600 hover:text-zinc-900">
        Back to sign in
      </Link>
      <div className="mb-8 flex items-center gap-2 font-display text-lg font-semibold text-zinc-900">
        <Image src="/dc_logo.svg" alt="DoubleClout" width={32} height={32} className="h-8 w-8" unoptimized />
        DoubleClout
      </div>
      <Card className="w-full max-w-md border-zinc-200/80 bg-white shadow-xl rounded-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-display font-semibold text-zinc-900">Forgot password?</CardTitle>
          <CardDescription>
            Enter your email and we will send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4 py-4">
              <div className="rounded-lg bg-[var(--accent)]/5 border border-[var(--accent)]/20 p-4">
                <h3 className="font-display font-semibold text-zinc-900">Check your email</h3>
                <p className="mt-2 text-sm text-zinc-600">
                  A verification link for resetting your password has been sent to your email.
                </p>
                <p className="mt-2 text-sm text-zinc-500">
                  Click the link in the email to set a new password. If you do not see it, check your spam folder.
                </p>
              </div>
              <Link href="/login" className="block w-full rounded-lg bg-[var(--accent)] py-3 text-center font-semibold text-white hover:opacity-90">
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full bg-[var(--accent)] hover:opacity-90">
                {loading ? "Sending..." : "Send reset link"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
