-- ============================================================================
-- Migration 012: Payment Tables for AbacatePay Integration
-- ============================================================================
-- Creates tables for managing payment customers, orders, and webhook events.
-- Supports multiple monetization models: one-time, recurring, subscriptions.
-- All monetary values stored in centavos (R$10.00 = 1000).
-- ============================================================================

-- --------------------------------------------------------------------------
-- ENUMS
-- --------------------------------------------------------------------------
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
  'race_promotion',       -- Promoção de corridas
  'premium_subscription', -- Assinatura premium
  'race_registration',    -- Venda de inscrição (futuro)
  'extra_service',        -- Serviço extra (futuro)
  'other'
);

-- --------------------------------------------------------------------------
-- 1. payment_customers
-- Maps Supabase auth user → AbacatePay customer
-- --------------------------------------------------------------------------
CREATE TABLE public.payment_customers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  abacatepay_id text NOT NULL,                    -- "cust_xxx" from AbacatePay
  email         text,
  name          text,
  cellphone     text,
  tax_id        text,                             -- CPF/CNPJ
  metadata      jsonb DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_payment_customers_user    UNIQUE (user_id),
  CONSTRAINT uq_payment_customers_abacate UNIQUE (abacatepay_id)
);

CREATE INDEX idx_payment_customers_user_id ON public.payment_customers (user_id);

-- --------------------------------------------------------------------------
-- 2. payment_orders
-- Each billing/PIX charge created. Source of truth for order state.
-- --------------------------------------------------------------------------
CREATE TABLE public.payment_orders (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  customer_id       uuid REFERENCES public.payment_customers(id),

  -- AbacatePay references
  abacatepay_id     text,                              -- "bill_xxx" or "pix_char_xxx"
  payment_url       text,                              -- Checkout URL
  payment_method    public.payment_method[] NOT NULL,   -- ['PIX'], ['CARD'], or ['PIX','CARD']
  frequency         public.billing_frequency NOT NULL DEFAULT 'ONE_TIME',

  -- Order details
  order_type        public.order_type NOT NULL DEFAULT 'other',
  status            public.payment_status NOT NULL DEFAULT 'PENDING',
  amount            integer NOT NULL CHECK (amount > 0), -- in centavos
  paid_amount       integer DEFAULT 0,
  currency          text NOT NULL DEFAULT 'BRL',

  -- Product/reference info
  description       text,
  products          jsonb DEFAULT '[]'::jsonb,          -- Array of product objects
  external_id       text,                               -- Your app's reference ID
  metadata          jsonb DEFAULT '{}'::jsonb,

  -- PIX specific
  br_code           text,                               -- PIX copia-e-cola
  br_code_base64    text,                               -- QR Code image base64

  -- Coupons
  allow_coupons     boolean DEFAULT false,
  coupons_used      jsonb DEFAULT '[]'::jsonb,

  -- Timestamps
  paid_at           timestamptz,
  expires_at        timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_payment_orders_user_id    ON public.payment_orders (user_id);
CREATE INDEX idx_payment_orders_status     ON public.payment_orders (status);
CREATE INDEX idx_payment_orders_abacate    ON public.payment_orders (abacatepay_id);
CREATE INDEX idx_payment_orders_type       ON public.payment_orders (order_type);
CREATE INDEX idx_payment_orders_created    ON public.payment_orders (created_at DESC);

-- --------------------------------------------------------------------------
-- 3. payment_events
-- Webhook event log. Idempotent via UNIQUE event_id.
-- --------------------------------------------------------------------------
CREATE TABLE public.payment_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        text NOT NULL,                       -- "log_xxx" from AbacatePay
  event_type      text NOT NULL,                       -- "billing.paid", "withdraw.done", etc.
  order_id        uuid REFERENCES public.payment_orders(id),
  raw_payload     jsonb NOT NULL,                      -- Full webhook body
  dev_mode        boolean DEFAULT false,
  processed       boolean DEFAULT false,
  processed_at    timestamptz,
  error_message   text,
  created_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_payment_events_event_id UNIQUE (event_id)
);

CREATE INDEX idx_payment_events_order_id   ON public.payment_events (order_id);
CREATE INDEX idx_payment_events_type       ON public.payment_events (event_type);
CREATE INDEX idx_payment_events_created    ON public.payment_events (created_at DESC);

-- --------------------------------------------------------------------------
-- 4. Updated_at triggers
-- --------------------------------------------------------------------------
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

-- --------------------------------------------------------------------------
-- 5. Row Level Security
-- --------------------------------------------------------------------------
ALTER TABLE public.payment_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_orders    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events    ENABLE ROW LEVEL SECURITY;

-- payment_customers: users can only read their own
CREATE POLICY "Users can view own payment customer"
  ON public.payment_customers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- payment_orders: users can only read their own
CREATE POLICY "Users can view own payment orders"
  ON public.payment_orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- payment_events: no direct user access (service role only)
-- No SELECT policy for authenticated users

-- Service role bypass (for API routes)
-- The service_role key bypasses RLS automatically in Supabase.
