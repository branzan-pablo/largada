-- ============================================================
-- 019: AI infrastructure
--
-- 1. ai_call_logs — telemetry for every LLM/embedding call so we
--    can audit cost, latency, and failure rate per task.
-- 2. pgvector extension + races.embedding column for semantic
--    dedup (#3) and future semantic search/recommendation (#9, #15).
-- 3. match_races_semantic RPC — cosine-similarity lookup used by
--    insertScrapedRaces to skip near-duplicates.
-- ============================================================


-- ──────────────────────────────────────────────────────────
-- 1. ai_call_logs
-- ──────────────────────────────────────────────────────────
CREATE TABLE public.ai_call_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task          TEXT NOT NULL,
  model         TEXT,
  duration_ms   INTEGER NOT NULL,
  input_tokens  INTEGER,
  output_tokens INTEGER,
  success       BOOLEAN NOT NULL,
  error         TEXT,
  metadata      JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_call_logs_task       ON public.ai_call_logs(task);
CREATE INDEX idx_ai_call_logs_created_at ON public.ai_call_logs(created_at DESC);
CREATE INDEX idx_ai_call_logs_success    ON public.ai_call_logs(success) WHERE success = false;

ALTER TABLE public.ai_call_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read ai call logs"
  ON public.ai_call_logs FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

COMMENT ON TABLE public.ai_call_logs IS
  'Per-call telemetry for AI provider usage. Writes happen via service role from src/lib/ai/observability.ts.';


-- ──────────────────────────────────────────────────────────
-- 2. pgvector + races.embedding
-- ──────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE public.races ADD COLUMN embedding vector(768);

COMMENT ON COLUMN public.races.embedding IS
  'Fingerprint embedding (name | city | date | organizer) from Google text-embedding-004 (768d). Used for semantic dedup and recommendation re-ranking.';

-- HNSW is the right default for our volume (<100k rows expected for years).
CREATE INDEX idx_races_embedding ON public.races
  USING hnsw (embedding vector_cosine_ops);


-- ──────────────────────────────────────────────────────────
-- 3. match_races_semantic — semantic dedup helper
--    Returns races above similarity threshold with same date (±1 day).
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.match_races_semantic(
  query_embedding vector(768),
  query_date      DATE,
  match_threshold FLOAT DEFAULT 0.92,
  match_count     INT DEFAULT 5,
  date_window_days INT DEFAULT 1
)
RETURNS TABLE (
  id         UUID,
  name       TEXT,
  city       TEXT,
  date       DATE,
  similarity FLOAT
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    r.id,
    r.name,
    r.city,
    r.date,
    1 - (r.embedding <=> query_embedding) AS similarity
  FROM public.races r
  WHERE r.embedding IS NOT NULL
    AND ABS(r.date - query_date) <= date_window_days
    AND 1 - (r.embedding <=> query_embedding) >= match_threshold
  ORDER BY r.embedding <=> query_embedding
  LIMIT match_count;
$$;

COMMENT ON FUNCTION public.match_races_semantic IS
  'Cosine-similarity dedup: returns existing races within date window above similarity threshold.';


-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
