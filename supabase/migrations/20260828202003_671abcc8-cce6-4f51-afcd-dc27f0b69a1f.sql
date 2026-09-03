-- 1. Auto member IDs
CREATE SEQUENCE IF NOT EXISTS public.member_id_seq;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS auto_id text UNIQUE;

CREATE OR REPLACE FUNCTION public.role_prefix(_role app_role)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE _role
    WHEN 'admin' THEN 'CBD'
    WHEN 'support_manager' THEN 'CBG'
    WHEN 'mentor' THEN 'CBM'
    WHEN 'coordinator' THEN 'CBC'
    ELSE 'CBA' END;
$$;

CREATE OR REPLACE FUNCTION public.next_auto_id(_role app_role)
RETURNS text LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT public.role_prefix(_role) || lpad(nextval('public.member_id_seq')::text, 5, '0');
$$;

UPDATE public.profiles p
SET auto_id = public.next_auto_id(COALESCE((SELECT r.role FROM public.user_roles r WHERE r.user_id = p.id LIMIT 1), 'ambassador'))
WHERE p.auto_id IS NULL;

-- keep handle_new_user assigning an auto id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, mobile, auto_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'mobile', ''),
    public.next_auto_id('ambassador')
  )
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'ambassador')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

-- 2. Receipt fields on sales
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS order_no text;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS payment_ref text;

-- 3. Downstream visibility helper
CREATE OR REPLACE FUNCTION public.is_downstream(_profile_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = _profile_id
      AND (
        p.coordinator_id = auth.uid()
        OR p.mentor_id = auth.uid()
        OR p.support_manager_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.profiles c
          WHERE c.id = p.coordinator_id
            AND (c.mentor_id = auth.uid() OR c.support_manager_id = auth.uid())
        )
      )
  );
$$;

CREATE POLICY "Staff can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can update all profiles" ON public.profiles
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Supervisors can view downstream profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.is_downstream(id));

-- 4. Prospects (seat reservations)
CREATE TABLE IF NOT EXISTS public.prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  mobile text NOT NULL,
  facebook_link text,
  note text,
  status text NOT NULL DEFAULT 'reserved',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prospects TO authenticated;
GRANT ALL ON public.prospects TO service_role;
ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage own prospects" ON public.prospects
  FOR ALL TO authenticated USING (ambassador_id = auth.uid()) WITH CHECK (ambassador_id = auth.uid());
CREATE POLICY "Supervisors and staff view prospects" ON public.prospects
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()) OR public.is_downstream(ambassador_id));
CREATE TRIGGER update_prospects_updated_at BEFORE UPDATE ON public.prospects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Program settings (singleton)
CREATE TABLE IF NOT EXISTS public.program_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  season_target_points integer NOT NULL DEFAULT 1000,
  season_start date NOT NULL DEFAULT date_trunc('year', now())::date,
  org_name text NOT NULL DEFAULT 'Classroom Ambassador Program',
  org_address text,
  org_helpline text,
  org_website text,
  org_facebook text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.program_settings TO authenticated;
GRANT INSERT, UPDATE ON public.program_settings TO authenticated;
GRANT ALL ON public.program_settings TO service_role;
ALTER TABLE public.program_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone signed in can read settings" ON public.program_settings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff manage settings" ON public.program_settings
  FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER update_program_settings_updated_at BEFORE UPDATE ON public.program_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
INSERT INTO public.program_settings (id, org_address, org_helpline, org_website, org_facebook)
VALUES (true, 'Dhaka, Bangladesh', '+8801000000000', 'https://example.com', 'https://facebook.com/')
ON CONFLICT (id) DO NOTHING;

-- 6. Leaderboard helpers
CREATE OR REPLACE FUNCTION public.leaderboard_top(_limit integer DEFAULT 10)
RETURNS TABLE (
  rank bigint,
  user_id uuid,
  auto_id text,
  full_name text,
  institution text,
  learning_points integer,
  leadership_points integer,
  total_points integer
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM (
    SELECT
      rank() OVER (ORDER BY (p.learning_points + p.leadership_points) DESC, p.full_name ASC) AS rank,
      p.id, p.auto_id, p.full_name, p.institution,
      p.learning_points, p.leadership_points,
      (p.learning_points + p.leadership_points) AS total_points
    FROM public.profiles p
  ) ranked
  ORDER BY rank
  LIMIT GREATEST(COALESCE(_limit, 10), 1);
$$;

CREATE OR REPLACE FUNCTION public.my_leaderboard_rank()
RETURNS TABLE (rank bigint, total_points integer, leader_points integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH ranked AS (
    SELECT p.id,
      rank() OVER (ORDER BY (p.learning_points + p.leadership_points) DESC, p.full_name ASC) AS rank,
      (p.learning_points + p.leadership_points) AS total_points
    FROM public.profiles p
  )
  SELECT r.rank, r.total_points,
    (SELECT MAX(total_points) FROM ranked) AS leader_points
  FROM ranked r WHERE r.id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.leaderboard_top(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_leaderboard_rank() TO authenticated;
REVOKE ALL ON FUNCTION public.role_prefix(app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.next_auto_id(app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_downstream(uuid) FROM PUBLIC, anon, authenticated;
