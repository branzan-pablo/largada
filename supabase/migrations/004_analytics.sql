-- ============================================================
-- 004: Analytics e Afiliados
-- Rastreamento de cliques em links de inscrição + regras de
-- afiliados por domínio (append de query params automático).
-- ============================================================


-- ──────────────────────────────────────────────────────────
-- link_clicks
-- Registra cada clique em link de inscrição de corrida.
-- Usuário pode ser NULL (clique anônimo).
-- ──────────────────────────────────────────────────────────
CREATE TABLE public.link_clicks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id    UUID NOT NULL REFERENCES public.races(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_link_clicks_race_id    ON public.link_clicks(race_id);
CREATE INDEX idx_link_clicks_clicked_at ON public.link_clicks(clicked_at);

ALTER TABLE public.link_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert clicks"
  ON public.link_clicks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can read clicks"
  ON public.link_clicks FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ──────────────────────────────────────────────────────────
-- affiliate_rules
-- Regras de afiliado por domínio: adiciona query params ao
-- link de inscrição antes do redirect.
-- ──────────────────────────────────────────────────────────
CREATE TABLE public.affiliate_rules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain      TEXT NOT NULL UNIQUE,
  param_key   TEXT NOT NULL,
  param_value TEXT NOT NULL,
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.affiliate_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage affiliate rules"
  ON public.affiliate_rules FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Leitura pública para a API de redirect (anon key precisa ler as regras).
CREATE POLICY "Anyone can read active rules"
  ON public.affiliate_rules FOR SELECT
  USING (active = true);
