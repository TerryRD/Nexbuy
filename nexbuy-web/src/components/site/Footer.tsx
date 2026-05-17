import Link from "next/link";
import { Phone, MapPin, Clock, Mail } from "lucide-react";

// TODO: move to env vars / DB when shop info needs to be editable.
const SHOP_INFO = {
  name: "精鋐眼鏡行",
  phone: "(02) 0000-0000",
  phoneLink: "tel:+886200000000",
  address: "台北市信義區信義路一段 1 號",
  hours: "週一～週六 10:00 – 21:00（週日公休）",
  email: "service@example.com",
  emailLink: "mailto:service@example.com",
};

export function Footer() {
  return (
    <footer className="mt-auto border-t bg-background">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Brand + tagline */}
          <div className="space-y-2">
            <h2 className="font-heading text-lg font-semibold">
              {SHOP_INFO.name}
            </h2>
            <p className="text-sm text-muted-foreground">
              在家挑框，到店配鏡。挑款、預約、配鏡 一次搞定。
            </p>
          </div>

          {/* Contact */}
          <div className="space-y-3 text-sm">
            <h3 className="font-medium text-foreground">聯絡我們</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <Phone className="size-4 mt-0.5 shrink-0 text-muted-foreground/70" />
                <Link
                  href={SHOP_INFO.phoneLink}
                  className="hover:text-foreground hover:underline underline-offset-2"
                >
                  {SHOP_INFO.phone}
                </Link>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="size-4 mt-0.5 shrink-0 text-muted-foreground/70" />
                <Link
                  href={SHOP_INFO.emailLink}
                  className="hover:text-foreground hover:underline underline-offset-2"
                >
                  {SHOP_INFO.email}
                </Link>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="size-4 mt-0.5 shrink-0 text-muted-foreground/70" />
                <span>{SHOP_INFO.address}</span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="size-4 mt-0.5 shrink-0 text-muted-foreground/70" />
                <span>{SHOP_INFO.hours}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-4 text-sm text-muted-foreground">
          © {new Date().getFullYear()} {SHOP_INFO.name} ・ 在家挑框，到店配鏡
        </div>
      </div>
    </footer>
  );
}
