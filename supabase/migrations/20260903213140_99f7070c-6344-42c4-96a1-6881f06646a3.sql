CREATE OR REPLACE FUNCTION public.enforce_single_active_season()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.is_active THEN
    UPDATE public.seasons SET is_active = false WHERE id <> NEW.id AND is_active;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.enforce_single_active_season() FROM PUBLIC, anon, authenticated;

DROP INDEX IF EXISTS public.seasons_single_active;
DROP TRIGGER IF EXISTS seasons_single_active ON public.seasons;
CREATE TRIGGER seasons_single_active
AFTER INSERT OR UPDATE OF is_active ON public.seasons
FOR EACH ROW WHEN (NEW.is_active)
EXECUTE FUNCTION public.enforce_single_active_season();

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS can_access_all_seasons boolean NOT NULL DEFAULT false;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS learning_points integer NOT NULL DEFAULT 0;

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
CREATE POLICY "Members read own event attendance" ON public.event_attendances FOR SELECT TO authenticated
USING (ambassador_id = auth.uid() OR public.is_staff(auth.uid()) OR public.is_my_ambassador(ambassador_id));
CREATE POLICY "Supervisors insert event attendance" ON public.event_attendances FOR INSERT TO authenticated
WITH CHECK (public.is_staff(auth.uid()) OR public.is_my_ambassador(ambassador_id));
CREATE POLICY "Supervisors update event attendance" ON public.event_attendances FOR UPDATE TO authenticated
USING (public.is_staff(auth.uid()) OR public.is_my_ambassador(ambassador_id))
WITH CHECK (public.is_staff(auth.uid()) OR public.is_my_ambassador(ambassador_id));
CREATE POLICY "Staff delete event attendance" ON public.event_attendances FOR DELETE TO authenticated
USING (public.is_staff(auth.uid()));
CREATE TRIGGER update_event_attendances_updated_at BEFORE UPDATE ON public.event_attendances
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER event_attendances_points_sync
AFTER INSERT OR UPDATE OR DELETE ON public.event_attendances
FOR EACH ROW EXECUTE FUNCTION public.points_sync();

ALTER TABLE public.company_wings ADD COLUMN IF NOT EXISTS badge_label text;

CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid REFERENCES public.seasons(id) ON DELETE SET NULL,
  ambassador_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ambassador_code text,
  full_name text NOT NULL,
  mobile text NOT NULL,
  institution text NOT NULL,
  facebook_link text,
  district text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX applications_season_mobile_key ON public.applications (season_id, mobile);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage applications" ON public.applications FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Ambassadors view own applications" ON public.applications FOR SELECT TO authenticated
  USING (ambassador_id = auth.uid() OR public.is_my_ambassador(ambassador_id));
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.promo_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  url text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.promo_resources TO authenticated;
GRANT ALL ON public.promo_resources TO service_role;
ALTER TABLE public.promo_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read promo resources" ON public.promo_resources FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff manage promo resources" ON public.promo_resources FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER update_promo_resources_updated_at BEFORE UPDATE ON public.promo_resources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.support_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  url text NOT NULL,
  platform text NOT NULL DEFAULT 'website',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_links TO authenticated;
GRANT ALL ON public.support_links TO service_role;
ALTER TABLE public.support_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read support links" ON public.support_links FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff manage support links" ON public.support_links FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER update_support_links_updated_at BEFORE UPDATE ON public.support_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

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
CREATE POLICY "Anyone can view active programmes" ON public.big_opportunities FOR SELECT
  USING (is_active OR public.is_staff(auth.uid()));
CREATE POLICY "Admins and managers manage programmes" ON public.big_opportunities FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'support_manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'support_manager'));
CREATE TRIGGER update_big_opportunities_updated_at BEFORE UPDATE ON public.big_opportunities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS community_link text;

ALTER TABLE public.sales ALTER COLUMN course_id DROP NOT NULL;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS big_opportunity_id uuid REFERENCES public.big_opportunities(id) ON DELETE SET NULL;
ALTER TABLE public.sales ADD CONSTRAINT sales_target_present CHECK (course_id IS NOT NULL OR big_opportunity_id IS NOT NULL);

CREATE OR REPLACE FUNCTION public.recalc_points(_user_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path TO 'public'
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
REVOKE ALL ON FUNCTION public.recalc_points(uuid) FROM PUBLIC, anon, authenticated;