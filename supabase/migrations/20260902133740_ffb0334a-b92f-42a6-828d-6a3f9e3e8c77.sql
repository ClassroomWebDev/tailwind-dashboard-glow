-- 1. Single active season enforcement
CREATE OR REPLACE FUNCTION public.enforce_single_active_season()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_active THEN
    UPDATE public.seasons SET is_active = false WHERE id <> NEW.id AND is_active;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.enforce_single_active_season() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS seasons_single_active ON public.seasons;
CREATE TRIGGER seasons_single_active
AFTER INSERT OR UPDATE OF is_active ON public.seasons
FOR EACH ROW WHEN (NEW.is_active)
EXECUTE FUNCTION public.enforce_single_active_season();

-- 2. Cross-season access flag
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS can_access_all_seasons boolean NOT NULL DEFAULT false;

-- 3. Event learning points
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS learning_points integer NOT NULL DEFAULT 0;

-- 4. Event attendance
CREATE TABLE IF NOT EXISTS public.event_attendances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  ambassador_id uuid NOT NULL,
  present boolean NOT NULL DEFAULT false,
  marked_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, ambassador_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_attendances TO authenticated;
GRANT ALL ON public.event_attendances TO service_role;

ALTER TABLE public.event_attendances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read own event attendance"
ON public.event_attendances FOR SELECT TO authenticated
USING (ambassador_id = auth.uid() OR public.is_staff(auth.uid()) OR public.is_my_ambassador(ambassador_id));

CREATE POLICY "Supervisors insert event attendance"
ON public.event_attendances FOR INSERT TO authenticated
WITH CHECK (public.is_staff(auth.uid()) OR public.is_my_ambassador(ambassador_id));

CREATE POLICY "Supervisors update event attendance"
ON public.event_attendances FOR UPDATE TO authenticated
USING (public.is_staff(auth.uid()) OR public.is_my_ambassador(ambassador_id))
WITH CHECK (public.is_staff(auth.uid()) OR public.is_my_ambassador(ambassador_id));

CREATE POLICY "Staff delete event attendance"
ON public.event_attendances FOR DELETE TO authenticated
USING (public.is_staff(auth.uid()));

CREATE TRIGGER update_event_attendances_updated_at
BEFORE UPDATE ON public.event_attendances
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Learning points now include event attendance
CREATE OR REPLACE FUNCTION public.recalc_points(_user_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
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
    ), 0),
    leadership_points = COALESCE((
      SELECT SUM(c.leadership_points_per_sale)
      FROM public.sales sa
      JOIN public.courses c ON c.id = sa.course_id
      WHERE sa.ambassador_id = _user_id AND sa.status = 'approved'
    ), 0)
  WHERE p.id = _user_id;
$$;

CREATE TRIGGER event_attendances_points_sync
AFTER INSERT OR UPDATE OR DELETE ON public.event_attendances
FOR EACH ROW EXECUTE FUNCTION public.points_sync();