"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
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

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const getSupabase = () => {
    if (!supabaseRef.current) supabaseRef.current = createClient();
    return supabaseRef.current;
  };

  useEffect(() => {
    getSupabase().auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isSupabaseConfigured()) {
      setError("Supabase is not configured.");
      return;
    }
    const pwdErr = validatePassword(password);
    if (pwdErr) {
      setError(pwdErr);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const { error } = await getSupabase().auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setSuccess(true);
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 1500);
    setLoading(false);
  };

  if (hasSession === null) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-[#fafaf9] p-4">
        <div className="text-sm text-zinc-600">Loading...</div>
      </main>
    );
  }

  if (!hasSession) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-[#fafaf9] p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-zinc-600">Invalid or expired reset link. Please request a new one.</p>
            <Link href="/forgot-password" className="mt-4 inline-block text-[var(--accent)] font-medium hover:underline">
              Request new reset link
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#fafaf9] p-4">
      <div className="mb-8 flex items-center gap-2 font-display text-lg font-semibold text-zinc-900">
        <Image src="/dc_logo.svg" alt="DoubleClout" width={32} height={32} className="h-8 w-8" unoptimized />
        DoubleClout
      </div>
      <Card className="w-full max-w-md border-zinc-200/80 bg-white shadow-xl rounded-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-display font-semibold text-zinc-900">Set new password</CardTitle>
          <CardDescription>
            Enter your new password below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="rounded-lg bg-green-50 border border-green-200 p-4">
              <p className="font-semibold text-green-800">Password updated successfully.</p>
              <p className="mt-1 text-sm text-green-700">Redirecting to dashboard...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New password <span className="text-red-500">*</span></Label>
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
                <Label htmlFor="confirmPassword">Confirm password <span className="text-red-500">*</span></Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-10"
                  required
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full bg-[var(--accent)] hover:opacity-90">
                {loading ? "Updating..." : "Update password"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
