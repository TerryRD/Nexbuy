import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth/safe-next";

// Handles both:
// - OAuth redirect (?code=... after Google sign-in)
// - Email-confirmation links from Supabase (also ?code=... in PKCE flow)
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const sb = await createServerSupabase();
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=callback`);
}
