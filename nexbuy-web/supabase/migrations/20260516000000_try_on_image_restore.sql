-- nexbuy-web/supabase/migrations/20260516000000_try_on_image_restore.sql
--
-- Phase 2 try-on restoration. The prior PR (#28fac29 + #2eafad9) was
-- reverted in 5547e78 because the remove.bg auto-bg-removal path produced
-- inadequate eyewear cutouts. This time we drop auto-removal entirely —
-- admin uploads a pre-cropped transparent PNG manually.
--
-- The storage bucket `try-on-images` was NOT removed in the revert
-- (Supabase's storage triggers block SQL deletes). This migration is
-- idempotent: column add uses `if not exists`, bucket uses `on conflict do
-- update`, policies are dropped + recreated.

set search_path = public;

-- 1. products.try_on_image_url (nullable per conventions §4)

alter table products add column if not exists try_on_image_url text;

-- 2. Storage bucket: try-on-images (PNG-only, 5 MiB, public read)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'try-on-images',
  'try-on-images',
  true,
  5242880,
  array['image/png']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 3. Policies (mirror product-images: public read, admin write)

drop policy if exists "try-on images public read" on storage.objects;
drop policy if exists "try-on images admin insert" on storage.objects;
drop policy if exists "try-on images admin update" on storage.objects;
drop policy if exists "try-on images admin delete" on storage.objects;

create policy "try-on images public read" on storage.objects
  for select using (bucket_id = 'try-on-images');

create policy "try-on images admin insert" on storage.objects
  for insert with check (bucket_id = 'try-on-images' and public.is_admin());

create policy "try-on images admin update" on storage.objects
  for update using (bucket_id = 'try-on-images' and public.is_admin())
  with check (bucket_id = 'try-on-images' and public.is_admin());

create policy "try-on images admin delete" on storage.objects
  for delete using (bucket_id = 'try-on-images' and public.is_admin());
