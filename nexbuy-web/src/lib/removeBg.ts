import "server-only";
import { getServerEnv } from "@/lib/env";

const REMOVE_BG_URL = "https://api.remove.bg/v1.0/removebg";

export function isRemoveBgConfigured(): boolean {
  return Boolean(getServerEnv().REMOVE_BG_API_KEY);
}

/**
 * 把任意圖片送到 remove.bg、回傳去背 PNG bytes。
 * 用 multipart/form-data 上傳；size=auto 讓 remove.bg 用最佳輸出尺寸。
 *
 * 失敗時 throw，呼叫端捕捉並轉成使用者可讀錯誤訊息。
 */
export async function removeBackground(
  imageBytes: Uint8Array,
  contentType: string,
): Promise<Uint8Array> {
  const { REMOVE_BG_API_KEY } = getServerEnv();
  if (!REMOVE_BG_API_KEY) {
    throw new Error("[remove.bg] 未設定 REMOVE_BG_API_KEY");
  }

  const form = new FormData();
  form.append(
    "image_file",
    new Blob([imageBytes as unknown as ArrayBuffer], { type: contentType }),
    "image",
  );
  // auto = remove.bg 自動選擇輸出尺寸（最大 ~25MP，超過要 paid）
  form.append("size", "auto");
  form.append("format", "png");
  // 試戴鏡架的主體就是「眼鏡」，告訴 remove.bg 改善偵測準度
  form.append("type", "product");

  const res = await fetch(REMOVE_BG_URL, {
    method: "POST",
    headers: { "X-Api-Key": REMOVE_BG_API_KEY },
    body: form,
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = (await res.json()) as {
        errors?: { title?: string; detail?: string }[];
      };
      const first = body.errors?.[0];
      if (first?.detail || first?.title) {
        detail = first.detail ?? first.title ?? detail;
      }
    } catch {
      // 不是 JSON 就保留 statusText
    }
    throw new Error(`[remove.bg] API ${res.status}: ${detail}`);
  }

  return new Uint8Array(await res.arrayBuffer());
}
