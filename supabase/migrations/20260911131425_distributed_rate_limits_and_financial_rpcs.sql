-- Distributed fixed-window rate limiting for serverless API routes.
CREATE TABLE public.api_rate_limits (
  key_hash text PRIMARY KEY,
  request_count integer NOT NULL CHECK (request_count > 0),
  reset_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.api_rate_limits FROM PUBLIC, anon, authenticated;

CREATE INDEX idx_api_rate_limits_reset_at
  ON public.api_rate_limits (reset_at);

CREATE OR REPLACE FUNCTION public.consume_rate_limit(
  p_key_hash text,
  p_max integer,
  p_window_seconds integer
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count integer;
BEGIN
  IF p_key_hash IS NULL OR p_key_hash = '' OR p_max < 1 OR p_window_seconds < 1 THEN
    RAISE EXCEPTION 'invalid rate limit arguments';
  END IF;

  INSERT INTO public.api_rate_limits (key_hash, request_count, reset_at)
  VALUES (p_key_hash, 1, now() + make_interval(secs => p_window_seconds))
  ON CONFLICT (key_hash) DO UPDATE
  SET request_count = CASE
        WHEN public.api_rate_limits.reset_at <= now() THEN 1
        ELSE public.api_rate_limits.request_count + 1
      END,
      reset_at = CASE
        WHEN public.api_rate_limits.reset_at <= now()
          THEN now() + make_interval(secs => p_window_seconds)
        ELSE public.api_rate_limits.reset_at
      END,
      updated_at = now()
  RETURNING request_count INTO v_count;

  -- Keep cleanup bounded and off the request path most of the time.
  IF random() < 0.01 THEN
    DELETE FROM public.api_rate_limits WHERE reset_at < now() - interval '1 day';
  END IF;

  RETURN v_count > p_max;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_rate_limit(text, integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(text, integer, integer)
  TO service_role;

-- Atomically consumes a subscription credit and activates the race promotion.
CREATE OR REPLACE FUNCTION public.consume_subscription_promotion(
  p_subscription_id uuid,
  p_race_id uuid,
  p_user_id uuid,
  p_promoted_until timestamptz
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_updated uuid;
BEGIN
  -- An existing tracking row makes retries idempotent.
  IF EXISTS (
    SELECT 1 FROM public.subscription_promotions
    WHERE subscription_id = p_subscription_id AND race_id = p_race_id
  ) THEN
    RETURN true;
  END IF;

  UPDATE public.organizer_subscriptions
  SET promotions_used = promotions_used + 1
  WHERE id = p_subscription_id
    AND user_id = p_user_id
    AND status = 'active'
    AND current_period_end > now()
    AND promotions_used < promotions_limit
  RETURNING id INTO v_updated;

  IF v_updated IS NULL THEN RETURN false; END IF;

  INSERT INTO public.subscription_promotions (subscription_id, race_id)
  VALUES (p_subscription_id, p_race_id);

  UPDATE public.races
  SET is_promoted = true, promoted_until = p_promoted_until
  WHERE id = p_race_id AND created_by = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'race does not belong to subscription owner';
  END IF;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_subscription_promotion(uuid, uuid, uuid, timestamptz)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_subscription_promotion(uuid, uuid, uuid, timestamptz)
  TO service_role;

-- Finalizes an incoming payment event, its order and its entitlement in one
-- transaction. Any exception rolls the entire webhook attempt back.
CREATE OR REPLACE FUNCTION public.process_payment_event(
  p_event_id text,
  p_event_type text,
  p_raw_payload jsonb,
  p_dev_mode boolean,
  p_abacatepay_id text DEFAULT NULL,
  p_paid_amount integer DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_order public.payment_orders%ROWTYPE;
  v_race_id uuid;
  v_tier text;
  v_limit integer;
BEGIN
  IF EXISTS (SELECT 1 FROM public.payment_events WHERE event_id = p_event_id) THEN
    RETURN jsonb_build_object('duplicate', true);
  END IF;

  IF p_event_type <> 'billing.paid' THEN
    INSERT INTO public.payment_events
      (event_id, event_type, raw_payload, dev_mode, processed, processed_at)
    VALUES (p_event_id, p_event_type, p_raw_payload, p_dev_mode, true, now());
    RETURN jsonb_build_object('duplicate', false, 'processed', true);
  END IF;

  SELECT * INTO v_order
  FROM public.payment_orders
  WHERE abacatepay_id = p_abacatepay_id AND status = 'PENDING'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'no pending order for payment reference';
  END IF;

  IF p_paid_amount IS NULL OR p_paid_amount < v_order.amount THEN
    UPDATE public.payment_orders SET status = 'FAILED' WHERE id = v_order.id;
    INSERT INTO public.payment_events
      (event_id, event_type, order_id, raw_payload, dev_mode, processed, processed_at, error_message)
    VALUES (p_event_id, p_event_type, v_order.id, p_raw_payload, p_dev_mode, true, now(), 'underpaid');
    RETURN jsonb_build_object('duplicate', false, 'processed', true, 'underpaid', true,
      'orderId', v_order.id, 'userId', v_order.user_id, 'orderType', v_order.order_type);
  END IF;

  UPDATE public.payment_orders
  SET status = 'PAID', paid_amount = p_paid_amount, paid_at = now()
  WHERE id = v_order.id;

  IF v_order.order_type = 'race_promotion' THEN
    v_race_id := NULLIF(v_order.metadata->>'raceId', '')::uuid;
    IF v_race_id IS NULL THEN RAISE EXCEPTION 'promotion order missing raceId'; END IF;
    UPDATE public.races
    SET is_promoted = true,
        promoted_until = now() + make_interval(days =>
          COALESCE(NULLIF(v_order.metadata->>'durationDays', '')::integer, 30))
    WHERE id = v_race_id AND created_by = v_order.user_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'race does not belong to order owner'; END IF;
  ELSIF v_order.order_type = 'premium_subscription' THEN
    v_tier := v_order.metadata->>'tier';
    v_limit := CASE v_tier WHEN 'organizador' THEN 3 WHEN 'organizador_pro' THEN 8 ELSE NULL END;
    IF v_limit IS NULL THEN RAISE EXCEPTION 'invalid subscription tier'; END IF;
    INSERT INTO public.organizer_subscriptions
      (user_id, tier, status, payment_order_id, amount, promotions_limit,
       promotions_used, current_period_start, current_period_end)
    VALUES
      (v_order.user_id, v_tier::public.subscription_tier, 'active', v_order.id,
       v_order.amount, v_limit, 0, now(), now() + interval '30 days')
    ON CONFLICT (user_id) DO UPDATE SET
      tier = EXCLUDED.tier,
      status = 'active',
      payment_order_id = EXCLUDED.payment_order_id,
      amount = EXCLUDED.amount,
      promotions_limit = EXCLUDED.promotions_limit,
      promotions_used = 0,
      current_period_start = EXCLUDED.current_period_start,
      current_period_end = EXCLUDED.current_period_end;
  END IF;

  INSERT INTO public.payment_events
    (event_id, event_type, order_id, raw_payload, dev_mode, processed, processed_at)
  VALUES (p_event_id, p_event_type, v_order.id, p_raw_payload, p_dev_mode, true, now());

  RETURN jsonb_build_object('duplicate', false, 'processed', true,
    'orderId', v_order.id, 'userId', v_order.user_id, 'orderType', v_order.order_type);
END;
$$;

REVOKE ALL ON FUNCTION public.process_payment_event(text, text, jsonb, boolean, text, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_payment_event(text, text, jsonb, boolean, text, integer)
  TO service_role;

-- Advisor hardening for existing functions. Trigger functions never need to
-- be callable through the Data API; semantic search functions retain their
-- intended grants but receive an immutable search_path.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_rsvp_count() FROM PUBLIC, anon, authenticated;
ALTER FUNCTION public.match_races_semantic(vector, date, double precision, integer, integer)
  SET search_path = public;
ALTER FUNCTION public.match_races_semantic_any_date(vector, double precision, integer)
  SET search_path = public;
