// 商品照片的 server-side SVG placeholder。當商品 image_urls 是空的時，
// 我們不要拿不相關的 Unsplash 照（之前那波 demo 出現棒球帽 / 車子 /
// 植物的混亂），而是 server 端生成一張根據商品屬性著色的 SVG 鏡框
// 線稿圖，data: URL 直送 next/image。
//
// 設計取捨：
//  - 永遠可用、永遠跟商品本身對齊 — 不會搞錯
//  - 同 slug 永遠 deterministic，避免 SSR/CSR 不一致
//  - 配色用品牌色（咖啡 / 奶油），沒走色盤之外
//  - 鏡框輪廓依 kind / face_shape 微調，每張長得不太一樣
//
// 真品照上線後，admin 在商品編輯頁上傳 → image_urls[0] 蓋過去，placeholder
// 就退役。

interface PlaceholderInput {
  slug: string;
  kind: "finished" | "prescription_frame";
  /** 第一個臉型（多選的話取第一個）— 改變鏡框形狀 */
  face_shape?: readonly string[] | null;
  /** color 改主背景 tint */
  color?: string | null;
}

const PALETTES: Record<string, { bg: string; accent: string; frame: string }> = {
  // 暖色系，跟首頁 hero 那種「奶油 + 咖啡」的調子一致
  default: { bg: "#f7efe2", accent: "#c8a373", frame: "#3a2a1c" },
  黑:       { bg: "#f3ece3", accent: "#928577", frame: "#1a1410" },
  棕:       { bg: "#f6ebda", accent: "#a87651", frame: "#5a3a22" },
  玳瑁:     { bg: "#f9eed5", accent: "#b8814b", frame: "#4a2e18" },
  金:       { bg: "#fbf2dc", accent: "#d6b06b", frame: "#7c5b2a" },
  銀:       { bg: "#eef0f2", accent: "#b9c0c8", frame: "#3e4753" },
  透明:     { bg: "#f2f5f7", accent: "#a8b4c0", frame: "#5a6470" },
  其他:     { bg: "#f7efe2", accent: "#bf9777", frame: "#412e1f" },
};

/**
 * 把 slug hash 成 0–1 數值，給 deterministic 微調用。
 */
function hashUnit(slug: string): number {
  let h = 5381;
  for (let i = 0; i < slug.length; i++) {
    h = (h * 33) ^ slug.charCodeAt(i);
  }
  // unsigned + 取小數
  return ((h >>> 0) % 1000) / 1000;
}

/** 第二個獨立 hash 給挑形狀用，避免 slug → tilt 的相關性把樣式鎖在某幾種。*/
function hashIndex(slug: string, n: number, salt = 0): number {
  let h = 5381 + salt * 31;
  for (let i = 0; i < slug.length; i++) {
    h = (h * 33) ^ slug.charCodeAt(i);
  }
  return (h >>> 0) % n;
}

const FALLBACK_SHAPES = ["圓形", "方形", "橢圓", "倒三角"] as const;
const FALLBACK_COLORS = ["黑", "棕", "玳瑁", "金", "銀", "透明"] as const;

/**
 * 依臉型決定鏡框 path：
 *   圓形    → 圓
 *   方形    → 圓角矩形
 *   橢圓    → 寬橢圓
 *   倒三角  → 大上窄下
 *   其他    → 預設方圓
 */
function lensPath(shape: string, cx: number, cy: number, rx: number, ry: number): string {
  switch (shape) {
    case "圓形":
      return `M ${cx - rx},${cy} a ${rx},${rx} 0 1,0 ${rx * 2},0 a ${rx},${rx} 0 1,0 ${-rx * 2},0`;
    case "方形":
      return `M ${cx - rx},${cy - ry} h ${rx * 2} v ${ry * 2} h ${-rx * 2} z`;
    case "橢圓":
      return `M ${cx - rx},${cy} a ${rx},${ry} 0 1,0 ${rx * 2},0 a ${rx},${ry} 0 1,0 ${-rx * 2},0`;
    case "倒三角":
      return `M ${cx - rx},${cy - ry} L ${cx + rx},${cy - ry} L ${cx},${cy + ry} Z`;
    default:
      // 預設略圓的方框
      return `M ${cx - rx},${cy - ry * 0.7} a ${rx * 0.3},${rx * 0.3} 0 0 1 ${rx * 0.3},${-ry * 0.3} h ${rx * 1.4} a ${rx * 0.3},${rx * 0.3} 0 0 1 ${rx * 0.3},${ry * 0.3} v ${ry * 1.4} a ${rx * 0.3},${rx * 0.3} 0 0 1 ${-rx * 0.3},${ry * 0.3} h ${-rx * 1.4} a ${rx * 0.3},${rx * 0.3} 0 0 1 ${-rx * 0.3},${-ry * 0.3} z`;
  }
}

