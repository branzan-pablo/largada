-- ============================================================
-- 012: Remove PostGIS, replace with Haversine formula
--
-- PostGIS was only used by get_race_notification_recipients().
-- The spatial_ref_sys table (auto-created by PostGIS) has RLS
-- disabled and cannot be fixed on Supabase Free plan.
--
-- The cities table already has latitude/longitude columns, so
-- Haversine in plain SQL is a drop-in replacement.
-- ============================================================


-- 1. Drop GIST index (depends on PostGIS GEOGRAPHY type)
DROP INDEX IF EXISTS idx_cities_geom;


-- 2. Drop geom generated column (depends on PostGIS)
ALTER TABLE public.cities DROP COLUMN IF EXISTS geom;


-- 3. Replace geo function with Haversine formula
--    Earth radius = 6371 km
--    Returns identical signature: TABLE(user_id UUID, distance_km NUMERIC)
CREATE OR REPLACE FUNCTION get_race_notification_recipients(p_race_city_id UUID)
RETURNS TABLE(user_id UUID, distance_km NUMERIC) AS $$
  SELECT
    p.id,
    ROUND(
      (
        2 * 6371 * asin(sqrt(
          power(sin(radians(rc.latitude - uc.latitude) / 2), 2) +
          cos(radians(uc.latitude)) * cos(radians(rc.latitude)) *
          power(sin(radians(rc.longitude - uc.longitude) / 2), 2)
        ))
      )::NUMERIC,
      1
    )
  FROM profiles p
  JOIN cities uc ON uc.id = p.city_id
  JOIN cities rc ON rc.id = p_race_city_id
  WHERE
    p.notifications_enabled = true
    AND p.city_id IS NOT NULL
    AND (
      2 * 6371 * asin(sqrt(
        power(sin(radians(rc.latitude - uc.latitude) / 2), 2) +
        cos(radians(uc.latitude)) * cos(radians(rc.latitude)) *
        power(sin(radians(rc.longitude - uc.longitude) / 2), 2)
      ))
    ) <= p.notification_radius_km
  ORDER BY 2 ASC;
$$ LANGUAGE sql STABLE;


-- 4. B-tree index on lat/lon
CREATE INDEX IF NOT EXISTS idx_cities_lat_lon
  ON public.cities(latitude, longitude);


-- 5. Drop PostGIS extension (removes spatial_ref_sys table)
--    Wrapped in exception handler in case Free plan lacks permission.
DO $$
BEGIN
  DROP EXTENSION IF EXISTS postgis CASCADE;
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Could not drop PostGIS extension (insufficient privileges). '
                 'Please disable it manually via Supabase Dashboard: '
                 'Database > Extensions > PostGIS > Disable.';
END $$;


-- 6. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
