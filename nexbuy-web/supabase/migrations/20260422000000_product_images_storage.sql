-- Lane E: Supabase Storage bucket for product images.
-- Public read so the storefront can <img> them; admin-only write.

set search_path = public;

-- ---------------------------------------------------------------------------
-- Bucket
-- ---------------------------------------------------------------------------
-- 5 MiB limit per file; jpg / png / webp only.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- Policies on storage.objects
-- ---------------------------------------------------------------------------
-- We need is_admin() resolvable from the storage schema. The function lives
-- in public; reference fully-qualified.

drop policy if exists "product images public read" on storage.objects;
drop policy if exists "product images admin insert" on storage.objects;
drop policy if exists "product images admin update" on storage.objects;
drop policy if exists "product images admin delete" on storage.objects;

create policy "product images public read" on storage.objects
  for select using (bucket_id = 'product-images');

create policy "product images admin insert" on storage.objects
  for insert with check (bucket_id = 'product-images' and public.is_admin());

create policy "product images admin update" on storage.objects
  for update using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

create policy "product images admin delete" on storage.objects
  for delete using (bucket_id = 'product-images' and public.is_admin());
