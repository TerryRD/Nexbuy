"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createProductSchema, updateProductSchema } from "@/lib/schemas/product";
import { pingProductUrls } from "@/lib/seo/indexnow";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const PRODUCT_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const TRY_ON_IMAGE_TYPES = new Set(["image/png"]);

interface ActionResult {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

function parseFormData(formData: FormData) {
  return {
    name: (formData.get("name") ?? "").toString(),
    slug: (formData.get("slug") ?? "").toString(),
    description: (formData.get("description") ?? "").toString() || null,
    brand: (formData.get("brand") ?? "").toString() || null,
    price_cents: (formData.get("price_cents") ?? "").toString(),
    kind: (formData.get("kind") ?? "").toString(),
    finished_stock: (formData.get("finished_stock") ?? "").toString() || null,
    low_stock_threshold:
      (formData.get("low_stock_threshold") ?? "").toString() || "3",
    is_online_available: formData.get("is_online_available") === "on",
    // Phase 3 attributes — face_shape 是多選 checkbox 群組
    face_shape: formData.getAll("face_shape").map((v) => v.toString()),
    frame_shape: (formData.get("frame_shape") ?? "").toString() || null,
    frame_size: (formData.get("frame_size") ?? "").toString() || null,
    material: (formData.get("material") ?? "").toString() || null,
    color: (formData.get("color") ?? "").toString() || null,
  };
}

/**
 * Upload an optional file to the given bucket. Returns the public URL or null
 * if no file given. Throws on validation / upload failure.
 */
async function uploadIfPresent(
  formData: FormData,
  formField: string,
  bucket: "product-images" | "try-on-images",
  allowedTypes: Set<string>,
  slug: string,
): Promise<string | null> {
  const file = formData.get(formField);
  if (!(file instanceof File) || file.size === 0) return null;
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("圖片超過 5MB");
  }
  if (!allowedTypes.has(file.type)) {
    throw new Error(
      bucket === "try-on-images"
        ? "試戴圖只支援 PNG"
        : "圖片格式只支援 JPG / PNG / WebP",
    );
  }

  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : "jpg";
  const path = `${slug}/${Date.now()}.${ext}`;

  const admin = createAdminSupabase();
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await admin.storage
    .from(bucket)
    .upload(path, buffer, { contentType: file.type, upsert: false });
  if (error) {
    console.error(`storage upload to ${bucket} failed:`, error);
    throw new Error("圖片上傳失敗");
  }

  const { data } = admin.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

function uploadProductImage(formData: FormData, slug: string) {
  return uploadIfPresent(formData, "image", "product-images", PRODUCT_IMAGE_TYPES, slug);
}

function uploadTryOnImage(formData: FormData, slug: string) {
  return uploadIfPresent(formData, "try_on_image", "try-on-images", TRY_ON_IMAGE_TYPES, slug);
}

export async function createProductAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = createProductSchema.safeParse(parseFormData(formData));
  if (!parsed.success) {
    return { error: "格式錯誤", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  let imageUrl: string | null = null;
  let tryOnUrl: string | null = null;
  try {
    imageUrl = await uploadProductImage(formData, parsed.data.slug);
    tryOnUrl = await uploadTryOnImage(formData, parsed.data.slug);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "上傳失敗" };
  }

  const sb = await createServerSupabase();
  const { error } = await sb.from("products").insert({
    name: parsed.data.name,
    slug: parsed.data.slug,
    description: parsed.data.description,
    brand: parsed.data.brand,
    price_cents: parsed.data.price_cents,
    kind: parsed.data.kind,
    finished_stock: parsed.data.kind === "finished" ? parsed.data.finished_stock : null,
    low_stock_threshold: parsed.data.low_stock_threshold,
    is_online_available: parsed.data.is_online_available,
    image_urls: imageUrl ? [imageUrl] : [],
    try_on_image_url: tryOnUrl,
    face_shape: parsed.data.face_shape,
    frame_shape: parsed.data.frame_shape,
    frame_size: parsed.data.frame_size,
    material: parsed.data.material,
    color: parsed.data.color,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "slug 已存在,換一個" };
    }
    console.error("createProduct failed:", error);
    return { error: "建立失敗:" + error.message };
  }

  revalidatePath("/admin/products");
  pingProductUrls([parsed.data.slug]);
  redirect("/admin/products");
}

