// Suspense fallback for /products/[slug].
//
// 跟最終 PDP layout 一致：左側單張大圖 + 右側標籤 / 標題 / 價格 / 描述 /
// 動作按鈕。沒對齊的 skeleton 切到實際內容那一瞬間視覺跳很大，QA 看起
// 來像 broken。

export default function ProductDetailLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="grid gap-8 md:grid-cols-2">
        {/* 商品圖（單張正方形）*/}
        <div className="aspect-square animate-pulse overflow-hidden rounded-lg border border-border/60 bg-muted" />

        {/* 右側資訊欄 */}
        <div className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
              <div className="h-4 w-20 animate-pulse rounded bg-muted/70" />
            </div>
            <div className="h-9 w-3/4 animate-pulse rounded bg-muted md:h-10" />
            <div className="h-7 w-24 animate-pulse rounded bg-muted" />
          </div>

          <div className="space-y-2 pt-2">
            <div className="h-3 w-full animate-pulse rounded bg-muted" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />
            <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />
          </div>

          <div className="pt-2">
            <div className="h-11 w-full animate-pulse rounded-md bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
