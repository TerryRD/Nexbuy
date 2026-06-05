import type { OrderStatus } from "@/lib/order-status";
import { formatDate } from "@/lib/format";
import { Stepper } from "@/components/site/Stepper";

interface OrderStatusTrackerProps {
  status: OrderStatus;
  /** Full ISO timestamp from DB (e.g. "2026-04-20T03:21:45.123+00:00") or date-only string.
   * Sliced to date-only internally before passing to formatDate. */
  createdAt?: string;
}

const STAGES = ["待付款", "已付款", "已出貨", "已完成"];

/** Maps OrderStatus to the 4-stage tracker index (0–3). */
function toStageIndex(status: OrderStatus): number {
  switch (status) {
    case "pending_payment":
      return 0;
    case "paid":
    case "preparing":
      return 1;
    case "shipped":
      return 2;
    case "completed":
      return 3;
    default:
      return 0;
  }
}

/**
 * 4-stage order status tracker. Reuses <Stepper> for visual consistency.
 * Returns null for cancelled / refunded — the page handles those separately.
 * Plain component (no hooks).
 */
export function OrderStatusTracker({
  status,
  createdAt,
}: OrderStatusTrackerProps) {
  if (status === "cancelled" || status === "refunded") {
    return null;
  }

  const stageIndex = toStageIndex(status);

  return (
    <div className="w-full space-y-3">
      <Stepper steps={STAGES} current={stageIndex} />
      {createdAt && (
        <p className="text-xs text-muted-foreground text-center sm:text-left">
          訂單建立時間：{formatDate(createdAt.slice(0, 10))}
        </p>
      )}
    </div>
  );
}
