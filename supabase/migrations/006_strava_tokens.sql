-- ============================================================
-- 006: Strava OAuth — Token Storage + Athlete ID Index
--
-- Adiciona coluna strava_athlete_id na tabela profiles para
-- lookup indexado, e cria tabela strava_tokens para armazenar
-- access/refresh tokens (exigido pelo Strava API Agreement
-- para suporte a deautorização e webhooks).
-- ============================================================


-- ──────────────────────────────────────────────────────────
-- profiles: adicionar strava_athlete_id
-- ──────────────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN strava_athlete_id BIGINT UNIQUE;

CREATE INDEX idx_profiles_strava_athlete_id
  ON public.profiles(strava_athlete_id)
  WHERE strava_athlete_id IS NOT NULL;


-- ──────────────────────────────────────────────────────────
-- strava_tokens
-- Armazena tokens OAuth do Strava para cada usuário.
-- Acesso exclusivo via service_role (admin client).
-- ──────────────────────────────────────────────────────────
CREATE TABLE public.strava_tokens (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  athlete_id    BIGINT NOT NULL,
  access_token  TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at    BIGINT NOT NULL,  -- Unix timestamp (retornado pelo Strava)
  scope         TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_strava_tokens_user    UNIQUE (user_id),
  CONSTRAINT uq_strava_tokens_athlete UNIQUE (athlete_id)
);

CREATE INDEX idx_strava_tokens_user_id    ON public.strava_tokens(user_id);
CREATE INDEX idx_strava_tokens_athlete_id ON public.strava_tokens(athlete_id);


-- ──────────────────────────────────────────────────────────
-- updated_at automático (reutiliza função de 005)
-- ──────────────────────────────────────────────────────────
CREATE TRIGGER trg_strava_tokens_updated
  BEFORE UPDATE ON public.strava_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_payment_updated_at();


-- ──────────────────────────────────────────────────────────
-- RLS — sem acesso direto para usuários autenticados.
-- Operações via service_role (bypassa RLS automaticamente).
-- ──────────────────────────────────────────────────────────
ALTER TABLE public.strava_tokens ENABLE ROW LEVEL SECURITY;


-- ──────────────────────────────────────────────────────────
-- Backfill: popular strava_athlete_id para usuários existentes
-- que fizeram login com Strava (metadata armazenada em auth.users)
-- ──────────────────────────────────────────────────────────
UPDATE public.profiles p
SET strava_athlete_id = (au.raw_user_meta_data->>'strava_id')::BIGINT
FROM auth.users au
WHERE au.id = p.id
  AND au.raw_user_meta_data->>'provider' = 'strava'
  AND au.raw_user_meta_data->>'strava_id' IS NOT NULL
  AND p.strava_athlete_id IS NULL;
