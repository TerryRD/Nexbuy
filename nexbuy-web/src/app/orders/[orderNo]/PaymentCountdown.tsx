"use client";

import { useState, useEffect } from "react";

const DEADLINE_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface PaymentCountdownProps {
  createdAt: string; // ISO datetime string
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function formatRemaining(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/**
 * Client component that counts down to the 24h payment deadline.
 * Hydration-safe: initial remaining is null until mounted (avoids SSR/CSR mismatch).
 */
export function PaymentCountdown({ createdAt }: PaymentCountdownProps) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const deadline = new Date(createdAt).getTime() + DEADLINE_MS;

    function tick() {
      setRemaining(deadline - Date.now());
    }

    tick(); // populate immediately after mount
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [createdAt]);

  const isExpired = remaining !== null && remaining <= 0;

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">付款倒數</span>
      {remaining === null ? (
        // Pre-mount placeholder — same layout to prevent CLS
        <span className="font-mono text-sm text-muted-foreground">--:--:--</span>
      ) : isExpired ? (
        <span className="text-sm text-muted-foreground">
          付款期限已過，請聯絡門市
        </span>
      ) : (
        <span className="font-mono text-sm font-medium tabular-nums">
          {formatRemaining(remaining)}
        </span>
      )}
    </div>
  );
}
