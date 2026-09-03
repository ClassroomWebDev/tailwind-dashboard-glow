CREATE TABLE public.big_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  banner_url text,
  price numeric NOT NULL DEFAULT 0,
  commission numeric NOT NULL DEFAULT 0,
  leadership_points_per_sale integer NOT NULL DEFAULT 0,
  apply_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.big_opportunities TO authenticated;
GRANT SELECT ON public.big_opportunities TO anon;
GRANT ALL ON public.big_opportunities TO service_role;

ALTER TABLE public.big_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active programmes"
  ON public.big_opportunities FOR SELECT
  USING (is_active OR public.is_staff(auth.uid()));

CREATE POLICY "Admins and managers manage programmes"
  ON public.big_opportunities FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'support_manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'support_manager'));

CREATE TRIGGER update_big_opportunities_updated_at
  BEFORE UPDATE ON public.big_opportunities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS community_link text;

ALTER TABLE public.sales ALTER COLUMN course_id DROP NOT NULL;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS big_opportunity_id uuid REFERENCES public.big_opportunities(id) ON DELETE SET NULL;
ALTER TABLE public.sales ADD CONSTRAINT sales_target_present CHECK (course_id IS NOT NULL OR big_opportunity_id IS NOT NULL);

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