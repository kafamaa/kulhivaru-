-- Allow authenticated users to upload team logo images
-- for the `team-logos` bucket.

DROP POLICY IF EXISTS "team-logos upload" ON storage.objects;
CREATE POLICY "team-logos upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'team-logos');

DROP POLICY IF EXISTS "team-logos update" ON storage.objects;
CREATE POLICY "team-logos update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'team-logos')
WITH CHECK (bucket_id = 'team-logos');

