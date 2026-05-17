"use client";

import Link from "next/link";
import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { Menu, Glasses, Camera } from "lucide-react";
import { ThemeToggleItem } from "./ThemeToggleItem";

/**
 * Mobile-only nav: hamburger trigger that opens a dropdown with the
 * primary nav links + theme toggle. Account and cart stay outside this
 * menu (independent in the header) since they're high-frequency.
 */
export function MobileNavMenu() {
  return (
    <MenuPrimitive.Root>
      <MenuPrimitive.Trigger
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground sm:hidden"
        aria-label="開啟選單"
      >
        <Menu className="size-5" />
      </MenuPrimitive.Trigger>

      <MenuPrimitive.Portal>
        <MenuPrimitive.Positioner
          align="start"
          side="bottom"
          sideOffset={8}
          className="z-50"
        >
          <MenuPrimitive.Popup className="min-w-44 overflow-hidden rounded-lg border bg-popover shadow-lg outline-none">
            <MenuPrimitive.Item
              className="outline-none"
              render={
                <Link
                  href="/products"
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-accent/40 data-[highlighted]:bg-accent/40"
                >
                  <Glasses className="size-4 text-muted-foreground" />
                  眼鏡
                </Link>
              }
            />
            <MenuPrimitive.Item
              className="outline-none"
              render={
                <Link
                  href="/tryon"
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-accent/40 data-[highlighted]:bg-accent/40"
                >
                  <Camera className="size-4 text-muted-foreground" />
                  虛擬試戴
                </Link>
              }
            />
            <MenuPrimitive.Separator className="my-1 h-px bg-border" />
            <ThemeToggleItem />
          </MenuPrimitive.Popup>
        </MenuPrimitive.Positioner>
      </MenuPrimitive.Portal>
    </MenuPrimitive.Root>
  );
}
