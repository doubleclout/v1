import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { HomePage } from "@/components/landing/home-page";

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const cookieStore = await cookies();
  const hasReturning = cookieStore.get("dc_returning")?.value === "1";

  const initialShowLogin = !!user || hasReturning;
  const initialCtaHref = user ? "/dashboard" : "/login";

  return <HomePage initialShowLogin={initialShowLogin} initialCtaHref={initialCtaHref} />;
}
