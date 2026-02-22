-- Track clicks on race registration links (affiliate/analytics)
CREATE TABLE public.link_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id UUID NOT NULL REFERENCES public.races(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_link_clicks_race_id ON public.link_clicks(race_id);
CREATE INDEX idx_link_clicks_clicked_at ON public.link_clicks(clicked_at);

ALTER TABLE public.link_clicks ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous) can insert clicks
CREATE POLICY "Anyone can insert clicks" ON public.link_clicks
  FOR INSERT WITH CHECK (true);

-- Only admins can read click data
CREATE POLICY "Admins can read clicks" ON public.link_clicks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
