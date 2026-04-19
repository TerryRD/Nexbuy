// Server Component / Server Action / Route Handler Supabase client.
// 走 cookie-based auth (Next.js cookies())，respects RLS。

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";

export async function createServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          try {
            toSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component 無法 set cookie — 這是預期行為。
            // 真的要 set cookie 時應該從 Server Action 或 Route Handler 呼叫。
          }
        },
      },
    },
  );
}
