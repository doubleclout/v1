import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // Redirect auth codes from root to callback (Supabase email confirmation lands on /?code=...)
  const url = request.nextUrl;
  if (url.pathname === "/" && url.searchParams.has("code")) {
    const callbackUrl = new URL("/api/auth/callback", url.origin);
    callbackUrl.searchParams.set("code", url.searchParams.get("code")!);
    url.searchParams.forEach((v, k) => {
      if (k !== "code") callbackUrl.searchParams.set(k, v);
    });
    return NextResponse.redirect(callbackUrl);
  }
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
