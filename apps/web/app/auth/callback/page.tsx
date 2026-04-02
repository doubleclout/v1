"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Legacy redirect: OAuth and email confirmation now use /api/auth/callback.
 * If someone lands here with a code (old link, etc.), redirect to the API route.
 */
function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/dashboard";

    if (code) {
      const params = new URLSearchParams({ code, next });
      window.location.replace(`/api/auth/callback?${params.toString()}`);
      return;
    }

    router.replace("/login");
  }, [searchParams, router]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#fafaf9] p-4">
      <div className="text-sm text-zinc-600">Redirecting...</div>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex flex-col items-center justify-center bg-[#fafaf9] p-4">
          <div className="text-sm text-zinc-600">Redirecting...</div>
        </main>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
