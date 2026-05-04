// /products attribute filter — 純常數 / 純函式 / 純型別。
// AttributeFilters.tsx (client) 與 page.tsx (server) 都用，因此不能放在
// "use client" 檔裡 — Turbopack 會把 client-marked 模組的函式 stub 成 RPC
// 引用，server-side 直接 call 會 throw runtime error。

export interface AttributeFilterState {
  faceShapes: string[]; // multi
  frameSize: string | null; // single
  material: string | null; // single
  color: string | null; // single
}

export const EMPTY_FILTER: AttributeFilterState = {
  faceShapes: [],
  frameSize: null,
  material: null,
  color: null,
};

export function filterToQueryString(
  kind: string | null,
  filter: AttributeFilterState,
): string {
  const params = new URLSearchParams();
  if (kind) params.set("kind", kind);
  filter.faceShapes.forEach((s) => params.append("face_shape", s));
  if (filter.frameSize) params.set("frame_size", filter.frameSize);
  if (filter.material) params.set("material", filter.material);
  if (filter.color) params.set("color", filter.color);
  return params.toString();
}

export function filterFromSearchParams(sp: {
  face_shape?: string | string[];
  frame_size?: string;
  material?: string;
  color?: string;
}): AttributeFilterState {
  const fs = sp.face_shape;
  return {
    faceShapes: Array.isArray(fs) ? fs : fs ? [fs] : [],
    frameSize: sp.frame_size ?? null,
    material: sp.material ?? null,
    color: sp.color ?? null,
  };
}
