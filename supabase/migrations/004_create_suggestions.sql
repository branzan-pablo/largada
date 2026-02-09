-- Create race suggestions table
CREATE TABLE public.race_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date DATE,
  city TEXT NOT NULL,
  link TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_suggestions_user ON public.race_suggestions(user_id);
CREATE INDEX idx_suggestions_status ON public.race_suggestions(status);

-- RLS
ALTER TABLE public.race_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own suggestions"
  ON public.race_suggestions FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can create suggestions"
  ON public.race_suggestions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update suggestions"
  ON public.race_suggestions FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
