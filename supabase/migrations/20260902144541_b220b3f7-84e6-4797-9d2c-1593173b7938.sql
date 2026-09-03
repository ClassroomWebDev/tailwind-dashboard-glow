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

CREATE POLICY "Staff manage applications" ON public.applications
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Ambassadors view own applications" ON public.applications
  FOR SELECT TO authenticated
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

CREATE POLICY "Members read promo resources" ON public.promo_resources
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff manage promo resources" ON public.promo_resources
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

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

CREATE POLICY "Members read support links" ON public.support_links
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff manage support links" ON public.support_links
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER update_support_links_updated_at BEFORE UPDATE ON public.support_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();