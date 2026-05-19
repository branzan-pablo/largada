-- ============================================================
-- 020: Structured prize data
--
-- Adds races.prize_structured (JSONB) populated by LLM extraction
-- from the free-text prize_details column. Powers the "💰 R$ X"
-- badge in race-card and the future "premiação ≥ R$N" filter.
--
-- Shape (see src/lib/ai/schemas/prize-extraction.ts):
--   {
--     "total_money_brl": 1000 | null,
--     "top_n": 3 | null,
--     "by_category": true,
--     "max_per_position": 500 | null,
--     "has_money": true,
--     "has_trophy": false,
--     "notes": "..." | null
--   }
-- ============================================================


ALTER TABLE public.races
  ADD COLUMN prize_structured JSONB,
  ADD COLUMN prize_structured_updated_at TIMESTAMPTZ;

COMMENT ON COLUMN public.races.prize_structured IS
  'LLM-extracted structured prize info. Null = not enriched yet. Shape defined in src/lib/ai/schemas/prize-extraction.ts.';

-- Indexed lookup for the future "premiação ≥ R$X" filter.
CREATE INDEX idx_races_prize_total
  ON public.races (((prize_structured->>'total_money_brl')::INT))
  WHERE prize_structured IS NOT NULL;


-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
