"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCompare } from "@/lib/compare";

// /compare 是 server component，靠 URL `?ids=` 撈商品；CompareBar 的「比較」
// 連結會把 localStorage 的 id 帶進 URL。但若使用者直接打開 /compare（書籤、
// 上一頁、手動輸入），URL 就沒有 ids，server 拿到空陣列、頁面顯示 0/3，跟底部
// bar 顯示的數量對不起來。
//
// 解法：mount 後，若 URL 無 ids 但 localStorage 有，replace URL 把 ids 補上去 —
// server component 重新跑、頁面就同步。會有一次 hydration 後的 replace，視覺上
// 是「先 0/3 一瞬間 → 變成正確數量」，但避免靜止錯誤狀態。
export function CompareUrlSync() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ids } = useCompare();

  useEffect(() => {
    if (ids.length === 0) return;
    const urlIds = searchParams.get("ids") ?? "";
    if (urlIds) return;
    router.replace(`/compare?ids=${ids.join(",")}`);
  }, [ids, searchParams, router]);

  return null;
}
