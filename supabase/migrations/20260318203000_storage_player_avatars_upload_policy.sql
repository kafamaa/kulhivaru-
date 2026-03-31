-- Allow authenticated users to upload player avatar images
-- for the `player-avatars` bucket.

DROP POLICY IF EXISTS "player-avatars upload" ON storage.objects;
CREATE POLICY "player-avatars upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'player-avatars');

-- Some flows may hit UPDATE (e.g. overwrite). Allow it too.
DROP POLICY IF EXISTS "player-avatars update" ON storage.objects;
CREATE POLICY "player-avatars update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'player-avatars')
WITH CHECK (bucket_id = 'player-avatars');

