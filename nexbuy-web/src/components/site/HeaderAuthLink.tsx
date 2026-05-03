"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { User } from "lucide-react";

const SKIP_NEXT = new Set([
  "/login",
  "/signup",
  "/auth/callback",
  "/forgot-password",
  "/reset-password",
]);

export function HeaderAuthLink({ loggedIn }: { loggedIn: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  let href: string;
  if (loggedIn) {
    href = "/account";
  } else if (SKIP_NEXT.has(pathname)) {
    // Already on an auth page — don't recurse
    href = "/login";
  } else {
    const qs = searchParams.toString();
    const full = qs ? `${pathname}?${qs}` : pathname;
    href = `/login?next=${encodeURIComponent(full)}`;
  }

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground"
    >
      <User className="size-4" />
      <span className="hidden sm:inline">{loggedIn ? "我的帳號" : "登入"}</span>
    </Link>
  );
}
