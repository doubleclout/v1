import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

async function getUserWithTimeout(task: Promise<unknown>, timeoutMs = 2500) {
  return await Promise.race([
    task,
    new Promise<"timeout">((resolve) => {
      setTimeout(() => resolve("timeout"), timeoutMs);
    }),
  ]);
}

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options as object)
        );
      },
    },
  });

  try {
    // Avoid hard site outages when Supabase auth is slow/unreachable.
    await getUserWithTimeout(supabase.auth.getUser(), 2500);
  } catch (error) {
    console.error("middleware.supabase.getUser failed", error);
  }

  return response;
}
