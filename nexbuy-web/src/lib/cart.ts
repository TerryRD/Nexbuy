"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "nexbuy-cart-v1";
const MAX_QTY_PER_ITEM = 10;

export type CartItem = {
  product_id: string;
  slug: string;
  name: string;
  price_cents: number;
  quantity: number;
  image_url?: string;
};

const EMPTY: CartItem[] = [];
let cachedSnapshot: CartItem[] | null = null;
const listeners = new Set<() => void>();

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

function safeRead(): CartItem[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
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
    return EMPTY;
  }
}

function getSnapshot(): CartItem[] {
  if (cachedSnapshot === null) cachedSnapshot = safeRead();
  return cachedSnapshot;
}

function getServerSnapshot(): CartItem[] {
  return EMPTY;
}

function writeAndNotify(next: CartItem[]): void {
  cachedSnapshot = next;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((l) => {
    l();
  });
}

// Cross-tab sync (another tab added/removed items).
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) {
      cachedSnapshot = null;
      listeners.forEach((l) => {
        l();
      });
    }
  });
}

export function useCart() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const add = useCallback(
    (item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
      const qty = item.quantity ?? 1;
      const current = safeRead();
      const existing = current.find((i) => i.product_id === item.product_id);
      const next: CartItem[] = existing
        ? current.map((i) =>
            i.product_id === item.product_id
              ? {
                  ...i,
                  quantity: Math.min(i.quantity + qty, MAX_QTY_PER_ITEM),
                }
              : i,
          )
        : [...current, { ...item, quantity: Math.min(qty, MAX_QTY_PER_ITEM) }];
      writeAndNotify(next);
    },
    [],
  );

  const setQty = useCallback((product_id: string, quantity: number) => {
    const clamped = Math.max(1, Math.min(quantity, MAX_QTY_PER_ITEM));
    writeAndNotify(
      safeRead().map((i) =>
        i.product_id === product_id ? { ...i, quantity: clamped } : i,
      ),
    );
  }, []);

  const remove = useCallback((product_id: string) => {
    writeAndNotify(safeRead().filter((i) => i.product_id !== product_id));
  }, []);

  const clear = useCallback(() => {
    writeAndNotify([]);
  }, []);

  const subtotalCents = items.reduce(
    (sum, i) => sum + i.price_cents * i.quantity,
    0,
  );
  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);

  return { items, add, setQty, remove, clear, subtotalCents, totalQuantity };
}

// Shipping: flat 80 NTD, free over 3000 NTD (matches place_order RPC).
export function computeShippingCents(subtotalCents: number): number {
  return subtotalCents >= 300000 ? 0 : 8000;
}
