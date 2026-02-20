-- Add state column to race_suggestions
ALTER TABLE public.race_suggestions
  ADD COLUMN state TEXT;
