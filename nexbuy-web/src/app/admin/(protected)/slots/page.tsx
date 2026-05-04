import { createServerSupabase } from "@/lib/supabase/server";
import { formatDate, formatTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NewSlotForm } from "./NewSlotForm";
import { SlotsCalendar } from "./SlotsCalendar";
import { toggleSlotActive } from "./actions";

type SlotRow = {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  booked_count: number;
  is_active: boolean;
};

type SearchParams = Promise<{
  month?: string; // YYYY-MM
  day?: string; // YYYY-MM-DD
}>;

const MONTH_RE = /^\d{4}-\d{2}$/;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

function todayInTaipei(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * 給定 YYYY-MM，回傳要 fetch slot 的範圍：月格子的第一天（前月尾巴）
 * 與最後一天（次月開頭），都 inclusive。
 */
function calendarRange(month: string): { start: string; end: string } {
  const [y, m] = month.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const startWeekday = first.getUTCDay();
  const gridStart = new Date(first);
  gridStart.setUTCDate(1 - startWeekday);
  const gridEnd = new Date(gridStart);
  gridEnd.setUTCDate(gridStart.getUTCDate() + 41); // 6×7 = 42 cells
  return {
    start: gridStart.toISOString().slice(0, 10),
    end: gridEnd.toISOString().slice(0, 10),
  };
}

export default async function AdminSlotsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const today = todayInTaipei();
  const month =
    sp.month && MONTH_RE.test(sp.month) ? sp.month : today.slice(0, 7);
  const selectedDay = sp.day && DAY_RE.test(sp.day) ? sp.day : null;
  const { start, end } = calendarRange(month);

  const sb = await createServerSupabase();
  const { data, error } = await sb
    .from("appointment_slots")
    .select("id, date, start_time, end_time, capacity, booked_count, is_active")
    .gte("date", start)
    .lte("date", end)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    console.error("slots list error:", error);
    throw new Error("Failed to load slots");
  }

  const rows = (data ?? []) as SlotRow[];
  const slotsByDay = new Map<string, SlotRow[]>();
  for (const r of rows) {
    const list = slotsByDay.get(r.date) ?? [];
    list.push(r);
    slotsByDay.set(r.date, list);
  }

  const daySlots = selectedDay ? (slotsByDay.get(selectedDay) ?? []) : [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">時段維護</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          月曆顯示有時段的日子。點任一日看當日清單、新增時段。
          停用 = 顧客看不到，已預約不受影響。
        </p>
      </header>

      <SlotsCalendar
        month={month}
        today={today}
        selectedDay={selectedDay}
        slotsByDay={slotsByDay}
      />

      {selectedDay ? (
        <section className="space-y-4 rounded-lg border bg-card p-5">
          <header className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold">
              {formatDate(selectedDay)}
            </h2>
            <span className="text-xs text-muted-foreground">
              共 {daySlots.length} 個時段
            </span>
          </header>

          <NewSlotForm defaultDate={selectedDay} />

          {daySlots.length === 0 ? (
            <p className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
              這天還沒有時段。用上面的表單新增。
            </p>
          ) : (
            <ul className="space-y-2">
              {daySlots.map((s) => (
                <SlotRowItem key={s.id} slot={s} />
              ))}
            </ul>
          )}
        </section>
      ) : (
        <p className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
          點月曆上的任一日，下方會顯示當日時段並可新增。
        </p>
      )}
    </div>
  );
}

function SlotRowItem({ slot }: { slot: SlotRow }) {
  const full = slot.booked_count >= slot.capacity;
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3 text-sm">
      <div className="flex items-center gap-3">
        <span className="font-mono">
          {formatTime(slot.start_time)}–{formatTime(slot.end_time)}
        </span>
        <span className="text-muted-foreground">
          {slot.booked_count} / {slot.capacity}
        </span>
        {full && slot.is_active && <Badge variant="outline">已滿</Badge>}
        {!slot.is_active && <Badge variant="outline">停用</Badge>}
      </div>
      <form action={toggleSlotActive}>
        <input type="hidden" name="id" value={slot.id} />
        <input
          type="hidden"
          name="is_active"
          value={slot.is_active ? "false" : "true"}
        />
        <Button type="submit" size="sm" variant="outline">
          {slot.is_active ? "停用" : "啟用"}
        </Button>
      </form>
    </li>
  );
}
