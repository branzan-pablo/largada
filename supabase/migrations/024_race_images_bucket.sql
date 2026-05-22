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

-- Only admins (service_role) upload race images via the admin panel
CREATE POLICY "Service role full access to race-images"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'race-images');

-- Public read access (race banners are displayed to all visitors)
CREATE POLICY "Public race-images read access"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'race-images');
