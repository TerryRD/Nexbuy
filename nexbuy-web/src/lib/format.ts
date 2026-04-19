const currencyFormatter = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0,
});

export function formatPrice(cents: number): string {
  return currencyFormatter.format(cents / 100);
}

const dateFormatter = new Intl.DateTimeFormat("zh-TW", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "short",
});

export function formatDate(isoDate: string): string {
  // "2026-04-20" → "2026年4月20日 週一"
  return dateFormatter.format(new Date(`${isoDate}T00:00:00`));
}

export function formatTime(time: string): string {
  // "10:00:00" → "10:00"
  return time.slice(0, 5);
}
