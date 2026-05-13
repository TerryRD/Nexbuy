"use client";

import { useEffect } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import type { CartItem } from "@/lib/cart";

const STORAGE_KEY = "nexbuy-cart-v1";
const MAX_QTY = 10;

function readLocalCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is CartItem =>
        x !== null &&
        typeof x === "object" &&
        typeof (x as CartItem).product_id === "string" &&
        typeof (x as CartItem).slug === "string" &&
        typeof (x as CartItem).name === "string" &&
        typeof (x as CartItem).price_cents === "number" &&
        typeof (x as CartItem).quantity === "number",
    );
  } catch {
    return [];
  }
}

function writeLocalCart(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  // 通知同一 tab 的 cart store listeners（storage event 只跨 tab）
  window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
}

async function syncCartOnSignIn(): Promise<void> {
  const local = readLocalCart();

  // 拉 server 端的 cart
  let serverItems: CartItem[] = [];
  try {
    const res = await fetch("/api/cart");
    if (res.ok) {
      const body = (await res.json()) as { items: CartItem[] };
      serverItems = body.items ?? [];
    }
  } catch {
    // 拉不到 server cart — 只推 local
  }

  // 合併：local 優先（量以 local 為準），server-only 的品項也加進來
  const merged = new Map<string, CartItem>();
  for (const item of serverItems) {
    merged.set(item.product_id, item);
  }
  for (const item of local) {
    const existing = merged.get(item.product_id);
    if (existing) {
      merged.set(item.product_id, {
        ...existing,
        quantity: Math.min(item.quantity, MAX_QTY),
      });
    } else {
      merged.set(item.product_id, item);
    }
  }

  const mergedItems = Array.from(merged.values());

  // 寫回 localStorage
  writeLocalCart(mergedItems);

  // 推到 server
  try {
    await fetch("/api/cart", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        mergedItems.map((i) => ({
          product_id: i.product_id,
          slug: i.slug,
          name: i.name,
          price_cents: i.price_cents,
          quantity: i.quantity,
          image_url: i.image_url ?? null,
        })),
      ),
    });
  } catch {
    // fire-and-forget — 失敗不影響本次 session
  }
}

export function CartSync() {
  useEffect(() => {
    const sb = createBrowserSupabase();
    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        syncCartOnSignIn().catch(console.error);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return null;
}
