import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Chainable query-builder stub ---
type EqCall = [string, unknown];

function makeQueryStub(resolveWith: { data: unknown; error: unknown }) {
  const eqCalls: EqCall[] = [];

  const stub = {
    eqCalls,
    select(_cols: string) {
      return this;
    },
    eq(col: string, val: unknown) {
      eqCalls.push([col, val]);
      return this;
    },
    order(_col: string, _opts?: unknown) {
      return this;
    },
    limit(_n: number) {
      // Terminal method — return a Promise resolving the mock result.
      return Promise.resolve(resolveWith);
    },
  };

  return stub;
}

// --- Mock @/lib/supabase/server ---
const mockCreateServerSupabase = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabase: mockCreateServerSupabase,
}));

// Import after mock is set up.
import { getNewArrivals, getFeaturedProducts } from "@/lib/products";

// ---------------------------------------------------------------------------

describe("getNewArrivals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does NOT add a kind eq filter when kind is omitted", async () => {
    const stub = makeQueryStub({ data: [], error: null });
    mockCreateServerSupabase.mockResolvedValue({ from: () => stub });

    await getNewArrivals();

    const kindCalls = stub.eqCalls.filter(([col]) => col === "kind");
    expect(kindCalls).toHaveLength(0);
  });

  it("adds .eq('kind', 'finished') when kind='finished'", async () => {
    const stub = makeQueryStub({ data: [], error: null });
    mockCreateServerSupabase.mockResolvedValue({ from: () => stub });

    await getNewArrivals(8, "finished");

    expect(stub.eqCalls).toContainEqual(["kind", "finished"]);
  });

  it("returns [] on query error", async () => {
    const stub = makeQueryStub({
      data: null,
      error: { message: "db error", code: "PGRST" },
    });
    mockCreateServerSupabase.mockResolvedValue({ from: () => stub });

    const result = await getNewArrivals();

    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------

describe("getFeaturedProducts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("adds .eq('kind', 'prescription_frame') AND keeps is_featured filter", async () => {
    const stub = makeQueryStub({ data: [], error: null });
    mockCreateServerSupabase.mockResolvedValue({ from: () => stub });

    await getFeaturedProducts(8, "prescription_frame");

    expect(stub.eqCalls).toContainEqual(["kind", "prescription_frame"]);
    expect(stub.eqCalls).toContainEqual(["is_featured", true]);
  });

  it("returns [] on query error", async () => {
    const stub = makeQueryStub({
      data: null,
      error: { message: "column not found", code: "PGRST116" },
    });
    mockCreateServerSupabase.mockResolvedValue({ from: () => stub });

    const result = await getFeaturedProducts();

    expect(result).toEqual([]);
  });
});
