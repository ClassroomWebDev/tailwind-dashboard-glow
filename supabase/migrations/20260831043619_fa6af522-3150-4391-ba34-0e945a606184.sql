-- LOGO BOARDS
CREATE TABLE public.logo_boards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  logos jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.logo_boards TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.logo_boards TO authenticated;
GRANT ALL ON public.logo_boards TO service_role;
ALTER TABLE public.logo_boards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read logo boards" ON public.logo_boards FOR SELECT TO anon, authenticated USING (is_active);
CREATE POLICY "Staff manage logo boards" ON public.logo_boards FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER update_logo_boards_updated_at BEFORE UPDATE ON public.logo_boards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- STRUCTURE ITEMS + WINGS in program_settings
INSERT INTO public.program_settings (id, key, value) VALUES
  (false, 'program_structure', '{"sections":[]}'),
  (false, 'wings', '[]')
ON CONFLICT (key) DO NOTHING;

-- MEMBER REVIEWS
CREATE TABLE public.member_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  role_label text,
  quote text NOT NULL,
  image_url text,
  rating integer,
  is_published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.member_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.member_reviews TO authenticated;
GRANT ALL ON public.member_reviews TO service_role;
ALTER TABLE public.member_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read published reviews" ON public.member_reviews FOR SELECT TO anon, authenticated USING (is_published);
CREATE POLICY "Staff manage reviews" ON public.member_reviews FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER update_member_reviews_updated_at BEFORE UPDATE ON public.member_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- COURSE BANNER
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS banner_url text;