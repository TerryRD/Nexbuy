export function formatCurrency(amount: number, locale = 'zh-TW'): string {
  const currencyMap: Record<string, string> = {
    'zh-TW': 'TWD',
    en: 'USD',
    ja: 'JPY'
  }
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyMap[locale] || 'TWD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export function formatDate(dateStr: string, locale = 'zh-TW'): string {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

export function formatDateOnly(dateStr: string, locale = 'zh-TW'): string {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date)
}
