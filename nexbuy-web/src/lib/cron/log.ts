import "server-only";

/**
 * 統一的 cron 包裝器。沒裝 Sentry 但要讓 Vercel Logs (https://vercel.com/docs/logs)
 * 能 grep / alert：所有 cron 出/入都印一行 `[cron] name=foo ok=true|false ms=N`
 * 結構化 log，再加上 cron-specific summary 欄位。
 *
 * Vercel Logs UI 可以用 `cron error` / `cron name=appointment-reminder ok=false`
 * 直接過濾。比 Sentry 簡單，零 deps、零外部相依、零成本。
 *
 * 使用：
 *   const result = await withCronLogging("appointment-reminder", async () => {
 *     return runAppointmentReminder();
 *   });
 *
 * 回傳值：sub-task 回什麼就什麼；包裝器只負責 log + rethrow（讓 route handler
 * 自行決定 status code）。
 */

interface CronLogContext {
  name: string;
  startedAt: number;
}

function fmtSummary(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export async function withCronLogging<T>(
  name: string,
  fn: () => Promise<T>,
): Promise<T> {
  const ctx: CronLogContext = { name, startedAt: Date.now() };
  console.log(`[cron] name=${name} event=start ts=${new Date().toISOString()}`);

  try {
    const result = await fn();
    const ms = Date.now() - ctx.startedAt;
    // result 形狀不固定 — 共用 summary 欄位避免訊息爆掉
    console.log(
      `[cron] name=${name} event=end ok=true ms=${ms} summary=${fmtSummary(result)}`,
    );
    return result;
  } catch (err) {
    const ms = Date.now() - ctx.startedAt;
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error(
      `[cron] name=${name} event=end ok=false ms=${ms} error=${JSON.stringify(message)}`,
    );
    if (stack) {
      console.error(`[cron] name=${name} stack=${stack}`);
    }
    throw err;
  }
}
