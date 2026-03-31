-- Development unblocker:
-- allow authenticated users to insert/update storage.objects.
-- This avoids "new row violates row-level security policy" during uploads.

DROP POLICY IF EXISTS "storage objects authenticated allow all insert" ON storage.objects;
CREATE POLICY "storage objects authenticated allow all insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "storage objects authenticated allow all update" ON storage.objects;
CREATE POLICY "storage objects authenticated allow all update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "storage objects authenticated allow all delete" ON storage.objects;
CREATE POLICY "storage objects authenticated allow all delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (true);

