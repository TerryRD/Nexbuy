import { ImportForm } from "./ImportForm";

export const metadata = {
  title: "批次匯入商品 — 精鋐眼鏡行 admin",
};

export default function AdminProductImportPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">批次匯入商品</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          上傳 CSV 一次新增多筆商品。圖片不在 CSV 範圍 —
          匯入後再到編輯頁加圖片。
        </p>
      </header>

      <ImportForm />
    </div>
  );
}
