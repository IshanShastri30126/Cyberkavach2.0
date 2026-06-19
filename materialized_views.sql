-- ==========================================================
-- CyberKavach 2.0 — Database Performance & Analytics Optimizations
-- ==========================================================

-- 1. Indexing Optimizations for High-Traffic Scans & Lookups
CREATE INDEX IF NOT EXISTS idx_attendance_user_event ON attendance (user_id, event_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications (user_id) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_certificates_unique_code ON certificates (unique_code);
CREATE INDEX IF NOT EXISTS idx_appreciation_points_receiver ON appreciation_points (receiver_id, points);

-- 2. Materialized View for Gamification Leaderboard
-- Aggregates total points per user and pre-ranks them to avoid massive SQL SUM() operations on runtime API requests
CREATE MATERIALIZED VIEW IF NOT EXISTS leaderboard_summary AS
SELECT 
  u.id AS user_id,
  u.name,
  u.email,
  u.department,
  COALESCE(SUM(
    CASE 
      WHEN ap.is_deduction = true THEN -ap.points 
      ELSE ap.points 
    END
  ), 0) AS total_points,
  RANK() OVER (ORDER BY COALESCE(SUM(CASE WHEN ap.is_deduction = true THEN -ap.points ELSE ap.points END), 0) DESC) AS rank
FROM users u
LEFT JOIN appreciation_points ap ON u.id = ap.receiver_id
WHERE u.is_active = true AND u.is_approved = true
GROUP BY u.id, u.name, u.email, u.department;

-- Create unique index on Materialized View to support concurrent updates (no locking)
CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboard_summary_userid ON leaderboard_summary (user_id);

-- 3. Procedure to Refresh the Materialized View Concurrently
CREATE OR REPLACE PROCEDURE refresh_leaderboard()
LANGUAGE plpgsql
AS $$
BEGIN
  -- CONCURRENT refresh ensures read queries can execute normally while the view updates
  REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_summary;
END;
$$;
