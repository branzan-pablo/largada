-- ============================================================
-- 016: Fix notification recipients — use race lat/lng instead of city_id
--
-- The old get_race_notification_recipients(UUID) uses INNER JOIN
-- on cities table, silently excluding users who have lat/lng on
-- their profile but no city_id (legacy profile update path).
--
-- This new function:
--   1. Accepts race lat/lng directly (works even without city_id)
--   2. Uses LEFT JOIN cities + COALESCE to prefer city coords but
--      fall back to profile coords
--   3. Includes users with city_id OR with profile lat/lng
-- ============================================================


CREATE OR REPLACE FUNCTION get_notification_recipients_by_location(
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION
)
RETURNS TABLE(user_id UUID, distance_km NUMERIC) AS $$
  SELECT
    p.id,
    ROUND((
      2 * 6371 * asin(sqrt(
        power(sin(radians(p_lat - COALESCE(uc.latitude, p.latitude)) / 2), 2) +
        cos(radians(COALESCE(uc.latitude, p.latitude))) * cos(radians(p_lat)) *
        power(sin(radians(p_lng - COALESCE(uc.longitude, p.longitude)) / 2), 2)
      ))
    )::NUMERIC, 1)
  FROM profiles p
  LEFT JOIN cities uc ON uc.id = p.city_id
  WHERE
    p.notifications_enabled = true
    AND (p.city_id IS NOT NULL OR (p.latitude IS NOT NULL AND p.longitude IS NOT NULL))
    AND (
      2 * 6371 * asin(sqrt(
        power(sin(radians(p_lat - COALESCE(uc.latitude, p.latitude)) / 2), 2) +
        cos(radians(COALESCE(uc.latitude, p.latitude))) * cos(radians(p_lat)) *
        power(sin(radians(p_lng - COALESCE(uc.longitude, p.longitude)) / 2), 2)
      ))
    ) <= p.notification_radius_km
  ORDER BY 2 ASC;
$$ LANGUAGE sql STABLE SET search_path = public;


-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
