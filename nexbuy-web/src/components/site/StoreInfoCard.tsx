import { MapPin, Phone, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const STORE = {
  name: "精鋐眼鏡行",
  address: "桃園市桃園區同德里中埔六街 95 號",
  phone: "(03) 317-3639",
  telHref: "tel:+886333173639",
  hours: "週一–週六 15:00–22:00（週日公休）",
  mapsUrl: "https://maps.app.goo.gl/bqez4pyoFHN7oYE87",
} as const;

const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(STORE.address)}&output=embed&hl=zh-TW&z=17`;

type StoreInfoCardProps = {
  showMap?: boolean;
  className?: string;
};

/** Server-safe (no hooks). Displays store contact info and an optional Google Maps embed. */
export function StoreInfoCard({ showMap = true, className }: StoreInfoCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card text-foreground shadow-sm",
        className,
      )}
    >
      {/* Header */}
      <div className="border-b border-border px-5 py-4">
        <p className="eyebrow text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          門市資訊
        </p>
        <h2 className="mt-1 font-serif text-lg font-semibold">{STORE.name}</h2>
      </div>

      {/* Info rows */}
      <div className="space-y-3 px-5 py-4">
        {/* Address */}
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <a
            href={STORE.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-foreground underline-offset-2 hover:underline"
          >
            {STORE.address}
          </a>
        </div>

        {/* Phone */}
        <div className="flex items-center gap-3">
          <Phone className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <a
            href={STORE.telHref}
            className="text-sm text-foreground underline-offset-2 hover:underline"
          >
            {STORE.phone}
          </a>
        </div>

        {/* Hours */}
        <div className="flex items-center gap-3">
          <Clock className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <span className="text-sm text-muted-foreground">{STORE.hours}</span>
        </div>
      </div>

      {/* Google Maps link */}
      <div className="px-5 pb-4">
        <a
          href={STORE.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-2 hover:underline"
        >
          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
          在 Google 地圖開啟
        </a>
      </div>

      {/* Map embed */}
      {showMap && (
        <div className="px-5 pb-5">
          <iframe
            src={mapSrc}
            title="精鋐眼鏡行 Google 地圖"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-64 w-full rounded-lg border border-border grayscale-[10%] transition-[filter] dark:invert dark:hue-rotate-180"
            allowFullScreen
          />
        </div>
      )}
    </div>
  );
}
