-- ============================================================
-- Nexbuy: MSSQL to PostgreSQL Schema Migration
-- Converted from EF Core NexbuyDbContext + Entity Models
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── Enum Types ──────────────────────────────────────────────

CREATE TYPE user_status AS ENUM ('disabled', 'active');
CREATE TYPE product_type AS ENUM ('physical', 'digital');
CREATE TYPE product_status AS ENUM ('inactive', 'active');
CREATE TYPE address_type AS ENUM ('regular', 'convenience_store');
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'processing', 'shipped', 'completed', 'cancelled');
CREATE TYPE payment_method AS ENUM ('manual_confirmation');
CREATE TYPE payment_status AS ENUM ('unpaid', 'paid', 'refunding', 'refunded');
CREATE TYPE shipping_method_type AS ENUM ('home_delivery', 'seven_eleven', 'family_mart');
CREATE TYPE coupon_type AS ENUM ('fixed_amount', 'percentage');
CREATE TYPE coupon_status AS ENUM ('disabled', 'active');
CREATE TYPE point_type AS ENUM ('earn', 'redeem', 'expire', 'adjust');
CREATE TYPE admin_role AS ENUM ('super_admin', 'admin');

-- ── Profiles (replaces User table, linked to auth.users) ────

CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text NOT NULL DEFAULT '',
  phone text,
  point_balance integer NOT NULL DEFAULT 0,
  preferred_locale text NOT NULL DEFAULT 'zh-TW',
  status user_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_profiles_email ON profiles(email);

-- ── Admins (separate from auth.users) ───────────────────────

CREATE TABLE admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  password_hash text NOT NULL,
  name text NOT NULL DEFAULT '',
  role admin_role NOT NULL DEFAULT 'admin',
  status user_status NOT NULL DEFAULT 'active',
  refresh_token text,
  refresh_token_expiry timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_admins_email ON admins(email);

-- ── Categories (self-referencing hierarchy) ─────────────────

CREATE TABLE categories (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  parent_id integer REFERENCES categories(id) ON DELETE RESTRICT,
  slug text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX idx_categories_slug ON categories(slug);

-- ── Products ────────────────────────────────────────────────

CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id integer NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  sku text NOT NULL,
  type product_type NOT NULL DEFAULT 'physical',
  price numeric(10, 2) NOT NULL DEFAULT 0,
  stock integer NOT NULL DEFAULT 0,
  max_downloads integer,
  download_expiry_hours integer,
  status product_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_status ON products(status);

-- ── Product Translations ────────────────────────────────────

CREATE TABLE product_translations (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  locale text NOT NULL,
  name text NOT NULL,
  description text
);

CREATE UNIQUE INDEX idx_product_translations_product_locale
  ON product_translations(product_id, locale);

-- ── Product Images ──────────────────────────────────────────

CREATE TABLE product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_images_product ON product_images(product_id);

-- ── Product Variants ────────────────────────────────────────

CREATE TABLE product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_name text NOT NULL,
  price_adjustment numeric(10, 2) NOT NULL DEFAULT 0,
  stock integer NOT NULL DEFAULT 0,
  sku text
);

CREATE INDEX idx_product_variants_product ON product_variants(product_id);

-- ── Orders ──────────────────────────────────────────────────

CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no text NOT NULL,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  status order_status NOT NULL DEFAULT 'pending',
  payment_method payment_method NOT NULL DEFAULT 'manual_confirmation',
  payment_status payment_status NOT NULL DEFAULT 'unpaid',
  shipping_method shipping_method_type NOT NULL DEFAULT 'home_delivery',
  shipping_fee numeric(10, 2) NOT NULL DEFAULT 0,
  sub_total numeric(10, 2) NOT NULL DEFAULT 0,
  discount_amount numeric(10, 2) NOT NULL DEFAULT 0,
  point_discount numeric(10, 2) NOT NULL DEFAULT 0,
  total_amount numeric(10, 2) NOT NULL DEFAULT 0,
  recipient_name text NOT NULL DEFAULT '',
  recipient_phone text NOT NULL DEFAULT '',
  shipping_address text,
  store_id text,
  tracking_no text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_orders_order_no ON orders(order_no);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- ── Order Items ─────────────────────────────────────────────

CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  variant_id uuid REFERENCES product_variants(id) ON DELETE RESTRICT,
  product_name text NOT NULL DEFAULT '',
  unit_price numeric(10, 2) NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 1,
  subtotal numeric(10, 2) NOT NULL DEFAULT 0
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- ── Coupons ─────────────────────────────────────────────────

CREATE TABLE coupons (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code text NOT NULL,
  type coupon_type NOT NULL DEFAULT 'fixed_amount',
  value numeric(10, 2) NOT NULL DEFAULT 0,
  min_order_amount numeric(10, 2) NOT NULL DEFAULT 0,
  usage_limit integer,
  used_count integer NOT NULL DEFAULT 0,
  start_at timestamptz NOT NULL DEFAULT now(),
  expired_at timestamptz NOT NULL DEFAULT (now() + interval '1 month'),
  status coupon_status NOT NULL DEFAULT 'active'
);

CREATE UNIQUE INDEX idx_coupons_code ON coupons(code);

-- ── Order Coupons ───────────────────────────────────────────

CREATE TABLE order_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  coupon_id integer NOT NULL REFERENCES coupons(id) ON DELETE RESTRICT,
  discount_amount numeric(10, 2) NOT NULL DEFAULT 0
);

CREATE INDEX idx_order_coupons_order ON order_coupons(order_id);

-- ── Points ──────────────────────────────────────────────────

CREATE TABLE points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  order_id uuid REFERENCES orders(id) ON DELETE RESTRICT,
  type point_type NOT NULL,
  amount integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_points_user ON points(user_id);
CREATE INDEX idx_points_type_expires ON points(type, expires_at)
  WHERE type = 'earn' AND amount > 0;

-- ── Point Rules ─────────────────────────────────────────────

CREATE TABLE point_rules (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  earn_rate numeric(10, 4) NOT NULL DEFAULT 0.01,
  redeem_rate numeric(10, 4) NOT NULL DEFAULT 1.0,
  point_expiry_months integer NOT NULL DEFAULT 12,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

-- ── Digital Downloads ───────────────────────────────────────

CREATE TABLE digital_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id uuid NOT NULL REFERENCES order_items(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  token text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  download_count integer NOT NULL DEFAULT 0,
  max_downloads integer NOT NULL DEFAULT 5,
  expires_at timestamptz NOT NULL,
  is_revoked boolean NOT NULL DEFAULT false
);

CREATE UNIQUE INDEX idx_digital_downloads_token ON digital_downloads(token);
CREATE INDEX idx_digital_downloads_expires ON digital_downloads(expires_at)
  WHERE is_revoked = false;
CREATE INDEX idx_digital_downloads_user ON digital_downloads(user_id);

-- ── User Addresses ──────────────────────────────────────────

CREATE TABLE user_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  label text NOT NULL DEFAULT '',
  recipient_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  address_type address_type NOT NULL DEFAULT 'regular',
  zip_code text,
  city text,
  address text,
  store_id text,
  store_name text,
  is_default boolean NOT NULL DEFAULT false
);

CREATE INDEX idx_user_addresses_user ON user_addresses(user_id);

-- ── Wishlists ───────────────────────────────────────────────

CREATE TABLE wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_wishlists_user_product ON wishlists(user_id, product_id);

-- ── Shipping Methods ────────────────────────────────────────

CREATE TABLE shipping_methods (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL DEFAULT '',
  type shipping_method_type NOT NULL DEFAULT 'home_delivery',
  base_fee numeric(10, 2) NOT NULL DEFAULT 0,
  free_shipping_threshold numeric(10, 2),
  is_active boolean NOT NULL DEFAULT true
);

-- ── Cart Items (NEW - replaces in-memory cart) ──────────────

CREATE TABLE cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES product_variants(id) ON DELETE SET NULL,
  quantity integer NOT NULL DEFAULT 1,
  coupon_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_cart_items_user_product_variant
  ON cart_items(user_id, product_id, COALESCE(variant_id, '00000000-0000-0000-0000-000000000000'::uuid));
CREATE INDEX idx_cart_items_user ON cart_items(user_id);

-- ── Updated_at auto-update trigger ──────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_admins_updated_at
  BEFORE UPDATE ON admins FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_cart_items_updated_at
  BEFORE UPDATE ON cart_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
