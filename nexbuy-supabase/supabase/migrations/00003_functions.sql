-- ============================================================
-- Core Business Logic Functions
-- Replaces C# OrderService, CartService business logic
-- ============================================================

-- ── Create Order (transactional, replaces OrderService.CreateOrderAsync) ──

CREATE OR REPLACE FUNCTION create_order(
  p_user_id uuid,
  p_shipping_address_id uuid DEFAULT NULL,
  p_shipping_method_id integer DEFAULT NULL,
  p_recipient_name text DEFAULT '',
  p_recipient_phone text DEFAULT '',
  p_shipping_address text DEFAULT NULL,
  p_store_id text DEFAULT NULL,
  p_points_to_redeem integer DEFAULT 0,
  p_note text DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  v_order_id uuid := gen_random_uuid();
  v_order_no text;
  v_cart_item RECORD;
  v_product RECORD;
  v_variant RECORD;
  v_unit_price numeric(10,2);
  v_available_stock integer;
  v_item_subtotal numeric(10,2);
  v_sub_total numeric(10,2) := 0;
  v_coupon_code text;
  v_coupon RECORD;
  v_coupon_discount numeric(10,2) := 0;
  v_point_discount numeric(10,2) := 0;
  v_shipping_fee numeric(10,2) := 0;
  v_total_amount numeric(10,2);
  v_user RECORD;
  v_rule RECORD;
  v_shipping RECORD;
  v_addr RECORD;
  v_item_id uuid;
  v_product_name text;
  v_shipping_type shipping_method_type := 'home_delivery';
BEGIN
  -- Validate user
  SELECT * INTO v_user FROM profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'USER_NOT_FOUND';
  END IF;
  IF v_user.status != 'active' THEN
    RAISE EXCEPTION 'USER_DISABLED';
  END IF;

  -- Validate cart has items
  IF NOT EXISTS (SELECT 1 FROM cart_items WHERE user_id = p_user_id) THEN
    RAISE EXCEPTION 'CART_EMPTY';
  END IF;

  -- Get coupon code from cart
  SELECT coupon_code INTO v_coupon_code
  FROM cart_items
  WHERE user_id = p_user_id AND coupon_code IS NOT NULL
  LIMIT 1;

  -- Generate unique order number: ORD + YYYYMMDD + 4-digit random
  v_order_no := 'ORD' || to_char(now(), 'YYYYMMDD') || lpad((floor(random() * 9000 + 1000))::text, 4, '0');

  -- Resolve shipping address
  IF p_shipping_address_id IS NOT NULL THEN
    SELECT * INTO v_addr
    FROM user_addresses
    WHERE id = p_shipping_address_id AND user_id = p_user_id;

    IF FOUND THEN
      p_recipient_name := v_addr.recipient_name;
      p_recipient_phone := v_addr.phone;
      p_shipping_address := concat_ws(' ', v_addr.zip_code, v_addr.city, v_addr.address);
      p_store_id := v_addr.store_id;
    END IF;
  END IF;

  -- Process each cart item
  FOR v_cart_item IN SELECT * FROM cart_items WHERE user_id = p_user_id LOOP
    -- Lock product row
    SELECT * INTO v_product FROM products WHERE id = v_cart_item.product_id FOR UPDATE;
    IF NOT FOUND OR v_product.status != 'active' THEN
      RAISE EXCEPTION 'PRODUCT_NOT_FOUND:%', v_cart_item.product_id;
    END IF;

    -- Determine price and stock
    IF v_cart_item.variant_id IS NOT NULL THEN
      SELECT * INTO v_variant FROM product_variants WHERE id = v_cart_item.variant_id FOR UPDATE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'VARIANT_NOT_FOUND:%', v_cart_item.variant_id;
      END IF;
      v_available_stock := v_variant.stock;
      v_unit_price := v_product.price + v_variant.price_adjustment;
    ELSE
      v_available_stock := v_product.stock;
      v_unit_price := v_product.price;
    END IF;

    -- Validate stock
    IF v_cart_item.quantity > v_available_stock THEN
      RAISE EXCEPTION 'INSUFFICIENT_STOCK:%', v_cart_item.product_id;
    END IF;

    -- Deduct stock
    IF v_cart_item.variant_id IS NOT NULL THEN
      UPDATE product_variants SET stock = stock - v_cart_item.quantity WHERE id = v_cart_item.variant_id;
    ELSE
      UPDATE products SET stock = stock - v_cart_item.quantity WHERE id = v_cart_item.product_id;
    END IF;

    v_item_subtotal := v_unit_price * v_cart_item.quantity;
    v_sub_total := v_sub_total + v_item_subtotal;

    -- Get product name (first available translation)
    SELECT name INTO v_product_name
    FROM product_translations
    WHERE product_id = v_cart_item.product_id
    ORDER BY CASE locale WHEN 'zh-TW' THEN 0 WHEN 'en' THEN 1 ELSE 2 END
    LIMIT 1;

    v_item_id := gen_random_uuid();

    -- Create order item
    INSERT INTO order_items (id, order_id, product_id, variant_id, product_name, unit_price, quantity, subtotal)
    VALUES (v_item_id, v_order_id, v_cart_item.product_id, v_cart_item.variant_id,
            COALESCE(v_product_name, ''), v_unit_price, v_cart_item.quantity, v_item_subtotal);

    -- Create digital download if digital product
    IF v_product.type = 'digital' THEN
      INSERT INTO digital_downloads (order_item_id, user_id, max_downloads, expires_at)
      VALUES (
        v_item_id,
        p_user_id,
        COALESCE(v_product.max_downloads, 5),
        now() + make_interval(hours => COALESCE(v_product.download_expiry_hours, 72))
      );
    END IF;
  END LOOP;

  -- Apply coupon discount
  IF v_coupon_code IS NOT NULL THEN
    SELECT * INTO v_coupon
    FROM coupons
    WHERE code = v_coupon_code
      AND status = 'active'
      AND start_at <= now()
      AND expired_at > now()
    FOR UPDATE;

    IF FOUND THEN
      -- Check usage limit
      IF v_coupon.usage_limit IS NOT NULL AND v_coupon.used_count >= v_coupon.usage_limit THEN
        RAISE EXCEPTION 'COUPON_LIMIT_REACHED';
      END IF;

      -- Check minimum order amount
      IF v_sub_total < v_coupon.min_order_amount THEN
        RAISE EXCEPTION 'MIN_ORDER_NOT_MET';
      END IF;

      -- Calculate discount
      IF v_coupon.type = 'fixed_amount' THEN
        v_coupon_discount := LEAST(v_coupon.value, v_sub_total);
      ELSE -- percentage
        v_coupon_discount := ROUND(v_sub_total * v_coupon.value / 100, 2);
      END IF;

      -- Increment usage
      UPDATE coupons SET used_count = used_count + 1 WHERE id = v_coupon.id;

      -- Create order coupon record
      INSERT INTO order_coupons (order_id, coupon_id, discount_amount)
      VALUES (v_order_id, v_coupon.id, v_coupon_discount);
    END IF;
  END IF;

  -- Apply points discount
  IF p_points_to_redeem > 0 THEN
    IF v_user.point_balance < p_points_to_redeem THEN
      RAISE EXCEPTION 'INSUFFICIENT_POINTS';
    END IF;

    SELECT * INTO v_rule FROM point_rules LIMIT 1;
    v_point_discount := ROUND(p_points_to_redeem * COALESCE(v_rule.redeem_rate, 1), 2);

    -- Deduct points from user
    UPDATE profiles
    SET point_balance = point_balance - p_points_to_redeem
    WHERE id = p_user_id;

    -- Create point record
    INSERT INTO points (user_id, order_id, type, amount, note)
    VALUES (p_user_id, v_order_id, 'redeem', -p_points_to_redeem, '訂單點數折抵');
  END IF;

  -- Calculate shipping fee
  IF p_shipping_method_id IS NOT NULL THEN
    SELECT * INTO v_shipping
    FROM shipping_methods
    WHERE id = p_shipping_method_id AND is_active = true;

    IF FOUND THEN
      v_shipping_fee := v_shipping.base_fee;
      v_shipping_type := v_shipping.type;
      IF v_shipping.free_shipping_threshold IS NOT NULL AND v_sub_total >= v_shipping.free_shipping_threshold THEN
        v_shipping_fee := 0;
      END IF;
    END IF;
  END IF;

  -- Calculate total
  v_total_amount := GREATEST(0, v_sub_total - v_coupon_discount - v_point_discount + v_shipping_fee);

  -- Create order
  INSERT INTO orders (
    id, order_no, user_id, status, payment_method, payment_status,
    shipping_method, shipping_fee, sub_total, discount_amount, point_discount, total_amount,
    recipient_name, recipient_phone, shipping_address, store_id, note
  ) VALUES (
    v_order_id, v_order_no, p_user_id, 'pending', 'manual_confirmation', 'unpaid',
    v_shipping_type, v_shipping_fee, v_sub_total, v_coupon_discount, v_point_discount, v_total_amount,
    p_recipient_name, p_recipient_phone, p_shipping_address, p_store_id, p_note
  );

  -- Clear cart
  DELETE FROM cart_items WHERE user_id = p_user_id;

  -- Return order info
  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'order_no', v_order_no,
    'total_amount', v_total_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Cancel Order (replaces OrderService.CancelOrderAsync) ───

CREATE OR REPLACE FUNCTION cancel_order(
  p_user_id uuid,
  p_order_no text
) RETURNS void AS $$
DECLARE
  v_order RECORD;
  v_item RECORD;
  v_rule RECORD;
  v_restored_points integer;
BEGIN
  -- Get and lock order
  SELECT * INTO v_order
  FROM orders
  WHERE order_no = p_order_no AND user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND';
  END IF;

  IF v_order.status != 'pending' THEN
    RAISE EXCEPTION 'ORDER_CANNOT_CANCEL';
  END IF;

  -- Restore stock for each item
  FOR v_item IN SELECT * FROM order_items WHERE order_id = v_order.id LOOP
    IF v_item.variant_id IS NOT NULL THEN
      UPDATE product_variants SET stock = stock + v_item.quantity WHERE id = v_item.variant_id;
    ELSE
      UPDATE products SET stock = stock + v_item.quantity WHERE id = v_item.product_id;
    END IF;
  END LOOP;

  -- Restore redeemed points
  IF v_order.point_discount > 0 THEN
    SELECT * INTO v_rule FROM point_rules LIMIT 1;
    v_restored_points := CEIL(v_order.point_discount / COALESCE(v_rule.redeem_rate, 1));

    UPDATE profiles
    SET point_balance = point_balance + v_restored_points
    WHERE id = p_user_id;

    INSERT INTO points (user_id, order_id, type, amount, note)
    VALUES (p_user_id, v_order.id, 'adjust', v_restored_points, '取消訂單 ' || p_order_no || ' 退還點數');
  END IF;

  -- Revoke digital downloads
  UPDATE digital_downloads SET is_revoked = true
  WHERE order_item_id IN (SELECT id FROM order_items WHERE order_id = v_order.id);

  -- Update order status
  UPDATE orders SET status = 'cancelled' WHERE id = v_order.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Return Order (replaces OrderService.ReturnOrderAsync) ───

CREATE OR REPLACE FUNCTION return_order(
  p_user_id uuid,
  p_order_no text
) RETURNS void AS $$
DECLARE
  v_order RECORD;
BEGIN
  SELECT * INTO v_order
  FROM orders
  WHERE order_no = p_order_no AND user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND';
  END IF;

  IF v_order.status NOT IN ('paid', 'processing', 'shipped', 'completed') THEN
    RAISE EXCEPTION 'ORDER_CANNOT_RETURN';
  END IF;

  UPDATE orders SET payment_status = 'refunding' WHERE id = v_order.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
