"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createProductSchema, updateProductSchema } from "@/lib/schemas/product";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

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
    is_online_available: formData.get("is_online_available") === "on",
  };
}

/**
 * Upload an optional image file to the product-images bucket.
 * Returns the public URL or null if no file given. Throws on validation /
 * upload failure (caller surfaces as error).
 */
async function uploadImageIfPresent(
  formData: FormData,
  slug: string,
): Promise<string | null> {
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return null;
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("圖片超過 5MB");
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("圖片格式只支援 JPG / PNG / WebP");
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${slug}/${Date.now()}.${ext}`;

  const admin = createAdminSupabase();
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await admin.storage
    .from("product-images")
    .upload(path, buffer, { contentType: file.type, upsert: false });
  if (error) {
    console.error("storage upload failed:", error);
    throw new Error("圖片上傳失敗");
  }

  const { data } = admin.storage.from("product-images").getPublicUrl(path);
  return data.publicUrl;
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
  try {
    imageUrl = await uploadImageIfPresent(formData, parsed.data.slug);
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
    is_online_available: parsed.data.is_online_available,
    image_urls: imageUrl ? [imageUrl] : [],
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "slug 已存在,換一個" };
    }
    console.error("createProduct failed:", error);
    return { error: "建立失敗:" + error.message };
  }

  revalidatePath("/admin/products");
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
    .select("image_urls")
    .eq("id", productId)
    .maybeSingle();
  if (readErr || !existing) {
    return { error: "找不到商品" };
  }

  let imageUrls: string[] = (existing.image_urls as string[] | null) ?? [];
  try {
    const newUrl = await uploadImageIfPresent(formData, parsed.data.slug);
    if (newUrl) {
      // Replace strategy: new upload becomes the primary image, keep the rest.
      imageUrls = [newUrl, ...imageUrls.filter((u) => u !== newUrl)];
    }
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
      is_online_available: parsed.data.is_online_available,
      image_urls: imageUrls,
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
  // Hard delete. order_items snapshots the product name + price + qty when an
  // order is placed, so deleting a product doesn't break historical orders.
  // appointments.frame_product_id has ON DELETE SET NULL so those survive too.
  const { error } = await sb.from("products").delete().eq("id", parsed.data.id);
  if (error) {
    console.error("deleteProduct failed:", error);
    throw new Error("DELETE_FAILED:" + error.message);
  }
  revalidatePath("/admin/products");
}
