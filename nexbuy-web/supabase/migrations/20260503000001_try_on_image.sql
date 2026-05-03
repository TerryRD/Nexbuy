-- Phase 2 — try-on MVP: store a separate transparent PNG of each frame for
-- the virtual try-on overlay. This first slice just lands the column +
-- storage bucket + admin upload UI; remove.bg auto-bg-removal arrives next
-- PR. Until then admin uploads a pre-cropped transparent PNG manually.

set search_path = public;

-- ---------------------------------------------------------------------------
-- products.try_on_image_url
-- ---------------------------------------------------------------------------

alter table products add column if not exists try_on_image_url text;

-- ---------------------------------------------------------------------------
-- Storage bucket: try-on-images
-- ---------------------------------------------------------------------------
-- PNG-only (must be transparent). 5 MiB limit per file.

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

-- ---------------------------------------------------------------------------
-- Policies on storage.objects (mirror product-images)
-- ---------------------------------------------------------------------------

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
