-- ============================================================
-- 005: Monetização — Promoções + Pagamentos (AbacatePay)
--
-- Nota: is_promoted e promoted_until já estão na tabela races
--       criada em 001_core_schema.sql.
--
-- Valores monetários armazenados em centavos (R$10,00 = 1000).
-- ============================================================


-- ──────────────────────────────────────────────────────────
-- ENUMs
-- ──────────────────────────────────────────────────────────
CREATE TYPE public.payment_method AS ENUM ('PIX', 'CARD');

CREATE TYPE public.billing_frequency AS ENUM ('ONE_TIME', 'MULTIPLE_PAYMENTS');

CREATE TYPE public.payment_status AS ENUM (
  'PENDING',
  'PAID',
  'EXPIRED',
  'CANCELLED',
  'REFUNDED',
  'FAILED'
);

CREATE TYPE public.order_type AS ENUM (
  'race_promotion',       -- Promoção de corridas (Fase 1)
  'premium_subscription', -- Assinatura premium (futuro)
  'race_registration',    -- Venda de inscrição (futuro)
  'extra_service',        -- Serviço extra (futuro)
  'other'
);


-- ──────────────────────────────────────────────────────────
-- payment_customers
-- Mapeia auth user → customer no AbacatePay.
-- Um usuário tem no máximo um customer (UNIQUE user_id).
-- ──────────────────────────────────────────────────────────
CREATE TABLE public.payment_customers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  abacatepay_id text NOT NULL,   -- "cust_xxx" retornado pelo AbacatePay
  email         text,
  name          text,
  cellphone     text,
  tax_id        text,            -- CPF ou CNPJ
  metadata      jsonb DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_payment_customers_user    UNIQUE (user_id),
  CONSTRAINT uq_payment_customers_abacate UNIQUE (abacatepay_id)
);

CREATE INDEX idx_payment_customers_user_id ON public.payment_customers(user_id);


-- ──────────────────────────────────────────────────────────
-- payment_orders
-- Cada cobrança criada (PIX ou billing). Source of truth do estado.
-- ──────────────────────────────────────────────────────────
CREATE TABLE public.payment_orders (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  customer_id    uuid REFERENCES public.payment_customers(id),

  -- Referências AbacatePay
  abacatepay_id  text,                              -- "bill_xxx" ou "pix_char_xxx"
  payment_url    text,                              -- URL do checkout
  payment_method public.payment_method[] NOT NULL,  -- ['PIX'], ['CARD'], ['PIX','CARD']
  frequency      public.billing_frequency NOT NULL DEFAULT 'ONE_TIME',

  -- Detalhes do pedido
  order_type     public.order_type NOT NULL DEFAULT 'other',
  status         public.payment_status NOT NULL DEFAULT 'PENDING',
  amount         integer NOT NULL CHECK (amount > 0),  -- centavos
  paid_amount    integer DEFAULT 0,
  currency       text NOT NULL DEFAULT 'BRL',

  -- Produto / referência
  description    text,
  products       jsonb DEFAULT '[]'::jsonb,
  external_id    text,
  metadata       jsonb DEFAULT '{}'::jsonb,  -- ex: { raceId, raceSlug }

  -- PIX
  br_code        text,        -- copia-e-cola
  br_code_base64 text,        -- imagem QR Code em base64

  -- Cupons
  allow_coupons  boolean DEFAULT false,
  coupons_used   jsonb DEFAULT '[]'::jsonb,

  -- Timestamps
  paid_at        timestamptz,
  expires_at     timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_payment_orders_user_id ON public.payment_orders(user_id);
CREATE INDEX idx_payment_orders_status  ON public.payment_orders(status);
CREATE INDEX idx_payment_orders_abacate ON public.payment_orders(abacatepay_id);
CREATE INDEX idx_payment_orders_type    ON public.payment_orders(order_type);
CREATE INDEX idx_payment_orders_created ON public.payment_orders(created_at DESC);


-- ──────────────────────────────────────────────────────────
-- payment_events
-- Log de webhooks recebidos. Idempotente via UNIQUE event_id.
-- ──────────────────────────────────────────────────────────
CREATE TABLE public.payment_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      text NOT NULL,    -- "log_xxx" do AbacatePay
  event_type    text NOT NULL,    -- "billing.paid", "withdraw.done", etc.
  order_id      uuid REFERENCES public.payment_orders(id),
  raw_payload   jsonb NOT NULL,   -- body completo do webhook
  dev_mode      boolean DEFAULT false,
  processed     boolean DEFAULT false,
  processed_at  timestamptz,
  error_message text,
  created_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_payment_events_event_id UNIQUE (event_id)
);

CREATE INDEX idx_payment_events_order_id ON public.payment_events(order_id);
CREATE INDEX idx_payment_events_type     ON public.payment_events(event_type);
CREATE INDEX idx_payment_events_created  ON public.payment_events(created_at DESC);


-- ──────────────────────────────────────────────────────────
-- updated_at automático
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_payment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_payment_customers_updated
  BEFORE UPDATE ON public.payment_customers
  FOR EACH ROW EXECUTE FUNCTION public.update_payment_updated_at();

CREATE TRIGGER trg_payment_orders_updated
  BEFORE UPDATE ON public.payment_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_payment_updated_at();


-- ──────────────────────────────────────────────────────────
-- RLS
-- ──────────────────────────────────────────────────────────
ALTER TABLE public.payment_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_orders    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment customer"
  ON public.payment_customers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own payment orders"
  ON public.payment_orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- payment_events: sem acesso direto para usuários autenticados.
-- Operações via service_role (bypassa RLS automaticamente no Supabase).
