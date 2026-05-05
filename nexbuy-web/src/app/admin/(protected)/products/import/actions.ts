"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  FACE_SHAPES,
  FRAME_SIZES,
  MATERIALS,
  COLORS,
} from "@/lib/schemas/product";
import { parseCsv } from "./csv";
import { pingProductUrls } from "@/lib/seo/indexnow";

// CSV 欄位（header 名與這裡一致）：
//   name, slug, kind, price_cents, finished_stock, is_online_available,
//   description, brand, face_shape, frame_size, material, color
//
// face_shape 是分號分隔的多選："圓形;方形"

const REQUIRED_HEADERS = ["name", "slug", "kind", "price_cents"] as const;

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const rowSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    slug: z.string().trim().min(2).max(80).regex(slugRegex, "slug 格式錯誤"),
    kind: z.enum(["finished", "prescription_frame"]),
    price_cents: z.coerce.number().int().min(0).max(10_000_000),
    finished_stock: z
      .union([z.literal(""), z.coerce.number().int().min(0).max(99_999)])
      .optional()
      .transform((v) => (v === "" || v === undefined ? null : v)),
    is_online_available: z
      .union([z.literal(""), z.string()])
      .optional()
      .transform((v) => {
        if (!v) return true;
        const s = v.toString().trim().toLowerCase();
        return s === "true" || s === "1" || s === "yes" || s === "y";
      }),
    description: z
      .string()
      .max(2000)
      .optional()
      .transform((v) => (v && v.trim() !== "" ? v : null)),
    brand: z
      .string()
      .max(100)
      .optional()
      .transform((v) => (v && v.trim() !== "" ? v.trim() : null)),
    face_shape: z
      .string()
      .optional()
      .transform((v) => {
        if (!v || v.trim() === "") return [] as string[];
        return v
          .split(";")
          .map((s) => s.trim())
          .filter(Boolean);
      })
      .pipe(z.array(z.enum(FACE_SHAPES))),
    frame_size: z
      .union([z.literal(""), z.enum(FRAME_SIZES)])
      .optional()
      .transform((v) => (v ? v : null)),
    material: z
      .union([z.literal(""), z.enum(MATERIALS)])
      .optional()
      .transform((v) => (v ? v : null)),
    color: z
      .union([z.literal(""), z.enum(COLORS)])
      .optional()
      .transform((v) => (v ? v : null)),
  })
  .superRefine((d, ctx) => {
    if (d.kind === "finished" && d.finished_stock === null) {
      ctx.addIssue({
        code: "custom",
        message: "kind=finished 必填 finished_stock",
        path: ["finished_stock"],
      });
    }
  });

export type ImportRowError = {
  line: number; // CSV 行號（含 header，header=1）
  slug?: string;
  message: string;
};

export type ImportResult =
  | { ok: true; inserted: number; insertedNames: string[] }
  | { ok: false; errors: ImportRowError[]; inserted: number };

export type PreviewResult =
  | {
      ok: true;
      total: number;
      sample: Array<{
        name: string;
        slug: string;
        kind: "finished" | "prescription_frame";
        price_cents: number;
        finished_stock: number | null;
      }>;
    }
  | { ok: false; errors: ImportRowError[] };

const MAX_FILE_BYTES = 1 * 1024 * 1024; // 1MB
const MAX_ROWS = 500;

