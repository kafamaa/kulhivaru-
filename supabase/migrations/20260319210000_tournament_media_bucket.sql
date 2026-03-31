-- Create tournament-media storage bucket for covers, banners, gallery, etc.
INSERT INTO storage.buckets (id, name, public)
VALUES ('tournament-media', 'tournament-media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated uploads
DROP POLICY IF EXISTS "tournament-media authenticated upload" ON storage.objects;
CREATE POLICY "tournament-media authenticated upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'tournament-media');

DROP POLICY IF EXISTS "tournament-media authenticated update" ON storage.objects;
CREATE POLICY "tournament-media authenticated update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'tournament-media')
WITH CHECK (bucket_id = 'tournament-media');

DROP POLICY IF EXISTS "tournament-media public read" ON storage.objects;
CREATE POLICY "tournament-media public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'tournament-media');
