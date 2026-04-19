"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Props {
  token: string;
}

type Status = "idle" | "confirming" | "success" | "error";

export function CancelForm({ token }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function doCancel() {
    setErrorMsg(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/appointments/${token}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          if (body?.error === "INVALID_TOKEN") {
            setErrorMsg("連結無效,請聯絡門市。");
          } else if (body?.error === "CANNOT_CANCEL") {
            setErrorMsg("此預約狀態無法取消。");
          } else {
            setErrorMsg("系統錯誤,請稍後再試。");
          }
          setStatus("error");
          return;
        }
        setStatus("success");
      } catch (err) {
        console.error(err);
        setErrorMsg("網路異常,請重試。");
        setStatus("error");
      }
    });
  }

  if (status === "success") {
    return (
      <div className="space-y-4 rounded-md border border-green-600/50 bg-green-50 p-4 text-sm dark:bg-green-950/20">
        <p className="font-medium text-green-800 dark:text-green-400">
          預約已取消,時段已釋出給其他人。
        </p>
        <Link
          href="/products?kind=prescription_frame"
          className="inline-flex items-center text-blue-600 hover:underline"
        >
          → 選其他鏡架重新預約
        </Link>
      </div>
    );
  }

  if (status === "confirming") {
    return (
      <div className="space-y-4 rounded-md border p-4">
        <p>確定要取消這個預約嗎?取消後此時段會開放給其他人。</p>
        <div className="flex gap-2">
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={doCancel}
          >
            {isPending ? "取消中..." : "確認取消"}
          </Button>
          <Button
            variant="outline"
            disabled={isPending}
            onClick={() => setStatus("idle")}
          >
            不取消
          </Button>
        </div>
        {errorMsg && (
          <p className="text-sm text-destructive">{errorMsg}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Button variant="destructive" onClick={() => setStatus("confirming")}>
        取消此預約
      </Button>
      {status === "error" && errorMsg && (
        <p className="text-sm text-destructive">{errorMsg}</p>
      )}
    </div>
  );
}
