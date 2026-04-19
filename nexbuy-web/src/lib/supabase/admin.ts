// Service Role Supabase client — bypasses RLS.
// ⚠️ 只在 server-side (API routes / Server Actions) 用。絕對不能送到 client。
// 使用場景：建單 (insert order + order_items 需要跨 user 操作)、admin 動作、guest appointment cancel。

import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";
import { getServerEnv } from "@/lib/env";

export function createAdminSupabase() {
  const serverEnv = getServerEnv();
  return createClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
