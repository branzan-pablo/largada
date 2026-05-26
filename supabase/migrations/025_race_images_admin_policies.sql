-- Add missing admin write policies for the race-images bucket.
-- Migration 024 was applied before the admin policies were added,
-- so this migration fills the gap.

DO $$
BEGIN
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
END $$;
