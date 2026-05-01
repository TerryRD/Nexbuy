// Suspense fallback for /products. Shown immediately while the server
// component fetches Supabase data. Layout matches the loaded page so there's
// minimal shift when content swaps in.

export default function ProductsLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="h-9 w-40 animate-pulse rounded-md bg-muted md:h-10 md:w-56" />
        <div className="h-10 w-72 animate-pulse rounded-full bg-muted" />
      </header>

      <ul
        aria-busy="true"
        aria-live="polite"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i}>
            <div className="overflow-hidden rounded-xl border border-border/60 bg-card/40">
              <div className="aspect-square animate-pulse bg-muted" />
              <div className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="h-5 w-32 animate-pulse rounded bg-muted" />
                  <div className="h-5 w-12 animate-pulse rounded-full bg-muted" />
                </div>
                <div className="h-3 w-full animate-pulse rounded bg-muted" />
                <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
                <div className="pt-2">
                  <div className="h-6 w-20 animate-pulse rounded bg-muted" />
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
