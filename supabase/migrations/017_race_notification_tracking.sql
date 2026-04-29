-- ============================================================
-- 017: Track when each race's "new race" push was dispatched.
--
-- Why: notifyNewRace was previously fire-and-forget at API time.
-- Races inserted by scrapers (status='pending_review') or written
-- directly via SQL never went through the API path, so their push
-- was silently lost. The new backlog cron uses this column to
-- pick up confirmed races that were never notified, while
-- notifyNewRace itself stamps it on success/early-return so the
-- API path stays idempotent against the cron.
-- ============================================================

ALTER TABLE public.races
  ADD COLUMN IF NOT EXISTS notification_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_races_notification_pending
  ON public.races(status, created_at DESC)
  WHERE status = 'confirmed' AND notification_sent_at IS NULL;
