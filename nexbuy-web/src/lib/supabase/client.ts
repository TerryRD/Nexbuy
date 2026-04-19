// Browser (Client Component) Supabase client — respects RLS.
// 在 "use client" 組件裡用 createBrowserSupabase() 拿 client。

import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";

export function createBrowserSupabase() {
  return createBrowserClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
