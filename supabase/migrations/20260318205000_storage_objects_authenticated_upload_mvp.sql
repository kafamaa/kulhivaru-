-- MVP unblocker: allow authenticated users to upload/update storage objects.
-- This avoids "new row violates row-level security policy" during development.
-- Later we should tighten it to specific buckets.

DROP POLICY IF EXISTS "storage objects authenticated insert (mvp)" ON storage.objects;
CREATE POLICY "storage objects authenticated insert (mvp)"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "storage objects authenticated update (mvp)" ON storage.objects;
CREATE POLICY "storage objects authenticated update (mvp)"
ON storage.objects
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

