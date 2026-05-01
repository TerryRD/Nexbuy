import Link from "next/link";
import { Glasses } from "lucide-react";
import { CartLink } from "./CartLink";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link
          href="/"
          className="font-heading text-xl font-semibold tracking-tight text-primary"
        >
          精鋐眼鏡行
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground"
          >
            <Glasses className="size-4" />
            <span>眼鏡</span>
          </Link>
          <CartLink />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
