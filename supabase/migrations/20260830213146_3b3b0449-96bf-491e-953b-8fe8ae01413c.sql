-- SEASONS
CREATE TABLE public.seasons (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.seasons TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seasons TO authenticated;
GRANT ALL ON public.seasons TO service_role;
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read seasons" ON public.seasons FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Staff manage seasons" ON public.seasons FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER update_seasons_updated_at BEFORE UPDATE ON public.seasons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE UNIQUE INDEX seasons_single_active ON public.seasons (is_active) WHERE is_active;

-- CMS SECTIONS
CREATE TABLE public.cms_sections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kind text NOT NULL DEFAULT 'hero',
  title text NOT NULL DEFAULT '',
  subtitle text,
  body text,
  image_url text,
  link_url text,
  link_label text,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cms_sections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_sections TO authenticated;
GRANT ALL ON public.cms_sections TO service_role;
ALTER TABLE public.cms_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read published sections" ON public.cms_sections FOR SELECT TO anon, authenticated USING (is_published);
CREATE POLICY "Staff manage cms sections" ON public.cms_sections FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER update_cms_sections_updated_at BEFORE UPDATE ON public.cms_sections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX cms_sections_kind_order_idx ON public.cms_sections (kind, sort_order);

-- CERTIFICATE TEMPLATES
CREATE TABLE public.certificate_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL DEFAULT 'Default Template',
  image_url text NOT NULL,
  signature_url text,
  authority_name text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificate_templates TO authenticated;
GRANT ALL ON public.certificate_templates TO service_role;
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read templates" ON public.certificate_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff manage templates" ON public.certificate_templates FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER update_certificate_templates_updated_at BEFORE UPDATE ON public.certificate_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- CERTIFICATE SERIALS
CREATE SEQUENCE IF NOT EXISTS public.certificate_serial_seq;
CREATE OR REPLACE FUNCTION public.next_certificate_serial()
RETURNS text LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT 'CRB-CERT-' || lpad(nextval('public.certificate_serial_seq')::text, 5, '0');
$$;
REVOKE ALL ON FUNCTION public.next_certificate_serial() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.next_certificate_serial() TO authenticated;

-- CERTIFICATES
CREATE TABLE public.certificates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  serial_no text,
  status text NOT NULL DEFAULT 'pending',
  template_id uuid REFERENCES public.certificate_templates(id) ON DELETE SET NULL,
  issued_at timestamptz,
  approved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificates TO authenticated;
GRANT ALL ON public.certificates TO service_role;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read own certificates" ON public.certificates FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "Members claim own certificates" ON public.certificates FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Staff update certificates" ON public.certificates FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff delete certificates" ON public.certificates FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));
CREATE TRIGGER update_certificates_updated_at BEFORE UPDATE ON public.certificates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.certificates_on_approve()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    NEW.serial_no := COALESCE(NEW.serial_no, public.next_certificate_serial());
    NEW.issued_at := COALESCE(NEW.issued_at, now());
    NEW.approved_by := COALESCE(NEW.approved_by, auth.uid());
    NEW.template_id := COALESCE(NEW.template_id, (SELECT id FROM public.certificate_templates WHERE is_active ORDER BY created_at DESC LIMIT 1));
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER certificates_approve_meta BEFORE UPDATE ON public.certificates FOR EACH ROW EXECUTE FUNCTION public.certificates_on_approve();

-- COURSE SCHEDULE + SEASON TAGS
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS end_date date;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS season_id uuid REFERENCES public.seasons(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS season_id uuid REFERENCES public.seasons(id) ON DELETE SET NULL;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS season_id uuid REFERENCES public.seasons(id) ON DELETE SET NULL;

-- Default active season so countdown + tagging work immediately
INSERT INTO public.seasons (title, start_date, end_date, is_active)
VALUES ('Season 1', CURRENT_DATE, (CURRENT_DATE + INTERVAL '90 days')::date, true);