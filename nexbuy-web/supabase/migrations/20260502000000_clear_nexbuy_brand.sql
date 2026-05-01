-- Clear leftover 'Nexbuy' placeholder brand from seed data so that single-store
-- products don't render a redundant "Nexbuy" line under each product card.
-- Real brands like 'SportX' are left intact.
update products set brand = null where brand = 'Nexbuy';
