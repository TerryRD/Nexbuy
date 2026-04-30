// Per-route IP rate limiting backed by Upstash Redis.
//
// Why Upstash: it's the standard serverless-friendly Redis on Vercel and the
// free tier (10k commands/day) covers MVP traffic with room to spare. The
// `Ratelimit` package supports sliding windows out of the box.
//
// Required env vars (production):
//   UPSTASH_REDIS_REST_URL
//   UPSTASH_REDIS_REST_TOKEN
//
// Dev / preview: when those env vars are absent, `limit()` returns `{ ok: true }`
// for every request — i.e. the limiter no-ops. This keeps `pnpm dev` working
// without provisioning Redis and means tests don't need to mock anything.
// In production a startup warning is logged so a misconfiguration is loud.

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type Window = `${number} ${"s" | "m" | "h"}`;

function makeLimiter(prefix: string, requests: number, window: Window): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        `[ratelimit] UPSTASH_REDIS_REST_URL/TOKEN not set — '${prefix}' limiter is a no-op in production.`,
      );
    }
    return null;
  }

  return new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(requests, window),
    analytics: true,
    prefix: `nexbuy:${prefix}`,
  });
}

// Tunables: 5/minute is roughly "a careful human doing things by hand"; anything
// faster than that is a script. 30/hour catches a determined abuser who paces
// themselves. Both apply per IP; the more restrictive one wins.
const appointmentsMinute = makeLimiter("appointments:m", 5, "1 m");
const appointmentsHour = makeLimiter("appointments:h", 30, "1 h");
const ordersMinute = makeLimiter("orders:m", 5, "1 m");
const ordersHour = makeLimiter("orders:h", 30, "1 h");

export type LimitResult = { ok: true } | { ok: false; retryAfterSec: number };

async function runAll(rls: (Ratelimit | null)[], key: string): Promise<LimitResult> {
  let earliestReset: number | null = null;

  for (const rl of rls) {
    if (!rl) continue;
    const r = await rl.limit(key);
    if (!r.success) {
      earliestReset =
        earliestReset === null ? r.reset : Math.min(earliestReset, r.reset);
    }
  }

  if (earliestReset === null) return { ok: true };
  const retryAfterSec = Math.max(1, Math.ceil((earliestReset - Date.now()) / 1000));
  return { ok: false, retryAfterSec };
}

export function rateLimitAppointments(ip: string): Promise<LimitResult> {
  return runAll([appointmentsMinute, appointmentsHour], ip);
}

export function rateLimitOrders(ip: string): Promise<LimitResult> {
  return runAll([ordersMinute, ordersHour], ip);
}

// Best-effort client IP from common proxy headers. On Vercel `x-forwarded-for`
// is set and the first hop is the real client. If nothing's present (e.g. local
// dev hitting the route directly) we fall back to a shared "anon" bucket so the
// limiter still applies — useful for catching a runaway local script.
export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip") ?? "anon";
}
