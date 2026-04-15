-- ============================================================
-- Supabase Storage Buckets
-- ============================================================

-- Product images bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('product-images', 'product-images', true, 5242880); -- 5MB limit

-- Digital downloads bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('digital-downloads', 'digital-downloads', false, 104857600); -- 100MB limit

-- ── Storage Policies ────────────────────────────────────────

-- Anyone can view product images
CREATE POLICY "Public read product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Authenticated users can read their own digital downloads (via Edge Function signed URLs)
-- No direct access policy needed for digital-downloads bucket
-- Downloads are served via Edge Functions using service_role key
