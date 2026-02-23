-- Migration 013: Add promotion expiry tracking to races
-- Adds promoted_until timestamp so promotions expire after 30 days.
-- A daily cron (/api/cron/expire-promotions) resets is_promoted=false
-- for races whose promoted_until has passed.

ALTER TABLE public.races
  ADD COLUMN promoted_until TIMESTAMPTZ;

-- Partial index: only index rows that are actively promoted
CREATE INDEX idx_races_promoted_until
  ON public.races (promoted_until)
  WHERE is_promoted = true;

COMMENT ON COLUMN public.races.promoted_until IS
  'When the paid promotion expires. NULL means never promoted or perpetual (admin-set).';
