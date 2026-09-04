ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid;

GRANT INSERT ON public.applications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;

DROP POLICY IF EXISTS "Anyone can submit an application" ON public.applications;
CREATE POLICY "Anyone can submit an application"
ON public.applications FOR INSERT TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Ambassadors view own applications" ON public.applications;
CREATE POLICY "Referral line views applications"
ON public.applications FOR SELECT TO authenticated
USING (ambassador_id = auth.uid() OR public.is_my_ambassador(ambassador_id) OR public.is_downstream(ambassador_id));

DROP POLICY IF EXISTS "Staff manage applications" ON public.applications;
CREATE POLICY "Staff manage applications"
ON public.applications FOR ALL TO authenticated
USING (public.is_staff(auth.uid()))
WITH CHECK (public.is_staff(auth.uid()));
