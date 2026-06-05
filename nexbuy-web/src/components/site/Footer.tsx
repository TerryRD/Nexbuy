import Link from "next/link";
import { Phone, MapPin, Clock } from "lucide-react";
import { Logo } from "./Logo";

const SHOP = {
  name: "精鋐眼鏡行",
  address: "桃園市桃園區同德里中埔六街 95 號",
  phone: "(03) 317-3639",
  phoneLink: "tel:+886333173639",
  hours: "週一–週六 15:00–22:00（週日公休）",
  maps: "https://maps.app.goo.gl/bqez4pyoFHN7oYE87",
  taxId: "91234567",
};

const CATEGORIES = [
  { href: "/products?kind=finished", label: "成品太陽眼鏡" },
  { href: "/products?kind=prescription_frame", label: "處方鏡框" },
  { href: "/tryon", label: "虛擬試戴" },
  { href: "/quiz", label: "臉型測驗" },
  { href: "/compare", label: "鏡框比較" },
];

const SERVICES = [
  { href: "/store", label: "門市資訊" },
  { href: "/wishlist", label: "願望清單" },
  { href: "/orders", label: "訂單查詢" },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t bg-bg-deep">
      <div className="container py-12">
        <div className="grid gap-10 sm:grid-cols-2 nav:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-2 font-serif text-lg font-medium text-foreground">
              <Logo className="h-5 w-auto text-foreground" />
              <span>精鋐眼鏡行<span className="text-gold">.</span></span>
            </Link>
            <p className="text-sm text-muted-foreground">
              在家挑框，到店配鏡。慢工細活，實體店家親手服務。
            </p>
          </div>

          {/* Categories */}
          <nav className="space-y-3 text-sm" aria-label="商品分類">
            <h3 className="eyebrow">選購</h3>
            <ul className="space-y-2 text-muted-foreground">
              {CATEGORIES.map((c) => (
                <li key={c.href}>
                  <Link href={c.href} className="transition-colors hover:text-foreground">
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Services */}
          <nav className="space-y-3 text-sm" aria-label="服務">
            <h3 className="eyebrow">服務</h3>
            <ul className="space-y-2 text-muted-foreground">
              {SERVICES.map((s) => (
                <li key={s.href}>
                  <Link href={s.href} className="transition-colors hover:text-foreground">
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Store info */}
          <div className="space-y-3 text-sm">
            <h3 className="eyebrow">門市</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0" />
                <a href={SHOP.maps} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-foreground">
                  {SHOP.address}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 size-4 shrink-0" />
                <a href={SHOP.phoneLink} className="transition-colors hover:text-foreground">
                  {SHOP.phone}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="mt-0.5 size-4 shrink-0" />
                <span>{SHOP.hours}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-1 border-t pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} {SHOP.name} ・ 統一編號 {SHOP.taxId}</span>
          <span>在家挑框，到店配鏡</span>
        </div>
      </div>
    </footer>
  );
}
