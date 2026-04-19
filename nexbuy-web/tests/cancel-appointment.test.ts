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

async function bookOne(slotId: string, label = "User"): Promise<string> {
  const { data, error } = await client.rpc("book_appointment", {
    p_slot_id: slotId,
    p_customer_name: label,
    p_customer_email: `${label.toLowerCase()}@test.local`,
    p_customer_phone: "0912345678",
  });
  if (error) throw error;
  return data![0].cancel_token as string;
}

describe("cancel_appointment RPC", () => {
  it("cancels booked appointment and frees slot capacity", async () => {
    const slotId = await seedSlot(client, { capacity: 1 });
    const token = await bookOne(slotId);

    const { data, error } = await client.rpc("cancel_appointment", {
      p_cancel_token: token,
    });

    expect(error).toBeNull();
    expect(data).toBe(true);

    // slot.booked_count 回到 0
    const { data: slot } = await client
      .from("appointment_slots")
      .select("booked_count")
      .eq("id", slotId)
      .single();
    expect(slot?.booked_count).toBe(0);

    // 下一個人可以預約
    const nextToken = await bookOne(slotId, "Next");
    expect(nextToken).toHaveLength(32);
  });

  it("is idempotent: cancelling twice returns true, booked_count only -1 once", async () => {
    const slotId = await seedSlot(client, { capacity: 1 });
    const token = await bookOne(slotId);

    await client.rpc("cancel_appointment", { p_cancel_token: token });
    const { data, error } = await client.rpc("cancel_appointment", {
      p_cancel_token: token,
    });

    expect(error).toBeNull();
    expect(data).toBe(true);

    // booked_count 應該還是 0（不會變負）
    const { data: slot } = await client
      .from("appointment_slots")
      .select("booked_count")
      .eq("id", slotId)
      .single();
    expect(slot?.booked_count).toBe(0);
  });

  it("rejects invalid token", async () => {
    const { error } = await client.rpc("cancel_appointment", {
      p_cancel_token: "notarealtoken00000000000000000000",
    });

    expect(error).toBeTruthy();
    expect(error?.message).toContain("INVALID_TOKEN");
  });
});
