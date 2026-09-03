ALTER TABLE public.big_opportunities
  ADD COLUMN IF NOT EXISTS regular_price numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS student_price numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS coordinator_price numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ambassador_price numeric NOT NULL DEFAULT 0;

UPDATE public.big_opportunities
SET regular_price = CASE WHEN regular_price = 0 THEN price ELSE regular_price END,
    student_price = CASE WHEN student_price = 0 THEN price ELSE student_price END;

DROP POLICY IF EXISTS "milestone_achievements_read" ON public.milestone_achievements;
CREATE POLICY "Members read own or team achievements"
ON public.milestone_achievements FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_staff(auth.uid())
  OR public.is_my_ambassador(user_id)
  OR public.is_downstream(user_id)
);

ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS student_district text;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.program_settings ADD COLUMN IF NOT EXISTS certificate_threshold_percent integer NOT NULL DEFAULT 70;