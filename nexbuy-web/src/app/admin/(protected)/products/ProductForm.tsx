"use client";

import { useActionState, useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  slugify,
  FACE_SHAPES,
  FRAME_SIZES,
  MATERIALS,
  COLORS,
} from "@/lib/schemas/product";

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
  low_stock_threshold: number;
  is_online_available: boolean;
  image_urls: string[];
  face_shape: string[];
  frame_size: string | null;
  material: string | null;
  color: string | null;
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
  const fileRef = useRef<HTMLInputElement>(null);

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

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    setPreviewUrl(URL.createObjectURL(file));
  }

  const fieldErr = (k: string) => state?.fieldErrors?.[k]?.[0];
  const existingImage = initial.image_urls[0] ?? null;

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
        <div className="grid gap-4 sm:grid-cols-2 max-w-xl">
          <div className="space-y-2">
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
          <div className="space-y-2">
            <Label htmlFor="p-low-stock-threshold">
              低庫存警戒值
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                （&lt; 此數寄信通知）
              </span>
            </Label>
            <Input
              id="p-low-stock-threshold"
              name="low_stock_threshold"
              type="number"
              min={0}
              max={99999}
              defaultValue={initial.low_stock_threshold ?? 3}
            />
            {fieldErr("low_stock_threshold") && (
              <FieldErr msg={fieldErr("low_stock_threshold")!} />
            )}
          </div>
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

      <fieldset className="space-y-4 rounded-lg border bg-card/30 p-4">
        <legend className="px-1 text-sm font-medium">屬性 (全選填)</legend>

        <div className="space-y-2">
          <Label>適合臉型 (多選)</Label>
          <div className="flex flex-wrap gap-3 text-sm">
            {FACE_SHAPES.map((s) => (
              <label key={s} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="face_shape"
                  value={s}
                  defaultChecked={initial.face_shape.includes(s)}
                />
                {s}
              </label>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <SelectField
            label="鏡架尺寸"
            name="frame_size"
            options={FRAME_SIZES}
            initial={initial.frame_size}
          />
          <SelectField
            label="材質"
            name="material"
            options={MATERIALS}
            initial={initial.material}
          />
          <SelectField
            label="主色"
            name="color"
            options={COLORS}
            initial={initial.color}
          />
        </div>
      </fieldset>

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

function SelectField({
  label,
  name,
  options,
  initial,
}: {
  label: string;
  name: string;
  options: readonly string[];
  initial: string | null;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={`p-${name}`}>{label}</Label>
      <select
        id={`p-${name}`}
        name={name}
        defaultValue={initial ?? ""}
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <option value="">— 不指定 —</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
