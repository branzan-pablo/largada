-- ============================================================
-- 011: Planos de Organizador — Pacotes de destaque mensais
--
-- Organizadores compram pacotes (Organizador: 3 corridas/30d,
-- Organizador Pro: 8 corridas/30d) com pagamento único.
-- ============================================================


-- ──────────────────────────────────────────────────────────
-- ENUM
-- ──────────────────────────────────────────────────────────
CREATE TYPE public.subscription_tier AS ENUM ('organizador', 'organizador_pro');


-- ──────────────────────────────────────────────────────────
-- organizer_subscriptions
-- Pacote ativo de um organizador. Máximo 1 por user.
-- ──────────────────────────────────────────────────────────
CREATE TABLE public.organizer_subscriptions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tier                  public.subscription_tier NOT NULL,
  status                text NOT NULL DEFAULT 'active',  -- active | expired
  payment_order_id      uuid REFERENCES public.payment_orders(id),
  amount                integer NOT NULL,                -- centavos
  promotions_limit      integer NOT NULL,                -- 3 or 8
  promotions_used       integer NOT NULL DEFAULT 0,
  current_period_start  timestamptz NOT NULL DEFAULT now(),
  current_period_end    timestamptz NOT NULL,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_user_active_sub UNIQUE (user_id)
);

CREATE INDEX idx_org_sub_user   ON public.organizer_subscriptions(user_id);
CREATE INDEX idx_org_sub_status ON public.organizer_subscriptions(status);
CREATE INDEX idx_org_sub_period ON public.organizer_subscriptions(current_period_end);


-- ──────────────────────────────────────────────────────────
-- subscription_promotions
-- Tracking: quais corridas foram promovidas via pacote.
-- ──────────────────────────────────────────────────────────
CREATE TABLE public.subscription_promotions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES public.organizer_subscriptions(id) ON DELETE CASCADE,
  race_id         uuid NOT NULL REFERENCES public.races(id) ON DELETE CASCADE,
  promoted_at     timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_sub_promo_race UNIQUE (subscription_id, race_id)
);

CREATE INDEX idx_sub_promo_sub  ON public.subscription_promotions(subscription_id);
CREATE INDEX idx_sub_promo_race ON public.subscription_promotions(race_id);


-- ──────────────────────────────────────────────────────────
-- updated_at automático
-- ──────────────────────────────────────────────────────────
CREATE TRIGGER trg_org_sub_updated
  BEFORE UPDATE ON public.organizer_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_payment_updated_at();


-- ──────────────────────────────────────────────────────────
-- RLS
-- ──────────────────────────────────────────────────────────
ALTER TABLE public.organizer_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON public.organizer_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- subscription_promotions: acesso via service_role apenas (admin)
