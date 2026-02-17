-- Races table
CREATE TABLE public.races (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'SP',
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  distances TEXT[] NOT NULL,
  registration_price TEXT NOT NULL,
  registration_link TEXT NOT NULL,
  registration_deadline DATE NOT NULL,
  prize_type TEXT NOT NULL CHECK (prize_type IN ('money', 'trophy', 'both', 'none')),
  prize_details TEXT,
  route_description TEXT,
  route_image_url TEXT,
  organizer TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'postponed', 'cancelled')),
  rsvp_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id),
  origin TEXT NOT NULL DEFAULT 'admin' CHECK (origin IN ('admin', 'approved_suggestion')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_races_date ON public.races(date);
CREATE INDEX idx_races_city ON public.races(city);
CREATE INDEX idx_races_status ON public.races(status);
CREATE INDEX idx_races_slug ON public.races(slug);
CREATE INDEX idx_races_coords ON public.races(latitude, longitude);

-- RLS
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
