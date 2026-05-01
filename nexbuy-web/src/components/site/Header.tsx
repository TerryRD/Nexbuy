import Link from "next/link";
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
        <nav className="flex items-center gap-4 text-sm">
          <Link
            href="/products?kind=finished"
            className="text-muted-foreground hover:text-foreground"
          >
            成品眼鏡
          </Link>
          <Link
            href="/products?kind=prescription_frame"
            className="text-muted-foreground hover:text-foreground"
          >
            處方鏡架
          </Link>
          <Link
            href="/about"
            className="text-muted-foreground hover:text-foreground"
          >
            品牌故事
          </Link>
          <CartLink />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
