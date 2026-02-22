-- Affiliate rules: append query params to registration links by domain
CREATE TABLE public.affiliate_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL UNIQUE,
  param_key TEXT NOT NULL,
  param_value TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.affiliate_rules ENABLE ROW LEVEL SECURITY;

-- Only admins can manage affiliate rules
CREATE POLICY "Admins can manage affiliate rules" ON public.affiliate_rules
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Public read for the redirect API (anon key needs to read rules)
CREATE POLICY "Anyone can read active rules" ON public.affiliate_rules
  FOR SELECT USING (active = true);
