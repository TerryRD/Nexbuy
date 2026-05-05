"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteProduct } from "./actions";

interface Props {
  productId: string;
  productName: string;
}

export function DeleteProductButton({ productId, productName }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onConfirm() {
    const fd = new FormData();
    fd.set("id", productId);
    startTransition(async () => {
      await deleteProduct(fd);
      setIsOpen(false);
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="text-destructive"
        onClick={() => setIsOpen(true)}
        disabled={isPending}
      >
        {isPending ? "刪除中…" : "刪除"}
      </Button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="del-product-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        >
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-lg">
            <h2 id="del-product-title" className="text-lg font-semibold">
              確定刪除「{productName}」？
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              採軟刪除：商品在前後台都看不到，也不能下單，但歷史訂單 / 預約資料保留。
              要復原請聯絡技術人員。
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isPending}
              >
                取消
              </Button>
              <Button
                type="button"
                onClick={onConfirm}
                disabled={isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isPending ? "刪除中…" : "確認刪除"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
