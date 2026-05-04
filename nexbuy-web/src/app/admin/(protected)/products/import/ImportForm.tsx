"use client";

import { useActionState, useRef } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { importProductsAction, type ImportResult } from "./actions";

const CSV_TEMPLATE = `name,slug,kind,price_cents,finished_stock,is_online_available,description,brand,face_shape,frame_size,material,color
經典玳瑁圓框,classic-tortoise-round,finished,128000,5,true,輕量醋酸纖維,Acetate Co.,圓形;橢圓,M,醋酸纖維,玳瑁
極簡金屬方框,minimal-metal-square,finished,98000,3,true,日本鈦金屬,Tokyo Frames,方形,L,金屬,金
`;

const TEMPLATE_DATA_URL =
  "data:text/csv;charset=utf-8," + encodeURIComponent(CSV_TEMPLATE);

export function ImportForm() {
  const [state, action, isPending] = useActionState<
    ImportResult | null,
    FormData
  >(importProductsAction, null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="space-y-6">
      <section className="space-y-2 rounded-lg border bg-muted/30 p-4 text-sm">
        <h2 className="font-medium">CSV 格式</h2>
        <ul className="space-y-1 text-muted-foreground">
          <li>
            <strong>必填欄位</strong>：name / slug / kind / price_cents
            （kind=finished 還要 finished_stock）
          </li>
          <li>
            <strong>kind</strong>：<code>finished</code> 或{" "}
            <code>prescription_frame</code>
          </li>
          <li>
            <strong>price_cents</strong>：整數（NTD ×100，例 1280 元 → 128000）
          </li>
          <li>
            <strong>is_online_available</strong>：true / false（空白視為 true）
          </li>
          <li>
            <strong>face_shape</strong>：分號分隔多選（例：圓形;橢圓）
          </li>
          <li>
            <strong>frame_size</strong>：S / M / L
          </li>
          <li>UTF-8 編碼，第一列為 header；一次最多 500 列</li>
          <li>圖片不在 CSV 範圍 — 匯入後到編輯頁逐一上傳</li>
        </ul>
        <a
          href={TEMPLATE_DATA_URL}
          download="nexbuy-products-template.csv"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          下載 CSV 範本
        </a>
      </section>

      <form
        ref={formRef}
        action={action}
        className="space-y-4 rounded-lg border bg-card p-4"
      >
        <div className="space-y-2">
          <label htmlFor="csv-file" className="block text-sm font-medium">
            選擇 CSV 檔
          </label>
          <input
            id="csv-file"
            name="csv"
            type="file"
            accept=".csv,text/csv"
            required
            disabled={isPending}
            className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground hover:file:bg-primary/90"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? "匯入中..." : "匯入"}
          </Button>
          <Link
            href="/admin/products"
            className="text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            ← 回商品清單
          </Link>
        </div>
      </form>

      {state && <ResultPanel result={state} />}
    </div>
  );
}

function ResultPanel({ result }: { result: ImportResult }) {
  if (result.ok) {
    return (
      <section className="space-y-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm">
        <h2 className="font-medium text-emerald-700 dark:text-emerald-400">
          成功匯入 {result.inserted} 筆商品
        </h2>
        {result.insertedNames.length > 0 && (
          <ul className="space-y-0.5 text-muted-foreground">
            {result.insertedNames.slice(0, 20).map((n, i) => (
              <li key={i}>· {n}</li>
            ))}
            {result.insertedNames.length > 20 && (
              <li>… 共 {result.insertedNames.length} 筆</li>
            )}
          </ul>
        )}
        <Link
          href="/admin/products"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          回商品清單
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
      <h2 className="font-medium text-destructive">
        匯入失敗（{result.errors.length} 個錯誤）— 沒有任何商品被寫入
      </h2>
      <ul className="space-y-1.5 text-muted-foreground">
        {result.errors.slice(0, 50).map((e, i) => (
          <li key={i}>
            {e.line > 0 && <span className="font-mono">Line {e.line}</span>}
            {e.slug && (
              <span className="ml-2 font-mono text-xs">「{e.slug}」</span>
            )}
            <span className="ml-2">{e.message}</span>
          </li>
        ))}
        {result.errors.length > 50 && (
          <li>… 還有 {result.errors.length - 50} 個錯誤未列出</li>
        )}
      </ul>
      <p className="text-xs text-muted-foreground">
        修好 CSV 後再上傳一次。匯入是 all-or-nothing：任一錯都不寫入。
      </p>
    </section>
  );
}
