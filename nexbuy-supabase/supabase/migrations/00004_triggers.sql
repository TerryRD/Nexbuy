-- ============================================================
-- Database Triggers
-- ============================================================

-- ── Auto-create profile on user signup ──────────────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name, preferred_locale)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'preferred_locale', 'zh-TW')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── Grant order points on completion ────────────────────────
-- Replaces Hangfire GrantOrderPointsJob
-- Triggers immediately when order status changes to 'completed'

CREATE OR REPLACE FUNCTION grant_order_points()
RETURNS TRIGGER AS $$
DECLARE
  v_rule RECORD;
  v_points integer;
BEGIN
  -- Only trigger when status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    -- Check if points already granted for this order
    IF EXISTS (SELECT 1 FROM points WHERE order_id = NEW.id AND type = 'earn') THEN
      RETURN NEW;
    END IF;

    -- Get point rules
    SELECT * INTO v_rule FROM point_rules LIMIT 1;
    IF NOT FOUND THEN
      RETURN NEW;
    END IF;

    -- Calculate points
    v_points := floor(NEW.total_amount * v_rule.earn_rate);
    IF v_points <= 0 THEN
      RETURN NEW;
    END IF;

    -- Grant points
    INSERT INTO points (user_id, order_id, type, amount, expires_at, note)
    VALUES (
      NEW.user_id,
      NEW.id,
      'earn',
      v_points,
      now() + make_interval(months => v_rule.point_expiry_months),
      format('訂單 %s 消費回饋', NEW.order_no)
    );

    -- Update user balance
    UPDATE profiles
    SET point_balance = point_balance + v_points
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_grant_order_points
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION grant_order_points();

-- ── Set payment_status to 'paid' when order status changes to 'paid' ──

CREATE OR REPLACE FUNCTION sync_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'paid' AND OLD.status = 'pending' THEN
    NEW.payment_status := 'paid';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_payment_status
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION sync_payment_status();