export function productPlaceholderSvg(input: PlaceholderInput): string {
  // 沒設 color → 用 slug hash 決定（保證 deterministic + 看起來各自不同）
  const colorKey =
    input.color && PALETTES[input.color]
      ? input.color
      : FALLBACK_COLORS[hashIndex(input.slug, FALLBACK_COLORS.length, 1)];
  const palette = PALETTES[colorKey] ?? PALETTES.default;
  // 沒設 face_shape → 同樣 slug hash
  const shape =
    input.face_shape?.[0] ??
    FALLBACK_SHAPES[hashIndex(input.slug, FALLBACK_SHAPES.length, 2)];
  const t = hashUnit(input.slug);
  const tilt = (t - 0.5) * 6; // -3deg..+3deg 微擺
  const lensRx = 105 + (t * 20 - 10); // 95–115
  const lensRy = lensRx * 0.78;

  // 600 x 600 — 對齊 next/image fill 用的 aspect-square 容器
  const W = 600;
  const H = 600;
  const cyL = 290;
  const cxL = 215;
  const cxR = 385;
  const bridgeY = cyL;

  // prescription_frame 用 outline 風（線稿）；finished 用 fill 風（實心）
  const fillStyle =
    input.kind === "finished"
      ? `fill="${palette.accent}" fill-opacity="0.18" stroke="${palette.frame}" stroke-width="6"`
      : `fill="none" stroke="${palette.frame}" stroke-width="7"`;

  const left = lensPath(shape, cxL, cyL, lensRx, lensRy);
  const right = lensPath(shape, cxR, cyL, lensRx, lensRy);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${input.slug}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${palette.bg}"/>
      <stop offset="100%" stop-color="${palette.accent}" stop-opacity="0.35"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <g transform="rotate(${tilt.toFixed(2)} ${W / 2} ${H / 2})">
    <!-- 鏡腿（簡單畫斜線示意，左右對稱） -->
    <path d="M ${cxL - lensRx + 6} ${cyL} q -45 12 -82 60" fill="none" stroke="${palette.frame}" stroke-width="6" stroke-linecap="round"/>
    <path d="M ${cxR + lensRx - 6} ${cyL} q 45 12 82 60" fill="none" stroke="${palette.frame}" stroke-width="6" stroke-linecap="round"/>
    <!-- 鼻橋 -->
    <path d="M ${cxL + lensRx} ${bridgeY - 6} q 22 -10 ${cxR - cxL - lensRx * 2} 0" fill="none" stroke="${palette.frame}" stroke-width="5" stroke-linecap="round"/>
    <!-- 兩個鏡片 -->
    <path d="${left}" ${fillStyle}/>
    <path d="${right}" ${fillStyle}/>
  </g>
  <text x="${W / 2}" y="${H - 36}" text-anchor="middle"
        font-family="-apple-system,BlinkMacSystemFont,'PingFang TC','Noto Sans TC',sans-serif"
        font-size="20" fill="${palette.frame}" fill-opacity="0.5"
        letter-spacing="0.15em">JING HONG OPTICAL</text>
</svg>`;
  return svg;
}

/**
 * 直接拿來放進 <Image src> 的 data URL。SVG 內容大約 1KB，比抓 Unsplash
 * 還快。data URL 不會被 next/image 優化（Vercel image optimizer 跳過），
 * 但因為已經夠小直接 inline 就好。
 */
export function productPlaceholderDataUrl(input: PlaceholderInput): string {
  const svg = productPlaceholderSvg(input);
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * 商品圖選擇器：上傳的真品照優先；沒有就走 SVG placeholder。
 * 列表頁、PDP、cart、compare 等所有顯示商品圖的地方都走這個。
 */
export function getProductImageUrl(
  product: PlaceholderInput & { image_urls?: string[] | null },
): string {
  const uploaded = product.image_urls?.[0];
  if (uploaded && uploaded.length > 0) return uploaded;
  return productPlaceholderDataUrl(product);
}
