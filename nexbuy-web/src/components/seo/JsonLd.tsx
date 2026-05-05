// JSON-LD 結構化資料：給 Google / Bing 看的 schema.org metadata。
// 使用 server component 直出 <script type="application/ld+json">。
//
// JSON.stringify 預設不會 escape `<`，但夾雜在 HTML 裡有 XSS 風險。我們的
// 資料都是 server 端組好的（產品名、店名 — 全部是 string），但仍走通用
// escape 慣例避免將來某個欄位出鬼。

interface Props {
  data: object;
}

function safeJson(data: object): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

export function JsonLd({ data }: Props) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJson(data) }}
    />
  );
}
