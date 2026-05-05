import { publicEnv } from "@/lib/env";

// schema.org 結構化資料 helpers。
// 主要對 Google Search 商品卡片 / Knowledge Panel 顯示有幫助。

const BASE = publicEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
const SHOP_NAME = "精鋐眼鏡行";

export function organizationSchema() {
  // LocalBusiness > Optician（眼鏡行專用 type）
  return {
    "@context": "https://schema.org",
    "@type": "Optician",
    "@id": `${BASE}#organization`,
    name: SHOP_NAME,
    alternateName: "Jing Hong Optical",
    url: BASE,
    description:
      "精鋐眼鏡行：成品眼鏡線上直接購買，處方鏡架線上預約到店驗光配鏡。",
    areaServed: {
      "@type": "Country",
      name: "Taiwan",
    },
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${BASE}#website`,
    url: BASE,
    name: SHOP_NAME,
    inLanguage: "zh-TW",
    publisher: {
      "@id": `${BASE}#organization`,
    },
  };
}

export interface ProductSchemaInput {
  slug: string;
  name: string;
  description: string | null;
  priceCents: number;
  imageUrl: string | undefined;
  kind: "finished" | "prescription_frame";
  brand: string | null;
  finishedStock: number | null;
  isOnlineAvailable: boolean;
}

export function productSchema(p: ProductSchemaInput) {
  const url = `${BASE}/products/${p.slug}`;
  const priceTwd = (p.priceCents / 100).toFixed(0);
  // 處方鏡架不能線上下單（要預約到店配鏡）→ availability 改成 PreOrder
  // 並標 description 提示需到店；不然 Google 會把它當「賣不到」標 OutOfStock。
  let availability: string;
  if (!p.isOnlineAvailable) {
    availability = "https://schema.org/OutOfStock";
  } else if (p.kind === "prescription_frame") {
    availability = "https://schema.org/PreOrder";
  } else if (p.finishedStock !== null && p.finishedStock <= 0) {
    availability = "https://schema.org/OutOfStock";
  } else {
    availability = "https://schema.org/InStock";
  }

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description ?? p.name,
    image: p.imageUrl ? [p.imageUrl] : undefined,
    sku: p.slug,
    brand: p.brand
      ? {
          "@type": "Brand",
          name: p.brand,
        }
      : undefined,
    category: p.kind === "finished" ? "成品眼鏡" : "處方鏡架",
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "TWD",
      price: priceTwd,
      availability,
      seller: {
        "@id": `${BASE}#organization`,
      },
    },
  };
}
