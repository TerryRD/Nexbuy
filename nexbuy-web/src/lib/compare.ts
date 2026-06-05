"use client";

import { useCallback, useSyncExternalStore } from "react";

// 比較清單：客戶用來把幾副鏡架放在一起 side-by-side 看。
// 最多 3 副（再多版面塞不下、也很少人實際比 4+）。
// 只存 product_id 字串陣列（其他資料 /compare 頁去 server fetch、
// 避免 localStorage 與 prod DB 不同步）。

const STORAGE_KEY = "nexbuy-compare-v1";
export const MAX_COMPARE = 4;

const EMPTY: string[] = [];
let cachedSnapshot: string[] | null = null;
const listeners = new Set<() => void>();

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

function safeRead(): string[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    return parsed.filter((x): x is string => typeof x === "string").slice(0, MAX_COMPARE);
  } catch {
    return EMPTY;
  }
}

function getSnapshot(): string[] {
  if (cachedSnapshot === null) cachedSnapshot = safeRead();
  return cachedSnapshot;
}

function getServerSnapshot(): string[] {
  return EMPTY;
}

function notify() {
  cachedSnapshot = safeRead();
  for (const l of listeners) l();
}

function writeAndNotify(next: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  notify();
}

if (typeof window !== "undefined") {
  // 跨 tab 同步
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) notify();
  });
}

export function useCompare() {
  const ids = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  const toggle = useCallback(
    (id: string) => {
      const current = safeRead();
      if (current.includes(id)) {
        writeAndNotify(current.filter((x) => x !== id));
        return { added: false };
      }
      if (current.length >= MAX_COMPARE) {
        return { added: false, full: true };
      }
      writeAndNotify([...current, id]);
      return { added: true };
    },
    [],
  );

  const remove = useCallback((id: string) => {
    writeAndNotify(safeRead().filter((x) => x !== id));
  }, []);

  const clear = useCallback(() => {
    writeAndNotify([]);
  }, []);

  return { ids, has, toggle, remove, clear, full: ids.length >= MAX_COMPARE };
}
