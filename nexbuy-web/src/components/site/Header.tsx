import Link from "next/link";

export function Header() {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Nexbuy 眼鏡
        </Link>
        <nav className="flex gap-4 text-sm">
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
        </nav>
      </div>
    </header>
  );
}
