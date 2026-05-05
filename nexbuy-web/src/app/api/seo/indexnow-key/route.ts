import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";

// IndexNow 規範：搜尋引擎收到 ping 後會先打 keyLocation URL 確認 key 一致。
// 我們把 key 放在 env 用 API route 服務，一改動 env 就生效，不用 redeploy
// 把 .txt 檔換掉。
//
// 回 plain text，body 就是 key 本身。沒設 env 一律 404 — 不洩漏「沒裝」
// 這個資訊也比較乾淨。

export const dynamic = "force-dynamic"; // 不要 cache，env 一改就要拿到新值

export async function GET() {
  const key = getServerEnv().INDEXNOW_KEY;
  if (!key) {
    return new NextResponse("Not Found", { status: 404 });
  }
  return new NextResponse(key, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
