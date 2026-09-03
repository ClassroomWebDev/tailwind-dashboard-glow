-- LOGO BOARDS
CREATE TABLE public.logo_boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  logo_url text NOT NULL,
  category text NOT NULL DEFAULT 'wing',
  link_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT logo_boards_category_check CHECK (category IN ('wing','client','campus'))
);
GRANT SELECT ON public.logo_boards TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.logo_boards TO authenticated;
GRANT ALL ON public.logo_boards TO service_role;
ALTER TABLE public.logo_boards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Logos are publicly readable" ON public.logo_boards FOR SELECT USING (true);
CREATE POLICY "Admins manage logos" ON public.logo_boards FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_logo_boards_updated_at BEFORE UPDATE ON public.logo_boards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- COMPANY WINGS
CREATE TABLE public.company_wings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tagline text,
  description text,
  address text,
  helpline text,
  email text,
  logo_url text,
  social_links jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.company_wings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_wings TO authenticated;
GRANT ALL ON public.company_wings TO service_role;
ALTER TABLE public.company_wings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Wings are publicly readable" ON public.company_wings FOR SELECT USING (true);
CREATE POLICY "Admins manage wings" ON public.company_wings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_company_wings_updated_at BEFORE UPDATE ON public.company_wings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- MEMBER REVIEWS
CREATE TABLE public.member_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  role text,
  institution text,
  rating integer NOT NULL DEFAULT 5,
  review_text text NOT NULL,
  photo_url text,
  status text NOT NULL DEFAULT 'pending',
  moderated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT member_reviews_status_check CHECK (status IN ('pending','approved','rejected')),
  CONSTRAINT member_reviews_rating_check CHECK (rating BETWEEN 1 AND 5)
);
GRANT SELECT ON public.member_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.member_reviews TO authenticated;
GRANT ALL ON public.member_reviews TO service_role;
ALTER TABLE public.member_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved reviews are publicly readable" ON public.member_reviews FOR SELECT USING (status = 'approved');
CREATE POLICY "Members read own reviews" ON public.member_reviews FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Members submit own reviews" ON public.member_reviews FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Staff read all reviews" ON public.member_reviews FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'support_manager'));
CREATE POLICY "Staff moderate reviews" ON public.member_reviews FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'support_manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'support_manager'));
CREATE POLICY "Staff delete reviews" ON public.member_reviews FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'support_manager'));
CREATE TRIGGER update_member_reviews_updated_at BEFORE UPDATE ON public.member_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();