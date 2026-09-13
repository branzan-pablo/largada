-- Keep event cancellation separate from administrative rejection.
-- Scraped races historically became "cancelled" when the admin rejected them
-- or clicked the misleading delete action, so migrate only that population.

ALTER TABLE public.races DROP CONSTRAINT IF EXISTS races_status_check;

ALTER TABLE public.races ADD CONSTRAINT races_status_check
  CHECK (status IN (
    'confirmed',
    'postponed',
    'cancelled',
    'pending_review',
    'rejected'
  ));

UPDATE public.races
SET
  status = 'rejected',
  updated_at = now()
WHERE origin = 'scraper'
  AND status = 'cancelled';
