"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";

const createSchema = z
  .object({
    date: z.iso.date(),
    start_time: z.string().regex(/^\d{2}:\d{2}$/),
    end_time: z.string().regex(/^\d{2}:\d{2}$/),
    capacity: z.coerce.number().int().min(1).max(20),
  })
  .refine((d) => d.end_time > d.start_time, {
    message: "end_time must be after start_time",
    path: ["end_time"],
  });

export async function createSlot(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const parsed = createSchema.safeParse({
    date: formData.get("date"),
    start_time: formData.get("start_time"),
    end_time: formData.get("end_time"),
    capacity: formData.get("capacity"),
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: `格式錯誤:${first?.message ?? "檢查欄位"}` };
  }

  const sb = await createServerSupabase();
  const { error } = await sb.from("appointment_slots").insert({
    date: parsed.data.date,
    start_time: `${parsed.data.start_time}:00`,
    end_time: `${parsed.data.end_time}:00`,
    capacity: parsed.data.capacity,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "這個日期 + 開始時間的 slot 已經存在。" };
    }
    console.error("createSlot failed:", error);
    return { error: "新增失敗:" + error.message };
  }

  revalidatePath("/admin/slots");
  return {};
}

const toggleSchema = z.object({
  id: z.uuid(),
  is_active: z.enum(["true", "false"]),
});

export async function toggleSlotActive(formData: FormData): Promise<void> {
  const parsed = toggleSchema.safeParse({
    id: formData.get("id"),
    is_active: formData.get("is_active"),
  });
  if (!parsed.success) throw new Error("INVALID_INPUT");

  const sb = await createServerSupabase();
  const { error } = await sb
    .from("appointment_slots")
    .update({ is_active: parsed.data.is_active === "true" })
    .eq("id", parsed.data.id);

  if (error) {
    console.error("toggleSlotActive failed:", error);
    throw new Error("UPDATE_FAILED");
  }
  revalidatePath("/admin/slots");
}

// ---------------------------------------------------------------------------
// 批次新增：給定起始日 + 週數 + weekday 集合 + 時段集合 + capacity，一次塞。
// ---------------------------------------------------------------------------

const TIME_RE = /^\d{2}:\d{2}$/;

const bulkSchema = z.object({
  start_date: z.iso.date(),
  weeks: z.coerce.number().int().min(1).max(12),
  weekdays: z.array(z.coerce.number().int().min(0).max(6)).min(1),
  times: z.array(z.string().regex(TIME_RE)).min(1).max(12),
  duration_minutes: z.coerce.number().int().min(15).max(180),
  capacity: z.coerce.number().int().min(1).max(20),
});

export interface BulkCreateResult {
  error?: string;
  inserted?: number;
  skipped?: number;
}

export async function bulkCreateSlots(
  _prev: BulkCreateResult | null,
  formData: FormData,
): Promise<BulkCreateResult> {
  // FormData 沒辦法直接吐 array，前端用多個同名 input 提交，這裡用 getAll
  const raw = {
    start_date: formData.get("start_date"),
    weeks: formData.get("weeks"),
    weekdays: formData.getAll("weekdays").map((v) => Number(v)),
    times: formData.getAll("times").map((v) => v.toString()),
    duration_minutes: formData.get("duration_minutes") ?? "60",
    capacity: formData.get("capacity"),
  };

  const parsed = bulkSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: `格式錯誤：${first?.message ?? "檢查欄位"}` };
  }

  const { start_date, weeks, weekdays, times, duration_minutes, capacity } =
    parsed.data;
  const wantedWeekdays = new Set(weekdays);

  // 預先把每個時段算成 start/end string
  const slotTimes = times.map((t) => {
    const [hh, mm] = t.split(":").map((s) => Number(s));
    const startMin = hh * 60 + mm;
    const endMin = startMin + duration_minutes;
    if (endMin >= 24 * 60) {
      return null; // 超過半夜，跳掉
    }
    const eh = Math.floor(endMin / 60);
    const em = endMin % 60;
    const fmt = (n: number) => n.toString().padStart(2, "0");
    return {
      start_time: `${t}:00`,
      end_time: `${fmt(eh)}:${fmt(em)}:00`,
    };
  }).filter((s): s is { start_time: string; end_time: string } => s !== null);

  // 從 start_date 起跑 7×weeks 天，挑符合 weekday 的日子
  const rows: {
    date: string;
    start_time: string;
    end_time: string;
    capacity: number;
  }[] = [];

  // start_date 是 "YYYY-MM-DD"。用 UTC 走天數避免時區漂移；再用 Asia/Taipei
  // 算 weekday，因為店家在台灣。為簡化：JS Date 的 getDay() 在 UTC 跟本地
  // 都是 0=日，台灣只比 UTC 早，差天數的機率很低，這裡用 UTC + getUTCDay。
  const [y, m, d] = start_date.split("-").map((s) => Number(s));
  const startUtc = Date.UTC(y, m - 1, d);
  const totalDays = weeks * 7;
  for (let i = 0; i < totalDays; i++) {
    const t = new Date(startUtc + i * 86400000);
    const wd = t.getUTCDay(); // 0=日 1=一 ... 6=六
    if (!wantedWeekdays.has(wd)) continue;
    const yy = t.getUTCFullYear();
    const mm = String(t.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(t.getUTCDate()).padStart(2, "0");
    const dateStr = `${yy}-${mm}-${dd}`;
    for (const st of slotTimes) {
      rows.push({
        date: dateStr,
        start_time: st.start_time,
        end_time: st.end_time,
        capacity,
      });
    }
  }

  if (rows.length === 0) {
    return { error: "套件範圍內沒有符合 weekday 的日期，沒東西可塞。" };
  }

  // unique(date, start_time) 已存在 → 用 upsert ignore-on-conflict 拿到「跳幾筆」
  const sb = await createServerSupabase();
  const { data, error } = await sb
    .from("appointment_slots")
    .upsert(rows, { onConflict: "date,start_time", ignoreDuplicates: true })
    .select("id");

  if (error) {
    console.error("bulkCreateSlots failed:", error);
    return { error: "新增失敗：" + error.message };
  }

  const inserted = data?.length ?? 0;
  const skipped = rows.length - inserted;

  revalidatePath("/admin/slots");
  return { inserted, skipped };
}
