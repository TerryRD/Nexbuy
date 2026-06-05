import { formatPrice } from "@/lib/format";

const THRESHOLD = 300000; // cents — free shipping threshold

interface FreeShippingBarProps {
  subtotalCents: number;
}

/**
 * Progress bar showing how close the cart is to the free-shipping threshold.
 * Plain component — no hooks required.
 */
export function FreeShippingBar({ subtotalCents }: FreeShippingBarProps) {
  const isFree = subtotalCents >= THRESHOLD;
  const pct = isFree ? 100 : Math.min(100, (subtotalCents / THRESHOLD) * 100);
  const remaining = THRESHOLD - subtotalCents;

  return (
    <div className="w-full space-y-1.5">
      {/* Status text */}
      <p className="text-sm">
        {isFree ? (
          <span className="text-primary font-medium">✓ 已符合免運門檻</span>
        ) : (
          <span className="text-muted-foreground">
            再買{" "}
            <span className="font-semibold text-foreground">
              {formatPrice(remaining)}
            </span>{" "}
            即可免運
          </span>
        )}
      </p>

      {/* Progress bar */}
      <div
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="免運進度"
        className="w-full h-2 bg-muted rounded-full overflow-hidden"
      >
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
