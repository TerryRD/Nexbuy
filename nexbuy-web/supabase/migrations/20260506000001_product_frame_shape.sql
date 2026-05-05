-- 加 frame_shape（框形）欄位 — 跟 face_shape（適合臉型）不同：
-- face_shape 是「這個鏡架適合誰戴」，frame_shape 是「這個鏡架本身長什麼形狀」。
-- 顧客挑眼鏡時兩個都看，視覺上 frame_shape 差異最大（圓 vs 方 vs 飛行員）。
--
-- 可選值（限 6 種主流）：圓框 / 方框 / 橢圓 / 飛行員 / 貓眼 / 雷朋
-- 用 text + zod enum 校驗（同 frame_size / material / color 慣例），不放 DB CHECK
-- 方便日後加新形狀。

set search_path = public;

alter table products
  add column if not exists frame_shape text;

create index if not exists idx_products_frame_shape on products(frame_shape) where frame_shape is not null;

-- 既有 demo 商品依 slug / 名稱推斷形狀，免得 demo 給業主時全部 null
update products set frame_shape = '方框' where slug = 'sunglass-classic-black';
update products set frame_shape = '圓框' where slug = 'sunglass-round-gold';
update products set frame_shape = '飛行員' where slug = 'sunglass-aviator-gold';
update products set frame_shape = '貓眼' where slug = 'sunglass-cat-eye';
update products set frame_shape = '方框' where slug = 'sunglass-wooden-square';
update products set frame_shape = '雷朋' where slug = 'sunglass-sport-blue';

update products set frame_shape = '橢圓' where slug = 'reading-light-acetate';
update products set frame_shape = '橢圓' where slug = 'reading-metal-thin';
update products set frame_shape = '圓框' where slug = 'reading-panda-round';
update products set frame_shape = '圓框' where slug = 'reading-clear-round';
update products set frame_shape = '方框' where slug = 'reading-metal-rect';

update products set frame_shape = '方框' where slug = 'rx-classic-tortoise';
update products set frame_shape = '橢圓' where slug = 'rx-modern-titanium';
update products set frame_shape = '圓框' where slug = 'rx-kids-flexible';
update products set frame_shape = '圓框' where slug = 'rx-japan-thin-round';
update products set frame_shape = '方框' where slug = 'rx-business-bold';