const updateIdSchema = z.uuid();

export async function updateProductAction(
  productId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const idParsed = updateIdSchema.safeParse(productId);
  if (!idParsed.success) return { error: "INVALID_ID" };

  const parsed = updateProductSchema.safeParse(parseFormData(formData));
  if (!parsed.success) {
    return { error: "格式錯誤", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const sb = await createServerSupabase();

  // Pull the existing product so we can preserve image_urls when no new file
  // is uploaded.
  const { data: existing, error: readErr } = await sb
    .from("products")
    .select("image_urls, try_on_image_url")
    .eq("id", productId)
    .maybeSingle();
  if (readErr || !existing) {
    return { error: "找不到商品" };
  }

  let imageUrls: string[] = (existing.image_urls as string[] | null) ?? [];
  let tryOnUrl: string | null = (existing.try_on_image_url as string | null) ?? null;
  try {
    const newUrl = await uploadProductImage(formData, parsed.data.slug);
    if (newUrl) {
      // Replace strategy: new upload becomes the primary image, keep the rest.
      imageUrls = [newUrl, ...imageUrls.filter((u) => u !== newUrl)];
    }
    const newTryOn = await uploadTryOnImage(formData, parsed.data.slug);
    if (newTryOn) tryOnUrl = newTryOn;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "上傳失敗" };
  }

  const { error } = await sb
    .from("products")
    .update({
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description,
      brand: parsed.data.brand,
      price_cents: parsed.data.price_cents,
      kind: parsed.data.kind,
      finished_stock:
        parsed.data.kind === "finished" ? parsed.data.finished_stock : null,
      low_stock_threshold: parsed.data.low_stock_threshold,
      is_online_available: parsed.data.is_online_available,
      image_urls: imageUrls,
      try_on_image_url: tryOnUrl,
      face_shape: parsed.data.face_shape,
      frame_shape: parsed.data.frame_shape,
      frame_size: parsed.data.frame_size,
      material: parsed.data.material,
      color: parsed.data.color,
    })
    .eq("id", productId);

  if (error) {
    if (error.code === "23505") return { error: "slug 已存在" };
    console.error("updateProduct failed:", error);
    return { error: "更新失敗:" + error.message };
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}/edit`);
  revalidatePath(`/products/${parsed.data.slug}`);
  revalidatePath("/tryon");
  pingProductUrls([parsed.data.slug]);
  redirect("/admin/products");
}

const toggleSchema = z.object({
  id: z.uuid(),
  is_online_available: z.enum(["true", "false"]),
});

export async function toggleProductOnline(formData: FormData): Promise<void> {
  const parsed = toggleSchema.safeParse({
    id: formData.get("id"),
    is_online_available: formData.get("is_online_available"),
  });
  if (!parsed.success) throw new Error("INVALID_INPUT");

  const sb = await createServerSupabase();
  const { error } = await sb
    .from("products")
    .update({ is_online_available: parsed.data.is_online_available === "true" })
    .eq("id", parsed.data.id);
  if (error) throw new Error("UPDATE_FAILED");
  revalidatePath("/admin/products");
}

const deleteSchema = z.object({ id: z.uuid() });

export async function deleteProduct(formData: FormData): Promise<void> {
  const parsed = deleteSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) throw new Error("INVALID_INPUT");

  const sb = await createServerSupabase();
  // Soft delete：設 deleted_at + 同步把 is_online_available 切掉，避免
  // 任何漏網之魚（例如某查詢只看 is_online_available 沒看 deleted_at）。
  // order_items snapshot 商品名/價/qty，appointments.frame_product_id
  // 是 SET NULL，soft delete 也不會破歷史。要復原直接 SQL update 把
  // deleted_at 設回 null。
  const { data, error } = await sb
    .from("products")
    .update({
      deleted_at: new Date().toISOString(),
      is_online_available: false,
    })
    .eq("id", parsed.data.id)
    .select("slug")
    .maybeSingle();
  if (error) {
    console.error("deleteProduct (soft) failed:", error);
    throw new Error("DELETE_FAILED:" + error.message);
  }
  revalidatePath("/admin/products");
  // 商品 URL 變 404 — IndexNow 通知讓搜尋引擎降級該頁
  if (data?.slug) {
    pingProductUrls([data.slug as string]);
  }
}
