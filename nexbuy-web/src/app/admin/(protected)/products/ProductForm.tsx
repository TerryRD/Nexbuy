"use client";

import { useActionState, useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/lib/schemas/product";

type ProductKind = "finished" | "prescription_frame";

export interface ProductInitial {
  id?: string;
  name: string;
  slug: string;
  description: string | null;
  brand: string | null;
  price_cents: number;
  kind: ProductKind;
  finished_stock: number | null;
  is_online_available: boolean;
  image_urls: string[];
  try_on_image_url: string | null;
}

interface ActionResult {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

interface Props {
  initial: ProductInitial;
  action: (
    prev: ActionResult | null,
    formData: FormData,
  ) => Promise<ActionResult>;
  submitLabel: string;
}

export function ProductForm({ initial, action, submitLabel }: Props) {
  const [state, formAction, isPending] = useActionState(action, null);
  const [name, setName] = useState(initial.name);
  const [slug, setSlug] = useState(initial.slug);
  const [slugTouched, setSlugTouched] = useState(initial.slug.length > 0);
  const [kind, setKind] = useState<ProductKind>(initial.kind);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [tryOnPreviewUrl, setTryOnPreviewUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const tryOnFileRef = useRef<HTMLInputElement>(null);

  // Auto-suggest slug from name unless user typed slug manually.
  useEffect(() => {
    if (!slugTouched) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSlug(slugify(name));
    }
  }, [name, slugTouched]);

  // Object URL preview for newly picked file. Revoke on unmount/replace to
  // avoid leaking blob: URLs.
  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  useEffect(() => {
    if (!tryOnPreviewUrl) return;
    return () => URL.revokeObjectURL(tryOnPreviewUrl);
  }, [tryOnPreviewUrl]);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    setPreviewUrl(URL.createObjectURL(file));
  }

  function onTryOnFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setTryOnPreviewUrl(null);
      return;
    }
    setTryOnPreviewUrl(URL.createObjectURL(file));
  }

  const fieldErr = (k: string) => state?.fieldErrors?.[k]?.[0];
  const existingImage = initial.image_urls[0] ?? null;
  const existingTryOn = initial.try_on_image_url;

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="p-name">商品名稱</Label>
          <Input
            id="p-name"
            name="name"
            required
            maxLength={200}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {fieldErr("name") && <FieldErr msg={fieldErr("name")!} />}
        </div>

        <div className="space-y-2">
          <Label htmlFor="p-slug">網址 slug</Label>
          <Input
            id="p-slug"
            name="slug"
            required
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugTouched(true);
            }}
            placeholder="例:rx-classic-tortoise"
          />
          <p className="text-xs text-muted-foreground">
            出現在網址裡:/products/{slug || "..."}。改商品名後會自動更新,除非你手動改過。
          </p>
          {fieldErr("slug") && <FieldErr msg={fieldErr("slug")!} />}
        </div>

        <div className="space-y-2">
          <Label htmlFor="p-brand">品牌(選填)</Label>
          <Input
            id="p-brand"
            name="brand"
            maxLength={100}
            defaultValue={initial.brand ?? ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="p-price">售價(NT$)</Label>
          <Input
            id="p-price"
            type="number"
            min={0}
            step={1}
            required
            defaultValue={Math.round(initial.price_cents / 100)}
            onChange={(e) => {
              // Hidden mirror in cents for the action to read.
              const cents = Math.max(0, Math.round(Number(e.target.value || 0) * 100));
              const hidden = e.currentTarget.form?.elements.namedItem(
                "price_cents",
              ) as HTMLInputElement | null;
              if (hidden) hidden.value = String(cents);
            }}
          />
          <input
            type="hidden"
            name="price_cents"
            defaultValue={initial.price_cents}
          />
          {fieldErr("price_cents") && <FieldErr msg={fieldErr("price_cents")!} />}
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">類型</legend>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="kind"
              value="finished"
              checked={kind === "finished"}
              onChange={() => setKind("finished")}
            />
            成品(線上直接買)
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="kind"
              value="prescription_frame"
              checked={kind === "prescription_frame"}
              onChange={() => setKind("prescription_frame")}
            />
            處方鏡架(預約到店配鏡)
          </label>
        </div>
      </fieldset>

      {kind === "finished" && (
        <div className="space-y-2 max-w-xs">
          <Label htmlFor="p-stock">庫存數量</Label>
          <Input
            id="p-stock"
            name="finished_stock"
            type="number"
            min={0}
            max={99999}
            required
            defaultValue={initial.finished_stock ?? 0}
          />
          {fieldErr("finished_stock") && <FieldErr msg={fieldErr("finished_stock")!} />}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="p-desc">商品描述(選填)</Label>
        <Textarea
          id="p-desc"
          name="description"
          rows={5}
          maxLength={2000}
          defaultValue={initial.description ?? ""}
          placeholder="材質、特色、保固、適用臉型..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="p-image">商品圖(JPG / PNG / WebP, 5MB 內)</Label>
        {existingImage && !previewUrl && (
          <div className="flex items-center gap-3">
            <Image
              src={existingImage}
              alt="目前圖片"
              width={120}
              height={120}
              className="rounded border bg-muted/30 object-cover"
              unoptimized
            />
            <p className="text-sm text-muted-foreground">
              選新檔案會置換為主圖,舊圖會留在 image_urls 後排。不選就不動。
            </p>
          </div>
        )}
        {previewUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="預覽"
            width={120}
            height={120}
            className="rounded border bg-muted/30 object-cover"
          />
        )}
        <Input
          id="p-image"
          ref={fileRef}
          type="file"
          name="image"
          accept="image/jpeg,image/png,image/webp"
          onChange={onFileChange}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="p-try-on">試戴用透明 PNG (選填, 5MB 內)</Label>
        <p className="text-xs text-muted-foreground">
          /try-on 試戴頁會用的去背鏡架圖, 限 PNG 且需透明背景。
          現有去背圖直接上傳; 沒有的話留空, 下個 PR 接 remove.bg 自動去背。
        </p>
        {existingTryOn && !tryOnPreviewUrl && (
          <div className="flex items-center gap-3">
            <Image
              src={existingTryOn}
              alt="目前試戴圖"
              width={120}
              height={120}
              className="rounded border bg-[repeating-conic-gradient(#e5e5e5_0_25%,#f5f5f5_0_50%)] bg-[length:16px_16px] object-contain"
              unoptimized
            />
            <p className="text-sm text-muted-foreground">
              選新檔會置換。不選就不動。
            </p>
          </div>
        )}
        {tryOnPreviewUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tryOnPreviewUrl}
            alt="試戴圖預覽"
            width={120}
            height={120}
            className="rounded border bg-[repeating-conic-gradient(#e5e5e5_0_25%,#f5f5f5_0_50%)] bg-[length:16px_16px] object-contain"
          />
        )}
        <Input
          id="p-try-on"
          ref={tryOnFileRef}
          type="file"
          name="try_on_image"
          accept="image/png"
          onChange={onTryOnFileChange}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="p-online"
          type="checkbox"
          name="is_online_available"
          defaultChecked={initial.is_online_available}
        />
        <Label htmlFor="p-online">線上可顯示 / 可購買</Label>
      </div>

      {state?.error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending} size="lg">
          {isPending ? "儲存中..." : submitLabel}
        </Button>
        <Link
          href="/admin/products"
          className={buttonVariants({ variant: "outline" })}
        >
          取消
        </Link>
      </div>
    </form>
  );
}

function FieldErr({ msg }: { msg: string }) {
  return <p className="text-xs text-destructive">{msg}</p>;
}
