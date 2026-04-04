-- Track which race recommendations were sent to avoid duplicates
CREATE TABLE public.race_recommendation_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  race_id    UUID NOT NULL REFERENCES public.races(id) ON DELETE CASCADE,
  sent_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, race_id)
);

CREATE INDEX idx_race_recommendation_logs_user ON public.race_recommendation_logs(user_id);

ALTER TABLE public.race_recommendation_logs ENABLE ROW LEVEL SECURITY;
