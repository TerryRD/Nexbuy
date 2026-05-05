"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

// shadcn 的 Label 通用 wrapper：consumer 自己傳 htmlFor / 包 children
// → 由 caller 負責 a11y 配對。lint 看不到 caller 結構，這層 disable 掉
// 規則；caller 端仍會被檢查（form 內的 <Label htmlFor="x"> 直接寫 native
// label，沒過 wrapper）。
function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    // eslint-disable-next-line jsx-a11y/label-has-associated-control
    <label
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Label }
