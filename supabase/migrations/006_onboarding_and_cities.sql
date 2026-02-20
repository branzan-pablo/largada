-- ============================================================
-- Migration 007: Onboarding obrigatório + Cidades + Raio geográfico
-- ============================================================

-- 1. Habilitar extensões
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 2. Tabela de cidades
CREATE TABLE public.cities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL,
  slug        VARCHAR(100) UNIQUE NOT NULL,
  state_code  CHAR(2) NOT NULL,
  latitude    DECIMAL(10, 7) NOT NULL,
  longitude   DECIMAL(10, 7) NOT NULL,
  geom        GEOGRAPHY(POINT, 4326)
              GENERATED ALWAYS AS (ST_MakePoint(longitude::double precision, latitude::double precision)) STORED,
  active      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cities_geom ON public.cities USING GIST(geom);
CREATE INDEX idx_cities_slug ON public.cities(slug);

ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cities_public_read" ON public.cities FOR SELECT USING (true);

-- 3. Seed de cidades: ver migration 007_all_brazilian_cities.sql (5.571 municípios)

-- 4. Novas colunas em profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES public.cities(id),
  ADD COLUMN IF NOT EXISTS notification_radius_km INT DEFAULT 150,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

ALTER TABLE public.profiles
  ALTER COLUMN notifications_enabled SET DEFAULT false;

CREATE INDEX idx_profiles_city_notifications
  ON public.profiles(city_id, notifications_enabled)
  WHERE city_id IS NOT NULL AND notifications_enabled = true;

-- 5. Nova coluna em races
ALTER TABLE public.races
  ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES public.cities(id);

-- 6. Vincular corridas existentes à tabela cities
UPDATE races r SET city_id = c.id
FROM public.cities c
WHERE r.city_id IS NULL
  AND r.city IS NOT NULL
  AND LOWER(TRIM(r.city)) = LOWER(c.name);

-- 7. Vincular profiles existentes à tabela cities
UPDATE profiles p SET city_id = c.id
FROM public.cities c
WHERE p.city_id IS NULL
  AND p.city IS NOT NULL
  AND (LOWER(TRIM(p.city)) = LOWER(c.name)
       OR unaccent(LOWER(TRIM(p.city))) = unaccent(LOWER(c.name)));

-- Marcar usuários com cidade como onboarding concluído
UPDATE profiles SET onboarding_completed = true
WHERE city_id IS NOT NULL;

-- 7b. Garantir NOT NULL em notifications_enabled
UPDATE profiles SET notifications_enabled = false WHERE notifications_enabled IS NULL;
ALTER TABLE public.profiles ALTER COLUMN notifications_enabled SET NOT NULL;

-- 8. Atualizar trigger handle_new_user (resolve city_id automaticamente)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _city_id UUID;
BEGIN
  -- Resolver city_id pelo nome da cidade na tabela cities
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Função: buscar destinatários de notificação por raio geográfico
CREATE OR REPLACE FUNCTION get_race_notification_recipients(p_race_city_id UUID)
RETURNS TABLE(user_id UUID, distance_km NUMERIC) AS $$
  SELECT
    p.id,
    ROUND(ST_Distance(uc.geom, rc.geom)::NUMERIC / 1000, 1)
  FROM profiles p
  JOIN cities uc ON uc.id = p.city_id
  JOIN cities rc ON rc.id = p_race_city_id
  WHERE
    p.notifications_enabled = true
    AND p.city_id IS NOT NULL
    AND ST_DWithin(
      uc.geom,
      rc.geom,
      p.notification_radius_km * 1000
    )
  ORDER BY 2 ASC;
$$ LANGUAGE sql STABLE;

-- 10. Função: autocomplete de cidades
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
$$ LANGUAGE sql STABLE;

-- 11. Recarregar schema cache do PostgREST (necessário para novas colunas)
NOTIFY pgrst, 'reload schema';
