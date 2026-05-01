-- ============================================================
-- 018: Page views por corrida
--
-- Complementa link_clicks (que conta cliques no botão "Inscreva-se")
-- com page views da rota /corrida/[slug]. Juntos dão CTR real,
-- métrica que justifica o pricing de Destaque para organizadores.
-- ============================================================


CREATE TABLE public.race_views (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id    UUID NOT NULL REFERENCES public.races(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  viewed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_race_views_race_id   ON public.race_views(race_id);
CREATE INDEX idx_race_views_viewed_at ON public.race_views(viewed_at);

ALTER TABLE public.race_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert views"
  ON public.race_views FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can read all views"
  ON public.race_views FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Owners can read own race views"
  ON public.race_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.races
      WHERE races.id = race_views.race_id
        AND races.created_by = auth.uid()
    )
  );

-- Mirror policy on link_clicks: owners need to see their own clicks too.
CREATE POLICY "Owners can read own race clicks"
  ON public.link_clicks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.races
      WHERE races.id = link_clicks.race_id
        AND races.created_by = auth.uid()
    )
  );
