import Link from "next/link";
import { GitCompareArrows, Heart } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase/server";
import { CartLink } from "./CartLink";
import { HeaderAuthLink } from "./HeaderAuthLink";
import { IconTip } from "./IconTip";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  { href: "/products", label: "選購" },
  { href: "/tryon", label: "虛擬試戴" },
  { href: "/quiz", label: "臉型測驗" },
  { href: "/store", label: "門市" },
];

export async function Header() {
  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-sm">
      {/* Announcement bar */}
      <div className="bg-bg-deep text-muted-foreground">
        <p className="container flex h-8 items-center justify-center gap-2 text-center text-[11px] tracking-wide">
          <span>滿 NT$3,000 免運</span>
          <span aria-hidden className="text-line-soft">·</span>
          <span>週一–六 15:00–22:00</span>
        </p>
      </div>

      {/* Main bar */}
      <div className="container flex h-16 items-center justify-between gap-2">
        {/* Brand */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 whitespace-nowrap font-serif text-lg font-medium tracking-tight text-foreground sm:text-xl"
        >
          <Logo className="h-5 w-auto text-foreground" />
          <span>
            精鋐眼鏡行<span className="text-gold">.</span>
          </span>
        </Link>

        {/* Desktop nav (>=900px) */}
        <nav className="hidden items-center gap-1 nav:flex" aria-label="主導覽">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Icon actions */}
        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <IconTip tip="鏡框比較" href="/compare">
            <GitCompareArrows className="size-4" />
          </IconTip>
          <IconTip tip="願望清單" href="/wishlist">
            <Heart className="size-4" />
          </IconTip>
          <HeaderAuthLink loggedIn={!!user} />
          <CartLink />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
