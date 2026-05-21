-- ============================================================
-- 021: Resize races.embedding from vector(1536) to vector(768)
--
-- Migration 019 originally provisioned vector(1536) for OpenAI's
-- text-embedding-3-small. The provider was swapped to Google Gemini
-- (gemini-embedding-001 with outputDimensionality=768) before any
-- embeddings landed in production, but staging had the original
-- migration applied. pgvector treats vector(N) and vector(M) as
-- distinct types, so we drop and re-add the column rather than
-- ALTER TYPE. No data loss because all rows have NULL embeddings.
--
-- Also recreates match_races_semantic with the new parameter type.
-- ============================================================


DROP INDEX IF EXISTS idx_races_embedding;

ALTER TABLE public.races DROP COLUMN IF EXISTS embedding;

ALTER TABLE public.races ADD COLUMN embedding vector(768);

COMMENT ON COLUMN public.races.embedding IS
  'Fingerprint embedding (name | city | date | organizer) from Google gemini-embedding-001 truncated to 768d via outputDimensionality. Used for semantic dedup and recommendation re-ranking.';

CREATE INDEX idx_races_embedding ON public.races
  USING hnsw (embedding vector_cosine_ops);


-- RPC signature must match the new column type.
DROP FUNCTION IF EXISTS public.match_races_semantic(vector, date, float, int, int);

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


NOTIFY pgrst, 'reload schema';
