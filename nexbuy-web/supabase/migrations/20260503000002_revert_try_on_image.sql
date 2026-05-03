-- 反向 migration：撤掉 Phase 2 try-on MVP。
--
-- 為什麼撤：實測 remove.bg 對眼鏡的去背品質不夠好。
--
-- 注意：Supabase 對 storage.objects / storage.buckets 有安全 trigger
-- 禁止 SQL DELETE。所以這條只 drop column + policies；bucket 本身
-- 留著（無害、code 已不引用）。如要徹底清理，請在 Supabase Dashboard
-- → Storage → 刪除 try-on-images bucket（會連同檔案一起刪）。

set search_path = public;

-- ---------------------------------------------------------------------------
-- 1. Drop storage policies (這些 SQL 沒被 storage trigger 擋)
-- ---------------------------------------------------------------------------

drop policy if exists "try-on images public read" on storage.objects;
drop policy if exists "try-on images admin insert" on storage.objects;
drop policy if exists "try-on images admin update" on storage.objects;
drop policy if exists "try-on images admin delete" on storage.objects;

-- ---------------------------------------------------------------------------
-- 2. Drop the column
-- ---------------------------------------------------------------------------

alter table products drop column if exists try_on_image_url;
