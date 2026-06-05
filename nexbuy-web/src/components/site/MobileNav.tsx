"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Glasses, Sparkles, Heart, ShoppingBag } from "lucide-react";

const ITEMS = [
  { href: "/", label: "首頁", icon: Home },
  { href: "/products", label: "選購", icon: Glasses },
  { href: "/quiz", label: "測驗", icon: Sparkles },
  { href: "/wishlist", label: "收藏", icon: Heart },
  { href: "/cart", label: "購物車", icon: ShoppingBag },
];

/** Fixed bottom navigation, mobile/tablet only (<900px). */
export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="主導覽"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur nav:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] transition-colors ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="size-5" />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
