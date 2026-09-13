DROP POLICY IF EXISTS "avatars read" ON storage.objects;
DROP POLICY IF EXISTS "avatars write" ON storage.objects;
DROP POLICY IF EXISTS "avatars update" ON storage.objects;
DROP POLICY IF EXISTS "avatars delete" ON storage.objects;
DROP POLICY IF EXISTS "signatures read" ON storage.objects;
DROP POLICY IF EXISTS "signatures write" ON storage.objects;
DROP POLICY IF EXISTS "signatures update" ON storage.objects;
DROP POLICY IF EXISTS "signatures delete" ON storage.objects;

CREATE POLICY "avatars read" ON storage.objects FOR SELECT TO authenticated, anon USING (bucket_id = 'avatars');
CREATE POLICY "avatars write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "avatars update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars') WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "avatars delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars');

CREATE POLICY "signatures read" ON storage.objects FOR SELECT TO authenticated, anon USING (bucket_id = 'signatures');
CREATE POLICY "signatures write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'signatures');
CREATE POLICY "signatures update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'signatures') WITH CHECK (bucket_id = 'signatures');
CREATE POLICY "signatures delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'signatures');