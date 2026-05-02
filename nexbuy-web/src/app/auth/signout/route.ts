import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const sb = await createServerSupabase();
  await sb.auth.signOut();
  const { origin } = new URL(request.url);
  // 303 ensures the redirect uses GET on the destination
  return NextResponse.redirect(`${origin}/`, { status: 303 });
}
