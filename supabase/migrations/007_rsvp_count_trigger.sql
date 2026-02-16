-- Trigger to keep races.rsvp_count in sync with rsvps table
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

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS on_rsvp_changed ON public.rsvps;

CREATE TRIGGER on_rsvp_changed
  AFTER INSERT OR DELETE ON public.rsvps
  FOR EACH ROW EXECUTE FUNCTION public.update_rsvp_count();

-- Backfill: sync existing counts
UPDATE public.races r
SET rsvp_count = (SELECT COUNT(*) FROM public.rsvps WHERE race_id = r.id);
