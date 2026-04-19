import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createTestClient,
  resetAppointmentTables,
  seedSlot,
} from "./helpers/supabase";

let client: SupabaseClient;

beforeAll(() => {
  client = createTestClient();
});

beforeEach(async () => {
  await resetAppointmentTables(client);
});

describe("book_appointment RPC", () => {
  it("creates appointment when slot has capacity", async () => {
    const slotId = await seedSlot(client);

    const { data, error } = await client.rpc("book_appointment", {
      p_slot_id: slotId,
      p_customer_name: "Terry Test",
      p_customer_email: "terry@test.local",
      p_customer_phone: "0912345678",
    });

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data?.[0].appointment_id).toBeTruthy();
    expect(data?.[0].cancel_token).toHaveLength(32); // 16 bytes hex

    // slot.booked_count 應該 +1
    const { data: slot } = await client
      .from("appointment_slots")
      .select("booked_count")
      .eq("id", slotId)
      .single();
    expect(slot?.booked_count).toBe(1);
  });

  it("rejects booking when slot is full", async () => {
    const slotId = await seedSlot(client, { capacity: 1 });

    // 先填滿
    await client.rpc("book_appointment", {
      p_slot_id: slotId,
      p_customer_name: "First",
      p_customer_email: "first@test.local",
      p_customer_phone: "0900000001",
    });

    // 第二次應該炸
    const { error } = await client.rpc("book_appointment", {
      p_slot_id: slotId,
      p_customer_name: "Second",
      p_customer_email: "second@test.local",
      p_customer_phone: "0900000002",
    });

    expect(error).toBeTruthy();
    expect(error?.message).toContain("SLOT_FULL");
  });

  it("rejects booking on inactive slot", async () => {
    const slotId = await seedSlot(client, { isActive: false });

    const { error } = await client.rpc("book_appointment", {
      p_slot_id: slotId,
      p_customer_name: "Test",
      p_customer_email: "test@test.local",
      p_customer_phone: "0900000003",
    });

    expect(error).toBeTruthy();
    expect(error?.message).toContain("SLOT_FULL");
  });

  it("rejects booking on past slot", async () => {
    const slotId = await seedSlot(client, { daysFromToday: -1 });

    const { error } = await client.rpc("book_appointment", {
      p_slot_id: slotId,
      p_customer_name: "Test",
      p_customer_email: "test@test.local",
      p_customer_phone: "0900000004",
    });

    expect(error).toBeTruthy();
    expect(error?.message).toContain("SLOT_FULL");
  });

  /**
   * ⚠️ CRITICAL: 此測試是整個預約系統的防線。
   *
   * 10 個 request 同時打同一個 capacity=1 的 slot，應該只有 1 個成功、9 個拿到 SLOT_FULL。
   *
   * 如果這個測試失敗：
   * - Postgres 的 atomic UPDATE + WHERE 沒發揮作用
   * - book_appointment 的 plpgsql 函式有邏輯 bug
   * - 朋友的店會有雙預約、顧客到店發現重複，信任崩潰
   *
   * 不要 skip 這個測試。不要把它降級成 smoke test。
   * 如果它變慢，加 timeout 不要削減 concurrency。
   */
  it("CRITICAL: only 1 of 10 concurrent bookings succeeds on capacity=1", async () => {
    const slotId = await seedSlot(client, { capacity: 1 });

    const bookings = Array.from({ length: 10 }, (_, i) =>
      client.rpc("book_appointment", {
        p_slot_id: slotId,
        p_customer_name: `User ${i}`,
        p_customer_email: `user${i}@test.local`,
        p_customer_phone: `09${String(i).padStart(8, "0")}`,
      }),
    );

    const results = await Promise.all(bookings);
    const successes = results.filter((r) => r.error === null);
    const slotFulls = results.filter((r) =>
      r.error?.message.includes("SLOT_FULL"),
    );

    expect(successes).toHaveLength(1);
    expect(slotFulls).toHaveLength(9);

    // 一個 appointment 被寫入
    const { count } = await client
      .from("appointments")
      .select("*", { count: "exact", head: true });
    expect(count).toBe(1);

    // slot.booked_count 只 +1
    const { data: slot } = await client
      .from("appointment_slots")
      .select("booked_count")
      .eq("id", slotId)
      .single();
    expect(slot?.booked_count).toBe(1);
  });

  it("allows multiple bookings up to capacity", async () => {
    const slotId = await seedSlot(client, { capacity: 3 });

    for (let i = 0; i < 3; i++) {
      const { error } = await client.rpc("book_appointment", {
        p_slot_id: slotId,
        p_customer_name: `User ${i}`,
        p_customer_email: `user${i}@test.local`,
        p_customer_phone: `09${String(i).padStart(8, "0")}`,
      });
      expect(error).toBeNull();
    }

    // 第 4 個應該炸
    const { error } = await client.rpc("book_appointment", {
      p_slot_id: slotId,
      p_customer_name: "Fourth",
      p_customer_email: "fourth@test.local",
      p_customer_phone: "0900000099",
    });
    expect(error?.message).toContain("SLOT_FULL");
  });
});
