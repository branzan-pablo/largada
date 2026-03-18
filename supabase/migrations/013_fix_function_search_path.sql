-- ============================================================
-- 013: Set search_path on all public functions
--
-- Fixes "Function Search Path Mutable" warnings from the
-- Supabase Security Advisor. Adding SET search_path = public
-- prevents search-path hijacking without changing any logic.
-- ============================================================


-- 1. update_rsvp_count (trigger on rsvps)
CREATE OR REPLACE FUNCTION public.update_rsvp_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.races SET rsvp_count = rsvp_count + 1 WHERE id = NEW.race_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.races SET rsvp_count = GREATEST(rsvp_count - 1, 0) WHERE id = OLD.race_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 2. get_race_notification_recipients (Haversine)
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
$$ LANGUAGE sql STABLE SET search_path = public;


-- 3. handle_new_user (trigger on auth.users)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _city_id UUID;
BEGIN
  IF NEW.raw_user_meta_data->>'city' IS NOT NULL THEN
    SELECT id INTO _city_id FROM public.cities
    WHERE LOWER(name) = LOWER(NEW.raw_user_meta_data->>'city')
    LIMIT 1;
  END IF;

  INSERT INTO public.profiles (
    id, full_name, avatar_url, city, city_id, state,
    latitude, longitude, notifications_enabled,
    onboarding_completed, notification_radius_km
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    NEW.raw_user_meta_data->>'city',
    _city_id,
    COALESCE(NEW.raw_user_meta_data->>'state', 'SP'),
    CASE WHEN NEW.raw_user_meta_data->>'latitude' ~ '^-?[0-9]+\.?[0-9]*$'
      THEN (NEW.raw_user_meta_data->>'latitude')::DOUBLE PRECISION ELSE NULL END,
    CASE WHEN NEW.raw_user_meta_data->>'longitude' ~ '^-?[0-9]+\.?[0-9]*$'
      THEN (NEW.raw_user_meta_data->>'longitude')::DOUBLE PRECISION ELSE NULL END,
    false,
    (_city_id IS NOT NULL),
    150
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 4. search_cities
CREATE OR REPLACE FUNCTION search_cities(p_query TEXT, p_limit INT DEFAULT 10)
RETURNS TABLE(id UUID, name VARCHAR, state_code CHAR(2), slug VARCHAR, latitude DECIMAL, longitude DECIMAL) AS $$
  SELECT c.id, c.name, c.state_code, c.slug, c.latitude, c.longitude
  FROM public.cities c
  WHERE c.active = true
    AND (c.name ILIKE '%' || p_query || '%'
         OR unaccent(c.name) ILIKE '%' || unaccent(p_query) || '%')
  ORDER BY
    CASE WHEN c.name ILIKE p_query || '%' THEN 0 ELSE 1 END,
    c.name
  LIMIT p_limit;
$$ LANGUAGE sql STABLE SET search_path = public;


-- 5. get_random_cities
CREATE OR REPLACE FUNCTION get_random_cities(p_limit INT DEFAULT 60)
RETURNS TABLE(name VARCHAR, state_code CHAR(2)) AS $$
  SELECT name, state_code
  FROM public.cities
  WHERE active = true
  ORDER BY RANDOM()
  LIMIT p_limit;
$$ LANGUAGE sql VOLATILE SET search_path = public;


-- 6. update_payment_updated_at (trigger on payment tables)
CREATE OR REPLACE FUNCTION public.update_payment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;
