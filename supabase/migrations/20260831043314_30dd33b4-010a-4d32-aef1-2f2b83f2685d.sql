CREATE POLICY "Staff manage site assets" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'site-assets' AND public.is_staff(auth.uid()))
WITH CHECK (bucket_id = 'site-assets' AND public.is_staff(auth.uid()));