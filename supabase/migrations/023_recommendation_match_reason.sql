-- ============================================================
-- 023: Personalized recommendation tracking (Sprint 4 #9 + #14)
--
-- Extends race_recommendation_logs so each entry now carries:
--   - the human-readable match_reason shown in the card and push
--   - the breakdown of the score (heuristic, embedding sim, final)
--   - lifecycle timestamps for downstream click/register tracking
--
-- The cron (race-recommendations) writes the row on the push send;
-- click/register columns are populated by future tracking endpoints
-- and feed back into the model accuracy review.
-- ============================================================


ALTER TABLE public.race_recommendation_logs
  ADD COLUMN match_reason            TEXT,
  ADD COLUMN match_score_breakdown   JSONB,
  ADD COLUMN clicked_at              TIMESTAMPTZ,
  ADD COLUMN registered_at           TIMESTAMPTZ;

COMMENT ON COLUMN public.race_recommendation_logs.match_reason IS
  'Short PT-BR explanation shown in the "Pra você porque..." chip and in the push body.';

COMMENT ON COLUMN public.race_recommendation_logs.match_score_breakdown IS
  'JSON debug: { heuristic, cosine_sim, final, source }. Used to evaluate model accuracy.';

COMMENT ON COLUMN public.race_recommendation_logs.clicked_at IS
  'When the user opened the race detail from the recommendation push. Null if not clicked yet.';

COMMENT ON COLUMN public.race_recommendation_logs.registered_at IS
  'When the user clicked the registration link from the recommended race. Null if not yet.';

CREATE INDEX idx_race_recommendation_logs_race_user
  ON public.race_recommendation_logs(race_id, user_id);


-- ──────────────────────────────────────────────────────────
-- Allow the user to read their own recommendation log entries
-- so the listing API can join match_reason into the race feed.
-- ──────────────────────────────────────────────────────────
CREATE POLICY "Users can read own recommendation logs"
  ON public.race_recommendation_logs FOR SELECT
  USING (auth.uid() = user_id);


NOTIFY pgrst, 'reload schema';
