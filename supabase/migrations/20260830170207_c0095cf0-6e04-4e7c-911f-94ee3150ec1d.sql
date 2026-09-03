ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

CREATE OR REPLACE FUNCTION public.can_view_all_sales(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin','support_manager','mentor')
  );
$$;

DROP POLICY IF EXISTS "View own or team sales" ON public.sales;
CREATE POLICY "View own or team sales" ON public.sales
  FOR SELECT TO authenticated
  USING (
    ambassador_id = auth.uid()
    OR submitted_by = auth.uid()
    OR public.is_my_ambassador(ambassador_id)
    OR public.can_view_all_sales(auth.uid())
  );