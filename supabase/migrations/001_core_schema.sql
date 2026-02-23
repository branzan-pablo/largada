-- ============================================================
-- 001: Core Schema
-- Profiles, Races, RSVPs, Sugestões, Push Subscriptions
--
-- Nota: city_id (FK → cities) é adicionado em 002_cities_and_geo
--       após a tabela cities ser criada.
--       O trigger handle_new_user também vive em 002.
-- ============================================================


-- ──────────────────────────────────────────────────────────
-- profiles
-- ──────────────────────────────────────────────────────────
CREATE TABLE public.profiles (
  id                      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name               TEXT,
  avatar_url              TEXT,
  city                    TEXT,
  state                   TEXT DEFAULT 'SP',
  latitude                DOUBLE PRECISION,
  longitude               DOUBLE PRECISION,
  notifications_enabled   BOOLEAN NOT NULL DEFAULT false,
  notification_radius_km  INT DEFAULT 150,
  onboarding_completed    BOOLEAN DEFAULT false,
  role                    TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_city ON public.profiles(city);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);


-- ──────────────────────────────────────────────────────────
-- races
-- ──────────────────────────────────────────────────────────
CREATE TABLE public.races (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL,
  slug                  TEXT NOT NULL UNIQUE,
  date                  DATE NOT NULL,
  start_time            TIME NOT NULL,
  city                  TEXT NOT NULL,
  state                 TEXT NOT NULL DEFAULT 'SP',
  address               TEXT NOT NULL,
  latitude              DOUBLE PRECISION NOT NULL,
  longitude             DOUBLE PRECISION NOT NULL,
  distances             TEXT[] NOT NULL,
  registration_price    TEXT NOT NULL,
  registration_link     TEXT NOT NULL,
  registration_deadline DATE NOT NULL,
  prize_type            TEXT NOT NULL CHECK (prize_type IN ('money', 'trophy', 'both', 'none')),
  prize_details         TEXT,
  route_description     TEXT,
  route_image_url       TEXT,
  organizer             TEXT,
  link                  TEXT,
  notes                 TEXT,
  description           TEXT,
  status                TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'postponed', 'cancelled')),
  rsvp_count            INTEGER NOT NULL DEFAULT 0,
  is_promoted           BOOLEAN NOT NULL DEFAULT false,
  promoted_until        TIMESTAMPTZ,
  created_by            UUID REFERENCES public.profiles(id),
  origin                TEXT NOT NULL DEFAULT 'admin' CHECK (origin IN ('admin', 'approved_suggestion')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.races.promoted_until IS
  'Quando a promoção paga expira. NULL = nunca promovida ou promovida manualmente pelo admin (sem expiração).';

CREATE INDEX idx_races_date          ON public.races(date);
CREATE INDEX idx_races_city          ON public.races(city);
CREATE INDEX idx_races_status        ON public.races(status);
CREATE INDEX idx_races_slug          ON public.races(slug);
CREATE INDEX idx_races_coords        ON public.races(latitude, longitude);
CREATE INDEX idx_races_promoted_until ON public.races(promoted_until) WHERE is_promoted = true;

ALTER TABLE public.races ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Races are viewable by everyone"
  ON public.races FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert races"
  ON public.races FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update races"
  ON public.races FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ──────────────────────────────────────────────────────────
-- rsvps
-- ──────────────────────────────────────────────────────────
CREATE TABLE public.rsvps (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  race_id    UUID NOT NULL REFERENCES public.races(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, race_id)
);

CREATE INDEX idx_rsvps_user ON public.rsvps(user_id);
CREATE INDEX idx_rsvps_race ON public.rsvps(race_id);

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_rsvp_changed
  AFTER INSERT OR DELETE ON public.rsvps
  FOR EACH ROW EXECUTE FUNCTION public.update_rsvp_count();

ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "RSVPs are viewable by everyone"
  ON public.rsvps FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own RSVPs"
  ON public.rsvps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own RSVPs"
  ON public.rsvps FOR DELETE
  USING (auth.uid() = user_id);


-- ──────────────────────────────────────────────────────────
-- race_suggestions
-- ──────────────────────────────────────────────────────────
CREATE TABLE public.race_suggestions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  date        DATE,
  city        TEXT NOT NULL,
  state       TEXT,
  link        TEXT,
  notes       TEXT,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_suggestions_user   ON public.race_suggestions(user_id);
CREATE INDEX idx_suggestions_status ON public.race_suggestions(status);

ALTER TABLE public.race_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own suggestions"
  ON public.race_suggestions FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can create suggestions"
  ON public.race_suggestions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update suggestions"
  ON public.race_suggestions FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ──────────────────────────────────────────────────────────
-- push_subscriptions
-- ──────────────────────────────────────────────────────────
CREATE TABLE public.push_subscriptions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint   TEXT NOT NULL UNIQUE,
  p256dh     TEXT NOT NULL,
  auth       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_push_subscriptions_user ON public.push_subscriptions(user_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own push subscriptions"
  ON public.push_subscriptions FOR ALL
  USING (auth.uid() = user_id);
