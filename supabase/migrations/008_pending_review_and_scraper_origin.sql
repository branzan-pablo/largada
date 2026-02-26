-- Add pending_review status and scraper origin to races table

ALTER TABLE races DROP CONSTRAINT IF EXISTS races_status_check;
ALTER TABLE races ADD CONSTRAINT races_status_check
  CHECK (status IN ('confirmed', 'postponed', 'cancelled', 'pending_review'));

ALTER TABLE races DROP CONSTRAINT IF EXISTS races_origin_check;
ALTER TABLE races ADD CONSTRAINT races_origin_check
  CHECK (origin IN ('admin', 'approved_suggestion', 'scraper'));
