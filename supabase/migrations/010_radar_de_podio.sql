-- ============================================================
-- 010: Radar de Pódio — Perfis de corredores + análises
--
-- Armazena o perfil competitivo do corredor e registra cada
-- análise realizada (para controle de uso free vs pago).
-- ============================================================


-- ──────────────────────────────────────────────────────────
-- radar_profiles
-- Perfil competitivo do corredor para o Radar de Pódio.
-- Um por usuário (UNIQUE user_id). Atualizado a cada consulta.
-- ──────────────────────────────────────────────────────────
CREATE TABLE public.radar_profiles (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Performance
  pace                text NOT NULL,                    -- "05:30" (mm:ss/km)
  preferred_distances text[] NOT NULL DEFAULT '{}',     -- ["5k","10k"]

  -- Categoria
  sex                 text NOT NULL,                    -- "masculino" | "feminino"
  age_category        text NOT NULL,                    -- "30-34", "35-39", etc.

  -- Localização
  city                text NOT NULL,                    -- "São José do Rio Preto - SP"
  city_id             uuid REFERENCES public.cities(id),
  state               text,
  latitude            double precision,
  longitude           double precision,

  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_radar_profiles_user UNIQUE (user_id)
);

CREATE INDEX idx_radar_profiles_user_id ON public.radar_profiles(user_id);


-- ──────────────────────────────────────────────────────────
-- radar_analyses
-- Cada análise realizada. Controla free vs pago.
-- ──────────────────────────────────────────────────────────
CREATE TABLE public.radar_analyses (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  profile_id        uuid NOT NULL REFERENCES public.radar_profiles(id) ON DELETE CASCADE,

  -- Parâmetros da análise
  distance_filter   text NOT NULL,                     -- "10k"
  races_found       integer NOT NULL DEFAULT 0,        -- total de corridas analisadas
  races_recommended integer NOT NULL DEFAULT 0,        -- com score >= threshold

  -- Tipo de acesso
  is_paid           boolean NOT NULL DEFAULT false,    -- análise paga (desbloqueou tudo)
  order_id          uuid REFERENCES public.payment_orders(id),

  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_radar_analyses_user_id    ON public.radar_analyses(user_id);
CREATE INDEX idx_radar_analyses_created_at ON public.radar_analyses(created_at DESC);


-- ──────────────────────────────────────────────────────────
-- updated_at automático para radar_profiles
-- ──────────────────────────────────────────────────────────
CREATE TRIGGER trg_radar_profiles_updated
  BEFORE UPDATE ON public.radar_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_payment_updated_at();


-- ──────────────────────────────────────────────────────────
-- RLS
-- ──────────────────────────────────────────────────────────
ALTER TABLE public.radar_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radar_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own radar profile"
  ON public.radar_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own radar profile"
  ON public.radar_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own radar profile"
  ON public.radar_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own radar analyses"
  ON public.radar_analyses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- radar_analyses INSERT: via service_role (API route)


-- ──────────────────────────────────────────────────────────
-- Adicionar 'radar_analysis' ao enum order_type
-- ──────────────────────────────────────────────────────────
ALTER TYPE public.order_type ADD VALUE IF NOT EXISTS 'radar_analysis';
