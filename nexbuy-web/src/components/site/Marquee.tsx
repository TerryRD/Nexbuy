const ITEMS = [
  "義式醋酸纖維",
  "日本鈦合金",
  "偏光抗 UV400",
  "台灣本地驗光",
  "七天鑑賞",
  "一年保固",
  "終身免費清洗調整",
];

export function Marquee() {
  // 內容重複兩份做無縫循環。整體裝飾性 → aria-hidden。
  const run = (
    <span className="flex shrink-0 items-center gap-6 px-3">
      {ITEMS.map((t) => (
        <span key={t} className="flex items-center gap-6 text-sm tracking-wide text-muted-foreground">
          {t}
          <span aria-hidden className="text-gold">◆</span>
        </span>
      ))}
    </span>
  );
  return (
    <div
      aria-hidden
      className="overflow-hidden border-y border-border/60 bg-bg-deep py-3"
    >
      <div className="flex w-max animate-marquee motion-reduce:animate-none">
        {run}
        {run}
      </div>
    </div>
  );
}
