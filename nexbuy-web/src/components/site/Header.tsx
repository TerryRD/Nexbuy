import Link from "next/link";
import { Glasses, Camera } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase/server";
import { CartLink } from "./CartLink";
import { HeaderAuthLink } from "./HeaderAuthLink";
import { Logo } from "./Logo";
import { MobileNavMenu } from "./MobileNavMenu";
import { ThemeToggle } from "./ThemeToggle";

export async function Header() {
  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-2 px-3 sm:px-4">
        {/* Left: hamburger (mobile) + logo */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <MobileNavMenu />
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 whitespace-nowrap font-heading text-base font-semibold tracking-tight text-primary sm:gap-2.5 sm:text-xl"
          >
            <Logo className="h-5 w-auto" />
            <span>精鋐眼鏡行</span>
          </Link>
        </div>

        {/* Right: primary nav (desktop) + account + cart (always) + theme (desktop) */}
        <nav className="flex shrink-0 items-center gap-0.5 whitespace-nowrap text-sm sm:gap-1">
          {/* Desktop-only primary links — duplicated in mobile hamburger menu */}
          <Link
            href="/products"
            className="hidden sm:inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground sm:min-h-0 sm:min-w-0 sm:px-3 sm:py-1.5"
            aria-label="眼鏡"
          >
            <Glasses className="size-4" />
            <span>眼鏡</span>
          </Link>
          <Link
            href="/tryon"
            className="hidden sm:inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground sm:min-h-0 sm:min-w-0 sm:px-3 sm:py-1.5"
            aria-label="試戴"
          >
            <Camera className="size-4" />
            <span>試戴</span>
          </Link>

          {/* Account + Cart: always visible on both mobile and desktop */}
          <HeaderAuthLink loggedIn={!!user} />
          <CartLink />

          {/* Theme toggle: desktop only — mobile has it inside hamburger menu */}
          <div className="hidden sm:inline-flex">
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}
