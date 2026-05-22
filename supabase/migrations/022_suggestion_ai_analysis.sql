-- ============================================================
-- 022: AI moderation analysis on race_suggestions
--
-- Adds a JSONB column where the admin-on-demand "Analisar com IA"
-- task stores its verdict, the semantic duplicate hit (if any),
-- and the pre-extracted race fields pulled from the suggestion
-- link. Shape lives in src/lib/ai/schemas/suggestion-analysis.ts.
--
-- Also adds match_races_semantic_any_date, a sibling RPC that
-- skips the date window so suggestions submitted without a date
-- can still be deduplicated against the existing base.
-- ============================================================


ALTER TABLE public.race_suggestions
  ADD COLUMN ai_analysis JSONB,
  ADD COLUMN ai_analysis_updated_at TIMESTAMPTZ;

COMMENT ON COLUMN public.race_suggestions.ai_analysis IS
  'LLM moderation output. Shape: { verdict, confidence, summary, duplicate_of, extracted, flags }. Populated by /api/admin/ai/analyze-suggestion.';


-- Index for filtering "already analyzed" without scanning the JSONB body.
CREATE INDEX idx_race_suggestions_ai_analysis_done
  ON public.race_suggestions ((ai_analysis IS NOT NULL));


-- ──────────────────────────────────────────────────────────
-- match_races_semantic_any_date: dedup hint when date is null.
-- Same threshold/return shape as match_races_semantic, sans the
-- date window. Used by suggestion analysis when the suggestion
-- carries no date.
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.match_races_semantic_any_date(
  query_embedding vector(768),
  match_threshold FLOAT DEFAULT 0.85,
  match_count     INT DEFAULT 5
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
    AND 1 - (r.embedding <=> query_embedding) >= match_threshold
  ORDER BY r.embedding <=> query_embedding
  LIMIT match_count;
$$;

COMMENT ON FUNCTION public.match_races_semantic_any_date IS
  'Date-agnostic version of match_races_semantic. Use when ranking suggestions whose date is unknown.';


NOTIFY pgrst, 'reload schema';
