"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { removeFromWishlistAction } from "./actions";

export function WishlistRemoveButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const res = await removeFromWishlistAction(productId);
          if (res.ok) router.refresh();
        });
      }}
      className="gap-1.5 text-muted-foreground hover:text-destructive"
      aria-label="從收藏移除"
    >
      <Trash2 className="size-4" />
      移除
    </Button>
  );
}
