import "server-only";
import { getServerEnv } from "@/lib/env";
import { publicEnv } from "@/lib/env";

// IndexNow（https://www.indexnow.org/）：一次推送 URL 給 Bing / Yandex /
// Naver / Yep / Seznam，不用任何帳號註冊。Google 不在 partner 名單但
// 我們同步走 sitemap.xml + Search Console。
//
// 設定：
//   1. 產一組 8–128 字元 hex key（線上產生器或 `openssl rand -hex 16`）
//   2. INDEXNOW_KEY=... 寫進 Vercel env
//   3. 部署後 https://your.site/api/seo/indexnow-key 應該能 GET 拿到 key
//   4. 任何時候呼叫 indexNowPing(['https://your.site/products/foo']) 通知更新
//
// 沒設 INDEXNOW_KEY 時整個 helper 變 no-op，不影響其他流程。

const INDEXNOW_ENDPOINT = "https://api.indexnow.org/IndexNow";

interface IndexNowResult {
  ok: boolean;
  status: number;
  reason?: string;
  count: number;
}

/**
 * Submit URLs to IndexNow. Best-effort — fire-and-forget recommended at call
 * sites（不要 await，搜尋引擎收信慢一點不影響 admin 的回應時間）。
 */
export async function indexNowPing(urls: string[]): Promise<IndexNowResult> {
  const env = getServerEnv();
  if (!env.INDEXNOW_KEY) {
    return { ok: false, status: 0, reason: "no-key", count: 0 };
  }
  if (urls.length === 0) {
    return { ok: true, status: 200, reason: "empty", count: 0 };
  }

  const host = new URL(publicEnv.NEXT_PUBLIC_APP_URL).hostname;
  const keyLocation = `${publicEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/api/seo/indexnow-key`;

  // 同一站只能一次最多 10000 URL；MVP 用不完
  const payload = {
    host,
    key: env.INDEXNOW_KEY,
    keyLocation,
    urlList: urls.slice(0, 10000),
  };

  try {
    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
      // 5s timeout — 別讓 admin server action 卡很久
      signal: AbortSignal.timeout(5000),
    });
    return {
      ok: res.ok,
      status: res.status,
      count: payload.urlList.length,
      reason: res.ok ? undefined : await res.text().catch(() => "unknown"),
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      reason: err instanceof Error ? err.message : String(err),
      count: 0,
    };
  }
}

/**
 * 給 admin server action / cron 用。fire-and-forget — 失敗只 log，不丟給
 * caller 處理。
 */
export function pingProductUrls(slugs: string[]): void {
  if (slugs.length === 0) return;
  const base = publicEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const urls = [
    `${base}/products`,
    ...slugs.map((s) => `${base}/products/${s}`),
  ];
  // 不 await — 讓 caller 立刻回應使用者
  indexNowPing(urls)
    .then((r) => {
      if (r.ok) {
        console.log(
          `[indexnow] pinged ${r.count} URLs OK (status=${r.status})`,
        );
      } else if (r.reason !== "no-key") {
        console.warn(
          `[indexnow] ping failed: status=${r.status} reason=${r.reason}`,
        );
      }
    })
    .catch((err) => console.error("[indexnow] unexpected:", err));
}
