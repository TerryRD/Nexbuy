import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// 純 SSR 月曆。月份 / 選中日都走 URL searchParams，不用 client state，
// 重整 / 後退 / 分享連結都會帶到正確的視圖。

interface SlotForCalendar {
  id: string;
  date: string; // YYYY-MM-DD
  is_active: boolean;
  capacity: number;
  booked_count: number;
}

interface Props {
  /** 顯示的月份，YYYY-MM */
  month: string;
  /** 今天（Asia/Taipei） */
  today: string;
  /** 選中日（可空） */
  selectedDay: string | null;
  /** 該月格子（含前後溢出日）內的所有 slot，依日期分桶 */
  slotsByDay: Map<string, SlotForCalendar[]>;
}

const WEEKDAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"];

export function SlotsCalendar({ month, today, selectedDay, slotsByDay }: Props) {
  const [yearStr, monthStr] = month.split("-");
  const year = Number(yearStr);
  const monthIdx = Number(monthStr) - 1; // 0-based

  const firstOfMonth = new Date(Date.UTC(year, monthIdx, 1));
  const startWeekday = firstOfMonth.getUTCDay(); // 0=Sun

  // 6×7 = 42 cells（含前月尾巴 / 次月開頭填補）
  const gridStart = new Date(firstOfMonth);
  gridStart.setUTCDate(1 - startWeekday);

  const cells: { iso: string; inMonth: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setUTCDate(gridStart.getUTCDate() + i);
    const iso = d.toISOString().slice(0, 10);
    cells.push({ iso, inMonth: d.getUTCMonth() === monthIdx });
  }

  const prevMonth = (() => {
    const d = new Date(Date.UTC(year, monthIdx - 1, 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  })();
  const nextMonth = (() => {
    const d = new Date(Date.UTC(year, monthIdx + 1, 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  })();
  const todayMonth = today.slice(0, 7);

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-1">
          <Link
            href={`/admin/slots?month=${prevMonth}`}
            className="inline-flex size-8 items-center justify-center rounded-md hover:bg-muted"
            aria-label="上個月"
          >
            <ChevronLeft className="size-4" />
          </Link>
          <Link
            href={`/admin/slots?month=${nextMonth}`}
            className="inline-flex size-8 items-center justify-center rounded-md hover:bg-muted"
            aria-label="下個月"
          >
            <ChevronRight className="size-4" />
          </Link>
          {month !== todayMonth && (
            <Link
              href={`/admin/slots?month=${todayMonth}`}
              className="ml-1 rounded-md px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              本月
            </Link>
          )}
        </div>
        <h2 className="text-sm font-medium tracking-tight">
          {year} 年 {monthIdx + 1} 月
        </h2>
        <Legend />
      </div>

      <div className="grid grid-cols-7 border-b text-xs text-muted-foreground">
        {WEEKDAY_LABELS.map((w, i) => (
          <div
            key={w}
            className={cn(
              "px-2 py-2 text-center",
              i === 0 && "text-rose-500/80",
              i === 6 && "text-sky-500/80",
            )}
          >
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((c, i) => {
          const slots = slotsByDay.get(c.iso) ?? [];
          const isToday = c.iso === today;
          const isSelected = c.iso === selectedDay;
          const dayNum = Number(c.iso.slice(8, 10));
          const isPast = c.iso < today;

          // 點選後 selectedDay 切到本日；同月才覆蓋 month，否則跳到該月
          const targetMonth = c.iso.slice(0, 7);
          const href = `/admin/slots?month=${targetMonth}&day=${c.iso}`;

          return (
            <Link
              key={i}
              href={href}
              className={cn(
                "min-h-[84px] border-b border-r p-1.5 text-left transition-colors hover:bg-muted/50",
                (i + 1) % 7 === 0 && "border-r-0",
                i >= 35 && "border-b-0",
                !c.inMonth && "bg-muted/20 text-muted-foreground/60",
                isPast && c.inMonth && "text-muted-foreground/70",
                isSelected && "ring-2 ring-primary ring-inset",
              )}
            >
              <div
                className={cn(
                  "mb-1 inline-flex size-6 items-center justify-center rounded-full text-xs",
                  isToday &&
                    "bg-primary font-semibold text-primary-foreground",
                )}
              >
                {dayNum}
              </div>
              <SlotDots slots={slots} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function SlotDots({ slots }: { slots: SlotForCalendar[] }) {
  if (slots.length === 0) return null;
  // 最多 5 顆 dot，多的用「+N」
  const visible = slots.slice(0, 5);
  const extra = slots.length - visible.length;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {visible.map((s) => {
        const full = s.booked_count >= s.capacity;
        const cls = !s.is_active
          ? "bg-muted-foreground/40"
          : full
            ? "bg-rose-500"
            : "bg-primary";
        return (
          <span
            key={s.id}
            className={cn("size-1.5 rounded-full", cls)}
            aria-hidden
          />
        );
      })}
      {extra > 0 && (
        <span className="text-[10px] text-muted-foreground">+{extra}</span>
      )}
    </div>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
      <LegendItem dotClass="bg-primary" label="可預約" />
      <LegendItem dotClass="bg-rose-500" label="已滿" />
      <LegendItem dotClass="bg-muted-foreground/40" label="停用" />
    </div>
  );
}

function LegendItem({ dotClass, label }: { dotClass: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn("size-1.5 rounded-full", dotClass)} aria-hidden />
      {label}
    </span>
  );
}
