"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  importProductsAction,
  previewImportAction,
  type ImportResult,
  type PreviewResult,
} from "./actions";

const CSV_TEMPLATE = `name,slug,kind,price_cents,finished_stock,is_online_available,description,brand,face_shape,frame_size,material,color
經典玳瑁圓框,classic-tortoise-round,finished,128000,5,true,輕量醋酸纖維,Acetate Co.,圓形;橢圓,M,醋酸纖維,玳瑁
極簡金屬方框,minimal-metal-square,finished,98000,3,true,日本鈦金屬,Tokyo Frames,方形,L,金屬,金
`;

const TEMPLATE_DATA_URL =
  "data:text/csv;charset=utf-8," + encodeURIComponent(CSV_TEMPLATE);

const KIND_LABEL: Record<"finished" | "prescription_frame", string> = {
  finished: "成品",
  prescription_frame: "處方鏡架",
};

export function ImportForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [preview, previewAction, isPreviewing] = useActionState<
    PreviewResult | null,
    FormData
  >(previewImportAction, null);

  const [importState, importDispatcher, isImporting] = useActionState<
    ImportResult | null,
    FormData
  >(importProductsAction, null);
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function onConfirmImport() {
    const form = formRef.current;
    if (!form) return;
    const fd = new FormData(form);
    startTransition(() => {
      importDispatcher(fd);
      setConfirmOpen(false);
    });
  }

  // 在已成功 import 完之後不再顯示 preview 區塊
  const showPreviewBox = preview !== null && importState?.ok !== true;

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
        action={previewAction}
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
            disabled={isPreviewing || isImporting || isPending}
            className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground hover:file:bg-primary/90"
          />
          <p className="text-xs text-muted-foreground">
            按「解析預覽」會驗證欄位、檢查 DB 重複 slug，但<strong>不會寫入</strong>。
            預覽 OK 後再按「確認匯入」才實際寫入。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="submit"
            variant="outline"
            disabled={isPreviewing || isImporting || isPending}
          >
            {isPreviewing ? "解析中..." : "解析預覽"}
          </Button>
          {preview?.ok && (
            <Button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={isImporting || isPending}
            >
              {isImporting || isPending ? "匯入中..." : `確認匯入 ${preview.total} 筆`}
            </Button>
          )}
          <Link
            href="/admin/products"
            className="text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            ← 回商品清單
          </Link>
        </div>
      </form>

      {showPreviewBox && preview && <PreviewPanel preview={preview} />}
      {importState && <ResultPanel result={importState} />}

      {confirmOpen && preview?.ok && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        >
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-lg">
            <h2 className="text-lg font-semibold">
              確認匯入 {preview.total} 筆商品？
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              預覽通過、DB 沒有重複 slug。送出後會直接寫入。
              如果預覽到送出之間有人改了 DB，匯入仍會 all-or-nothing：失敗就完全不寫。
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmOpen(false)}
                disabled={isImporting || isPending}
              >
                取消
              </Button>
              <Button
                type="button"
                onClick={onConfirmImport}
                disabled={isImporting || isPending}
              >
                {isImporting || isPending ? "匯入中..." : "確認匯入"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PreviewPanel({ preview }: { preview: PreviewResult }) {
  if (!preview.ok) {
    return (
      <section className="space-y-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
        <h2 className="font-medium text-destructive">
          預覽失敗（{preview.errors.length} 個錯誤）
        </h2>
        <ul className="space-y-1.5 text-muted-foreground">
          {preview.errors.slice(0, 50).map((e, i) => (
            <li key={i}>
              {e.line > 0 && <span className="font-mono">Line {e.line}</span>}
              {e.slug && (
                <span className="ml-2 font-mono text-xs">「{e.slug}」</span>
              )}
              <span className="ml-2">{e.message}</span>
            </li>
          ))}
          {preview.errors.length > 50 && (
            <li>… 還有 {preview.errors.length - 50} 個錯誤未列出</li>
          )}
        </ul>
        <p className="text-xs text-muted-foreground">
          修好 CSV 後再按一次「解析預覽」。
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm">
      <h2 className="font-medium text-emerald-700 dark:text-emerald-400">
        預覽通過：將新增 {preview.total} 筆商品
      </h2>
      <div className="overflow-x-auto rounded-md border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/40 text-left text-xs text-muted-foreground">
              <th className="px-3 py-2 font-medium">商品名</th>
              <th className="px-3 py-2 font-medium">slug</th>
              <th className="px-3 py-2 font-medium">類型</th>
              <th className="px-3 py-2 text-right font-medium">售價</th>
              <th className="px-3 py-2 text-right font-medium">庫存</th>
            </tr>
          </thead>
          <tbody>
            {preview.sample.map((r, i) => (
              <tr key={i} className="border-t">
                <td className="px-3 py-2">{r.name}</td>
                <td className="px-3 py-2 font-mono text-xs">{r.slug}</td>
                <td className="px-3 py-2">{KIND_LABEL[r.kind]}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  ${(r.price_cents / 100).toLocaleString("zh-TW")}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {r.finished_stock ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {preview.total > preview.sample.length && (
        <p className="text-xs text-muted-foreground">
          只顯示前 {preview.sample.length} 筆 — 共 {preview.total} 筆。
        </p>
      )}
    </section>
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
        修好 CSV 後再按「解析預覽」一次。匯入是 all-or-nothing：任一錯都不寫入。
      </p>
    </section>
  );
}
