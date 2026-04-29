-- Backfill demo product cover images.
-- Initial seed used /placeholder/*.webp paths that don't exist (404).
-- Swap to Unsplash CDN photos so the storefront has real-looking demo data.
--
-- Once the real merchant uploads their own product photos via the admin
-- panel, these will be replaced naturally — admin upload flow writes to
-- Supabase Storage and prepends to image_urls.

set search_path = public;

update products set image_urls = array['https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=1200&q=80&auto=format&fit=crop'] where slug = 'sunglass-classic-black';
update products set image_urls = array['https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=1200&q=80&auto=format&fit=crop']         where slug = 'sunglass-round-gold';
update products set image_urls = array['https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=1200&q=80&auto=format&fit=crop']         where slug = 'sunglass-sport-blue';
update products set image_urls = array['https://images.unsplash.com/photo-1582142306909-195724d33ffc?w=1200&q=80&auto=format&fit=crop']         where slug = 'reading-light-acetate';
update products set image_urls = array['https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=1200&q=80&auto=format&fit=crop']         where slug = 'reading-metal-thin';
update products set image_urls = array['https://images.unsplash.com/photo-1577803645773-f96470509666?w=1200&q=80&auto=format&fit=crop']         where slug = 'rx-classic-tortoise';
update products set image_urls = array['https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&q=80&auto=format&fit=crop']         where slug = 'rx-modern-titanium';
update products set image_urls = array['https://images.unsplash.com/photo-1508296695146-257a814070b4?w=1200&q=80&auto=format&fit=crop']         where slug = 'rx-kids-flexible';
