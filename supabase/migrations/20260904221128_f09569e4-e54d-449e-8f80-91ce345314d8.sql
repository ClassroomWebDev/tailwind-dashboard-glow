CREATE TABLE public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site settings are publicly readable"
  ON public.site_settings FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins and managers manage site settings"
  ON public.site_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'support_manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'support_manager'));

CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.site_settings (key, value) VALUES
  ('brand', '{"site_title":"Ambassador Hub — Member Profiles & Support","favicon_url":""}'::jsonb),
  ('auth', '{"heading":"Ambassador Hub","title":"One profile. One support line.","subtitle":"Keep your member profile at 100% and stay connected with your coordinator, mentor and support manager."}'::jsonb),
  ('footer', '{"brand_title":"Classroom Bangladesh","logo_url":"","mission":"Building campus leaders through learning, mentorship and real-world opportunity.","email":"info@classroombangladesh.com","address":"Dhaka, Bangladesh","columns":[{"id":"c1","title":"Explore","links":[{"id":"l1","label":"Opportunities","url":"/sales"},{"id":"l2","label":"Campus Ambassador Program","url":"/apply"},{"id":"l3","label":"Verification","url":"/certificates"},{"id":"l4","label":"Notice Board","url":"/notices"},{"id":"l5","label":"Support","url":"/support"}]}],"socials":[{"id":"s1","label":"Facebook","url":"https://facebook.com/classroombangladesh"},{"id":"s2","label":"YouTube","url":"https://youtube.com/@classroombangladesh"},{"id":"s3","label":"LinkedIn","url":"https://linkedin.com/company/classroombangladesh"}],"copyright":"© {year} Classroom Bangladesh. All rights reserved.","legal":"","bottom_links":[{"id":"b1","label":"Privacy Policy","url":"/about"},{"id":"b2","label":"Terms","url":"/about"}]}'::jsonb);