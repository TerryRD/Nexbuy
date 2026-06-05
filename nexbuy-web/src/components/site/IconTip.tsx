"use client";

import * as React from "react";
import { Tooltip } from "@base-ui/react/tooltip";
import Link from "next/link";

type IconTipProps = {
  tip: string;
  href?: string;
  ariaLabel?: string;
  className?: string;
  children: React.ReactNode;
};

/** Icon action button/link with an accessible tooltip on hover/focus. */
export function IconTip({ tip, href, ariaLabel, className, children }: IconTipProps) {
  const base =
    "inline-flex min-h-11 min-w-11 nav:min-h-9 nav:min-w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground";
  const cls = `${base} ${className ?? ""}`;

  const inner = href ? (
    <Link href={href} aria-label={ariaLabel ?? tip} className={cls}>
      {children}
    </Link>
  ) : (
    <button type="button" aria-label={ariaLabel ?? tip} className={cls}>
      {children}
    </button>
  );

  return (
    <Tooltip.Root>
      <Tooltip.Trigger render={inner} />
      <Tooltip.Portal>
        <Tooltip.Positioner side="bottom" sideOffset={6} className="z-[60]">
          <Tooltip.Popup className="rounded-sm border bg-popover px-2 py-1 text-[11px] text-popover-foreground shadow-2">
            {tip}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
