import Link from "next/link";
import { Glasses } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase/server";
import { CartLink } from "./CartLink";
import { HeaderAuthLink } from "./HeaderAuthLink";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

export async function Header() {
  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-2 px-3 sm:px-4">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 whitespace-nowrap font-heading text-base font-semibold tracking-tight text-primary sm:gap-2.5 sm:text-xl"
        >
          <Logo className="h-5 w-auto" />
          <span>精鋐眼鏡行</span>
        </Link>
        <nav className="flex shrink-0 items-center gap-0.5 whitespace-nowrap text-sm sm:gap-1">
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 rounded-full px-2 py-1.5 text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground sm:px-3"
            aria-label="眼鏡"
          >
            <Glasses className="size-4" />
            <span className="hidden sm:inline">眼鏡</span>
          </Link>
          <HeaderAuthLink loggedIn={!!user} />
          <CartLink />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
