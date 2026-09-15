CREATE TABLE IF NOT EXISTS public.assignment_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.class_sessions(id) ON DELETE CASCADE,
  ambassador_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  points integer NOT NULL DEFAULT 0,
  awarded_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT assignment_scores_target_ck CHECK (num_nonnulls(event_id, session_id) = 1)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.assignment_scores TO authenticated;
GRANT ALL ON public.assignment_scores TO service_role;

CREATE UNIQUE INDEX IF NOT EXISTS assignment_scores_event_uq
  ON public.assignment_scores (event_id, ambassador_id) WHERE event_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS assignment_scores_session_uq
  ON public.assignment_scores (session_id, ambassador_id) WHERE session_id IS NOT NULL;

ALTER TABLE public.assignment_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own, team and staff can read assignment scores"
  ON public.assignment_scores FOR SELECT TO authenticated
  USING (
    ambassador_id = auth.uid()
    OR public.is_staff(auth.uid())
    OR public.has_role(auth.uid(), 'mentor')
    OR public.is_my_ambassador(ambassador_id)
  );

CREATE POLICY "Supervisors can award assignment scores"
  ON public.assignment_scores FOR INSERT TO authenticated
  WITH CHECK (
    public.is_staff(auth.uid())
    OR public.has_role(auth.uid(), 'mentor')
    OR public.is_my_ambassador(ambassador_id)
  );

CREATE POLICY "Only admins and managers can edit awarded scores"
  ON public.assignment_scores FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Only admins can remove awarded scores"
  ON public.assignment_scores FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_assignment_scores_updated_at
  BEFORE UPDATE ON public.assignment_scores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Learning points now include awarded assignment points
CREATE OR REPLACE FUNCTION public.recalc_points(_user_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  UPDATE public.profiles p SET
    learning_points = COALESCE((
      SELECT SUM(c.learning_points_per_class)
      FROM public.attendances a
      JOIN public.class_sessions s ON s.id = a.session_id
      JOIN public.courses c ON c.id = s.course_id
      WHERE a.ambassador_id = _user_id AND a.present
    ), 0) + COALESCE((
      SELECT SUM(e.learning_points)
      FROM public.event_attendances ea
      JOIN public.events e ON e.id = ea.event_id
      WHERE ea.ambassador_id = _user_id AND ea.present
    ), 0) + COALESCE((
      SELECT SUM(asc2.points)
      FROM public.assignment_scores asc2
      WHERE asc2.ambassador_id = _user_id
    ), 0),
    leadership_points = COALESCE((
      SELECT SUM(c.leadership_points_per_sale)
      FROM public.sales sa
      JOIN public.courses c ON c.id = sa.course_id
      WHERE sa.ambassador_id = _user_id AND sa.status = 'approved'
    ), 0) + COALESCE((
      SELECT SUM(b.leadership_points_per_sale)
      FROM public.sales sa
      JOIN public.big_opportunities b ON b.id = sa.big_opportunity_id
      WHERE sa.ambassador_id = _user_id AND sa.status = 'approved'
    ), 0)
  WHERE p.id = _user_id;
$function$;

CREATE OR REPLACE FUNCTION public.assignment_points_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalc_points(OLD.ambassador_id);
    RETURN OLD;
  END IF;
  PERFORM public.recalc_points(NEW.ambassador_id);
  IF TG_OP = 'UPDATE' AND OLD.ambassador_id <> NEW.ambassador_id THEN
    PERFORM public.recalc_points(OLD.ambassador_id);
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER assignment_scores_points_sync
  AFTER INSERT OR UPDATE OR DELETE ON public.assignment_scores
  FOR EACH ROW EXECUTE FUNCTION public.assignment_points_sync();