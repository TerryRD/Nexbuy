-- 反向 migration：撤掉 Phase 2 try-on MVP 的 schema / bucket / policies。
--
-- 為什麼撤：實測 remove.bg 對眼鏡的去背品質不夠好（鏡腳 / 鏡片透明度
-- 處理不乾淨）。Phase 2 改為延後到後續 Phase（或等更好的 AI 工具）。
--
-- 操作順序：先 drop policies → 清空 bucket 內物件 → drop bucket → drop
-- column。bucket 必須空才能 drop。

set search_path = public;

-- ---------------------------------------------------------------------------
-- 1. Drop storage policies
-- ---------------------------------------------------------------------------

drop policy if exists "try-on images public read" on storage.objects;
drop policy if exists "try-on images admin insert" on storage.objects;
drop policy if exists "try-on images admin update" on storage.objects;
drop policy if exists "try-on images admin delete" on storage.objects;

-- ---------------------------------------------------------------------------
-- 2. Empty the bucket (any test uploads must go before bucket can be dropped)
-- ---------------------------------------------------------------------------

delete from storage.objects where bucket_id = 'try-on-images';

-- ---------------------------------------------------------------------------
-- 3. Drop the bucket
-- ---------------------------------------------------------------------------

delete from storage.buckets where id = 'try-on-images';

-- ---------------------------------------------------------------------------
-- 4. Drop the column
-- ---------------------------------------------------------------------------

alter table products drop column if exists try_on_image_url;
