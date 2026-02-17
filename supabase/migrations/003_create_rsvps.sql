-- RSVPs table
CREATE TABLE public.rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  race_id UUID NOT NULL REFERENCES public.races(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, race_id)
);

-- Indexes
CREATE INDEX idx_rsvps_user ON public.rsvps(user_id);
CREATE INDEX idx_rsvps_race ON public.rsvps(race_id);

-- Trigger to keep rsvp_count in sync (with GREATEST to prevent negative counts)
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

-- RLS
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
