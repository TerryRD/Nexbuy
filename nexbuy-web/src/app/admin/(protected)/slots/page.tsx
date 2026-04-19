import { createServerSupabase } from "@/lib/supabase/server";
import { formatDate, formatTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NewSlotForm } from "./NewSlotForm";
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

export default async function AdminSlotsPage() {
  const sb = await createServerSupabase();
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await sb
    .from("appointment_slots")
    .select("id, date, start_time, end_time, capacity, booked_count, is_active")
    .gte("date", today)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true })
    .limit(200);

  if (error) {
    console.error("slots list error:", error);
    throw new Error("Failed to load slots");
  }

  const rows = (data ?? []) as SlotRow[];
  const grouped = new Map<string, SlotRow[]>();
  for (const r of rows) {
    const list = grouped.get(r.date) ?? [];
    list.push(r);
    grouped.set(r.date, list);
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">時段維護</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          今天及未來的時段。booked/capacity 滿了顧客就看不到這個格子。
          把時段「停用」等於把它藏起來,已有的預約不會受影響。
        </p>
      </header>

      <NewSlotForm />

      {grouped.size === 0 ? (
        <p className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
          沒有未來的時段。用上面的表單新增一個。
        </p>
      ) : (
        <div className="space-y-5">
          {Array.from(grouped.entries()).map(([date, daySlots]) => (
            <section key={date} className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground">
                {formatDate(date)}
              </h2>
              <ul className="space-y-2">
                {daySlots.map((s) => (
                  <SlotRow key={s.id} slot={s} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function SlotRow({ slot }: { slot: SlotRow }) {
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
