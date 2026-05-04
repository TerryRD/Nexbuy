"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toggleWishlistAction } from "@/app/account/wishlist/actions";

type Variant = "button" | "heart";

export function WishlistToggle({
  productId,
  initialInWishlist,
  isLoggedIn,
  variant = "button",
  className,
}: {
  productId: string;
  initialInWishlist: boolean;
  isLoggedIn: boolean;
  variant?: Variant;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [inWishlist, setInWishlist] = useState(initialInWishlist);
  const [pending, startTransition] = useTransition();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      const next = encodeURIComponent(pathname);
      router.push(`/login?next=${next}`);
      return;
    }

    const optimistic = !inWishlist;
    setInWishlist(optimistic);

    startTransition(async () => {
      const res = await toggleWishlistAction(productId);
      if (!res.ok) {
        setInWishlist(!optimistic);
        return;
      }
      setInWishlist(res.inWishlist);
    });
  };

  if (variant === "heart") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-pressed={inWishlist}
        aria-label={inWishlist ? "從收藏移除" : "加入收藏"}
        className={cn(
          "absolute right-2 top-2 z-10 inline-flex size-9 items-center justify-center rounded-full bg-background/80 text-muted-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-background hover:text-foreground disabled:opacity-60",
          inWishlist && "text-rose-500 hover:text-rose-500",
          className,
        )}
      >
        <Heart
          className={cn("size-4", inWishlist && "fill-current")}
          aria-hidden
        />
      </button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={inWishlist}
      className={cn("gap-1.5", className)}
    >
      <Heart
        className={cn("size-4", inWishlist && "fill-current text-rose-500")}
        aria-hidden
      />
      {inWishlist ? "已收藏" : "加入收藏"}
    </Button>
  );
}
