-- ============================================================
-- Row Level Security Policies
-- ============================================================

-- ── Profiles ────────────────────────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ── Admins (no RLS - accessed via service_role only) ────────

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
-- No policies = no direct client access (admin Edge Functions use service_role)

-- ── Categories (public read) ────────────────────────────────

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read categories"
  ON categories FOR SELECT
  USING (true);

-- ── Products (public read active only) ──────────────────────

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active products"
  ON products FOR SELECT
  USING (status = 'active');

-- ── Product Translations (public read) ──────────────────────

ALTER TABLE product_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read translations"
  ON product_translations FOR SELECT
  USING (true);

-- ── Product Images (public read) ────────────────────────────

ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read images"
  ON product_images FOR SELECT
  USING (true);

-- ── Product Variants (public read) ──────────────────────────

ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read variants"
  ON product_variants FOR SELECT
  USING (true);

-- ── Orders (user sees own) ──────────────────────────────────

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own orders"
  ON orders FOR SELECT
  USING (user_id = auth.uid());

-- ── Order Items (user sees own via order) ───────────────────

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

-- ── Order Coupons (user sees own via order) ─────────────────

ALTER TABLE order_coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own order coupons"
  ON order_coupons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_coupons.order_id
        AND orders.user_id = auth.uid()
    )
  );

-- ── Coupons (public read active for validation) ─────────────

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active coupons"
  ON coupons FOR SELECT
  USING (status = 'active');

-- ── Points (user sees own) ──────────────────────────────────

ALTER TABLE points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own points"
  ON points FOR SELECT
  USING (user_id = auth.uid());

-- ── Point Rules (public read) ───────────────────────────────

ALTER TABLE point_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read point rules"
  ON point_rules FOR SELECT
  USING (true);

-- ── Digital Downloads (user sees own) ───────────────────────

ALTER TABLE digital_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own downloads"
  ON digital_downloads FOR SELECT
  USING (user_id = auth.uid());

-- ── User Addresses (full CRUD for own) ──────────────────────

ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own addresses"
  ON user_addresses FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own addresses"
  ON user_addresses FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own addresses"
  ON user_addresses FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own addresses"
  ON user_addresses FOR DELETE
  USING (user_id = auth.uid());

-- ── Wishlists (full CRUD for own) ───────────────────────────

ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own wishlist"
  ON wishlists FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can add to own wishlist"
  ON wishlists FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove from own wishlist"
  ON wishlists FOR DELETE
  USING (user_id = auth.uid());

-- ── Shipping Methods (public read active) ───────────────────

ALTER TABLE shipping_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active shipping methods"
  ON shipping_methods FOR SELECT
  USING (is_active = true);

-- ── Cart Items (full CRUD for own) ──────────────────────────

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own cart"
  ON cart_items FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can add to own cart"
  ON cart_items FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own cart"
  ON cart_items FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove from own cart"
  ON cart_items FOR DELETE
  USING (user_id = auth.uid());
