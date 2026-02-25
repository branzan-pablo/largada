-- Create public Storage bucket for user avatars.
-- Avatars are copied from OAuth providers (Strava, Google) to decouple
-- from third-party CDNs and comply with Strava's 7-day cache policy.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload/update their own avatar
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read access (avatars are displayed on profile)
CREATE POLICY "Public avatar read access"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

-- Allow service_role full access (used by OAuth callback and cleanup)
CREATE POLICY "Service role full access to avatars"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'avatars');
