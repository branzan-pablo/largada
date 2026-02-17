-- Fix: drop duplicate rsvp trigger from migration 003
-- Migration 007 intended to replace it but used wrong name (on_rsvp_changed vs on_rsvp_change)
DROP TRIGGER IF EXISTS on_rsvp_change ON public.rsvps;
-- on_rsvp_changed (from 007) is the correct one and already exists

-- Backfill: re-sync rsvp_count since duplicate trigger may have doubled counts
UPDATE public.races r
SET rsvp_count = (SELECT COUNT(*) FROM public.rsvps WHERE race_id = r.id);

-- Fix: safe coordinate casting in handle_new_user (prevents failure on invalid metadata)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, city, state, latitude, longitude)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    NEW.raw_user_meta_data->>'city',
    COALESCE(NEW.raw_user_meta_data->>'state', 'SP'),
    CASE
      WHEN NEW.raw_user_meta_data->>'latitude' ~ '^-?[0-9]+\.?[0-9]*$'
      THEN (NEW.raw_user_meta_data->>'latitude')::DOUBLE PRECISION
      ELSE NULL
    END,
    CASE
      WHEN NEW.raw_user_meta_data->>'longitude' ~ '^-?[0-9]+\.?[0-9]*$'
      THEN (NEW.raw_user_meta_data->>'longitude')::DOUBLE PRECISION
      ELSE NULL
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add missing index on profiles.city (used in notification filtering)
CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles(city);
