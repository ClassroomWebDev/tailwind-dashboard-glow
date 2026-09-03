DROP POLICY IF EXISTS "milestone_achievements_read" ON public.milestone_achievements;

CREATE POLICY "Members read own or team achievements"
ON public.milestone_achievements
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_staff(auth.uid())
  OR public.is_my_ambassador(user_id)
  OR public.is_downstream(user_id)
);