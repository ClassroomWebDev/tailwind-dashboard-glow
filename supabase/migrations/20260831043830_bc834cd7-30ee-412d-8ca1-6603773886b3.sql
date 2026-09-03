-- COMPANY WINGS (sister concerns)
CREATE TABLE IF NOT EXISTS public.company_wings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  tagline text,
  description text,
  address text,
  helpline text,
  email text,
  logo_url text,
  social_links jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.company_wings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_wings TO authenticated;
GRANT ALL ON public.company_wings TO service_role;
ALTER TABLE public.company_wings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active wings" ON public.company_wings FOR SELECT TO anon, authenticated USING (is_active);
CREATE POLICY "Staff manage wings" ON public.company_wings FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER update_company_wings_updated_at BEFORE UPDATE ON public.company_wings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- LOGO BOARDS: one row per logo
ALTER TABLE public.logo_boards
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS link_url text,
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'client';
ALTER TABLE public.logo_boards ALTER COLUMN name DROP NOT NULL;
UPDATE public.logo_boards SET title = name WHERE title IS NULL AND name IS NOT NULL;

-- MEMBER REVIEWS: member submission + moderation flow
ALTER TABLE public.member_reviews
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS author_name text,
  ADD COLUMN IF NOT EXISTS role text,
  ADD COLUMN IF NOT EXISTS institution text,
  ADD COLUMN IF NOT EXISTS review_text text,
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';
ALTER TABLE public.member_reviews ALTER COLUMN name DROP NOT NULL;
ALTER TABLE public.member_reviews ALTER COLUMN quote DROP NOT NULL;
UPDATE public.member_reviews SET
  author_name = COALESCE(author_name, name),
  role = COALESCE(role, role_label),
  review_text = COALESCE(review_text, quote),
  photo_url = COALESCE(photo_url, image_url),
  status = CASE WHEN is_published THEN 'approved' ELSE 'pending' END;

DROP POLICY IF EXISTS "Anyone can read published reviews" ON public.member_reviews;
CREATE POLICY "Anyone can read approved reviews" ON public.member_reviews FOR SELECT TO anon, authenticated USING (status = 'approved');
CREATE POLICY "Members read own reviews" ON public.member_reviews FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Members submit own reviews" ON public.member_reviews FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status = 'pending');