export async function importProductsAction(
  _prev: ImportResult | null,
  formData: FormData,
): Promise<ImportResult> {
  const file = formData.get("csv");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, errors: [{ line: 0, message: "請選一個 CSV 檔" }], inserted: 0 };
  }
  if (file.size > MAX_FILE_BYTES) {
    return {
      ok: false,
      errors: [{ line: 0, message: "檔案超過 1MB" }],
      inserted: 0,
    };
  }

  const text = await file.text();
  const { headers, rows } = parseCsv(text);

  // header 檢查
  const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
  if (missing.length > 0) {
    return {
      ok: false,
      errors: [
        {
          line: 1,
          message: `CSV header 缺欄位：${missing.join(", ")}`,
        },
      ],
      inserted: 0,
    };
  }
  if (rows.length === 0) {
    return {
      ok: false,
      errors: [{ line: 1, message: "CSV 沒有資料列" }],
      inserted: 0,
    };
  }
  if (rows.length > MAX_ROWS) {
    return {
      ok: false,
      errors: [
        { line: 0, message: `一次最多 ${MAX_ROWS} 列，目前 ${rows.length}` },
      ],
      inserted: 0,
    };
  }

  // 全列 zod 驗證
  const errors: ImportRowError[] = [];
  const validated: z.infer<typeof rowSchema>[] = [];
  rows.forEach((r, idx) => {
    const lineNo = idx + 2; // header=1
    const parsed = rowSchema.safeParse(r);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        errors.push({
          line: lineNo,
          slug: r.slug,
          message: `${issue.path.join(".") || "row"}: ${issue.message}`,
        });
      }
      return;
    }
    validated.push(parsed.data);
  });

  // CSV 內 slug 重複檢查
  const slugCounts = new Map<string, number[]>();
  validated.forEach((r, idx) => {
    const lines = slugCounts.get(r.slug) ?? [];
    lines.push(idx + 2);
    slugCounts.set(r.slug, lines);
  });
  for (const [slug, lines] of slugCounts) {
    if (lines.length > 1) {
      errors.push({
        line: lines[1],
        slug,
        message: `slug 在 CSV 內重複出現（line ${lines.join(", ")}）`,
      });
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors, inserted: 0 };
  }

  // 全部驗證 OK → bulk insert
  const sb = await createServerSupabase();
  const inserts = validated.map((r) => ({
    name: r.name,
    slug: r.slug,
    description: r.description,
    brand: r.brand,
    price_cents: r.price_cents,
    kind: r.kind,
    finished_stock: r.kind === "finished" ? r.finished_stock : null,
    is_online_available: r.is_online_available,
    image_urls: [],
    face_shape: r.face_shape,
    frame_size: r.frame_size,
    material: r.material,
    color: r.color,
  }));

  const { data, error } = await sb
    .from("products")
    .insert(inserts)
    .select("id, name, slug");

  if (error) {
    // 23505 = duplicate slug — 找出哪一筆並回報
    if (error.code === "23505") {
      const m = error.message.match(/Key \(slug\)=\(([^)]+)\)/);
      const dupSlug = m?.[1];
      const dupLine = dupSlug
        ? validated.findIndex((r) => r.slug === dupSlug) + 2
        : 0;
      return {
        ok: false,
        errors: [
          {
            line: dupLine,
            slug: dupSlug,
            message: `slug 「${dupSlug}」已存在於資料庫`,
          },
        ],
        inserted: 0,
      };
    }
    console.error("[products/import] insert failed:", error);
    return {
      ok: false,
      errors: [{ line: 0, message: "資料庫寫入失敗：" + error.message }],
      inserted: 0,
    };
  }

  const inserted = data ?? [];
  revalidatePath("/admin/products");

  // IndexNow 通知：批次 import 後一次推所有新增 slug
  const insertedSlugs = inserted.map((p) => p.slug as string).filter(Boolean);
  if (insertedSlugs.length > 0) {
    pingProductUrls(insertedSlugs);
  }

  return {
    ok: true,
    inserted: inserted.length,
    insertedNames: inserted.map((p) => p.name as string),
  };
}

// ---------------------------------------------------------------------------
// previewImport：跟 commit 同一條驗證鏈，但不寫 DB。給 UI 在按下「確認匯入」
// 之前顯示「會新增 N 筆 / 含這幾筆」做 dry-run。
// ---------------------------------------------------------------------------

export async function previewImportAction(
  _prev: PreviewResult | null,
  formData: FormData,
): Promise<PreviewResult> {
  const file = formData.get("csv");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, errors: [{ line: 0, message: "請選一個 CSV 檔" }] };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, errors: [{ line: 0, message: "檔案超過 1MB" }] };
  }

  const text = await file.text();
  const { headers, rows } = parseCsv(text);

  const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
  if (missing.length > 0) {
    return {
      ok: false,
      errors: [
        { line: 1, message: `CSV header 缺欄位：${missing.join(", ")}` },
      ],
    };
  }
  if (rows.length === 0) {
    return { ok: false, errors: [{ line: 1, message: "CSV 沒有資料列" }] };
  }
  if (rows.length > MAX_ROWS) {
    return {
      ok: false,
      errors: [
        { line: 0, message: `一次最多 ${MAX_ROWS} 列，目前 ${rows.length}` },
      ],
    };
  }

  const errors: ImportRowError[] = [];
  const validated: z.infer<typeof rowSchema>[] = [];
  rows.forEach((r, idx) => {
    const lineNo = idx + 2;
    const parsed = rowSchema.safeParse(r);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        errors.push({
          line: lineNo,
          slug: r.slug,
          message: `${issue.path.join(".") || "row"}: ${issue.message}`,
        });
      }
      return;
    }
    validated.push(parsed.data);
  });

  const slugCounts = new Map<string, number[]>();
  validated.forEach((r, idx) => {
    const lines = slugCounts.get(r.slug) ?? [];
    lines.push(idx + 2);
    slugCounts.set(r.slug, lines);
  });
  for (const [slug, lines] of slugCounts) {
    if (lines.length > 1) {
      errors.push({
        line: lines[1],
        slug,
        message: `slug 在 CSV 內重複出現（line ${lines.join(", ")}）`,
      });
    }
  }

  // 額外：檢查 DB 已存在的 slug（commit 階段會炸 23505，提早顯示）
  if (errors.length === 0 && validated.length > 0) {
    const sb = await createServerSupabase();
    const slugs = validated.map((r) => r.slug);
    const { data: existing } = await sb
      .from("products")
      .select("slug")
      .in("slug", slugs);
    const existingSet = new Set((existing ?? []).map((r) => r.slug as string));
    validated.forEach((r, idx) => {
      if (existingSet.has(r.slug)) {
        errors.push({
          line: idx + 2,
          slug: r.slug,
          message: `slug 「${r.slug}」已存在於資料庫`,
        });
      }
    });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    total: validated.length,
    sample: validated.slice(0, 10).map((r) => ({
      name: r.name,
      slug: r.slug,
      kind: r.kind,
      price_cents: r.price_cents,
      finished_stock: r.finished_stock ?? null,
    })),
  };
}
