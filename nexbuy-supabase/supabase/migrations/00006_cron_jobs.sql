-- ============================================================
-- Background Jobs (pg_cron)
-- Replaces Hangfire recurring jobs
-- ============================================================

-- Note: pg_cron extension must be enabled in Supabase dashboard
-- or via: CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ── Expire Points (daily at 02:00 UTC) ──────────────────────
-- Replaces Hangfire ExpirePointsJob

CREATE OR REPLACE FUNCTION expire_points()
RETURNS void AS $$
DECLARE
  v_group RECORD;
BEGIN
  FOR v_group IN
    SELECT user_id, SUM(amount) as total_expired, COUNT(*) as cnt
    FROM points
    WHERE type = 'earn'
      AND expires_at IS NOT NULL
      AND expires_at < now()
      AND amount > 0
    GROUP BY user_id
  LOOP
    -- Zero out expired earn records
    UPDATE points SET amount = 0
    WHERE user_id = v_group.user_id
      AND type = 'earn'
      AND expires_at IS NOT NULL
      AND expires_at < now()
      AND amount > 0;

    -- Create expire record
    INSERT INTO points (user_id, type, amount, note)
    VALUES (
      v_group.user_id,
      'expire',
      -v_group.total_expired,
      format('積點到期失效 (%s 筆)', v_group.cnt)
    );

    -- Update user balance
    UPDATE profiles
    SET point_balance = GREATEST(0, point_balance - v_group.total_expired)
    WHERE id = v_group.user_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Expire Download Tokens (hourly) ─────────────────────────
-- Replaces Hangfire ExpireDownloadTokensJob

CREATE OR REPLACE FUNCTION expire_download_tokens()
RETURNS void AS $$
BEGIN
  UPDATE digital_downloads
  SET is_revoked = true
  WHERE is_revoked = false
    AND expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Schedule cron jobs ──────────────────────────────────────
-- These will be created when pg_cron is available.
-- Run manually on Supabase dashboard if extension is not pre-enabled:
--
-- SELECT cron.schedule('expire-points', '0 2 * * *', 'SELECT expire_points()');
-- SELECT cron.schedule('expire-download-tokens', '0 * * * *', 'SELECT expire_download_tokens()');
