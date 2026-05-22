-- Create public Storage bucket for race images/banners.
-- Mirrors the bucket created manually in production; adds it to migrations
-- so staging and new environments get it automatically.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'race-images',
  'race-images',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Service role full access to race-images'
  ) THEN
    EXECUTE $p$CREATE POLICY "Service role full access to race-images"
      ON storage.objects FOR ALL TO service_role
      USING (bucket_id = 'race-images')$p$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Admins can upload race-images'
  ) THEN
    EXECUTE $p$CREATE POLICY "Admins can upload race-images"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'race-images'
        AND EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND role = 'admin'
        )
      )$p$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Admins can update race-images'
  ) THEN
    EXECUTE $p$CREATE POLICY "Admins can update race-images"
      ON storage.objects FOR UPDATE TO authenticated
      USING (
        bucket_id = 'race-images'
        AND EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND role = 'admin'
        )
      )$p$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Admins can delete race-images'
  ) THEN
    EXECUTE $p$CREATE POLICY "Admins can delete race-images"
      ON storage.objects FOR DELETE TO authenticated
      USING (
        bucket_id = 'race-images'
        AND EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND role = 'admin'
        )
      )$p$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Public race-images read access'
  ) THEN
    EXECUTE $p$CREATE POLICY "Public race-images read access"
      ON storage.objects FOR SELECT TO public
      USING (bucket_id = 'race-images')$p$;
  END IF;
END $$;
