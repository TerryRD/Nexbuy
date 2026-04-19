import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Test-only Supabase admin client.
 *
 * 安全守衛：
 * - URL 必須是 localhost / 127.0.0.1。如果指向 prod Supabase 會直接 throw。
 * - 測試會清 DB 資料，絕對不能讓它指向 prod。
 */
export function createTestClient(): SupabaseClient {
  const url = process.env.TEST_SUPABASE_URL;
  const serviceKey = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "TEST_SUPABASE_URL and TEST_SUPABASE_SERVICE_ROLE_KEY must be set. " +
        "Copy .env.test.example to .env.test.local and fill in values from `supabase status`.",
    );
  }

  if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/.test(url)) {
    throw new Error(
      `REFUSING to run tests against non-local Supabase: ${url}. ` +
        "Tests delete data. Only run against `supabase start` local stack.",
    );
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * 清空 appointments + appointment_slots。
 * 每個 test beforeEach 呼叫一次確保乾淨起跑點。
 */
export async function resetAppointmentTables(client: SupabaseClient) {
  // 順序：先清 children (appointments) 再清 parents (slots)
  const { error: apptErr } = await client
    .from("appointments")
    .delete()
    .gte("created_at", "1970-01-01");
  if (apptErr) throw apptErr;

  const { error: slotErr } = await client
    .from("appointment_slots")
    .delete()
    .gte("created_at", "1970-01-01");
  if (slotErr) throw slotErr;
}

/**
 * 建立一個明天 10:00 的 slot，capacity 可指定。
 */
export async function seedSlot(
  client: SupabaseClient,
  opts: { capacity?: number; isActive?: boolean; daysFromToday?: number } = {},
): Promise<string> {
  const { capacity = 1, isActive = true, daysFromToday = 1 } = opts;
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  const dateStr = date.toISOString().slice(0, 10);

  const { data, error } = await client
    .from("appointment_slots")
    .insert({
      date: dateStr,
      start_time: "10:00:00",
      end_time: "11:00:00",
      capacity,
      is_active: isActive,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id as string;
}
