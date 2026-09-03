REVOKE ALL ON FUNCTION public.leaderboard_top(integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.my_leaderboard_rank() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.leaderboard_top(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_leaderboard_rank() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff TO authenticated, anon, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, anon, service_role;

CREATE OR REPLACE FUNCTION public.role_prefix(_role app_role)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $function$
  SELECT CASE _role
    WHEN 'admin' THEN 'CBD'
    WHEN 'support_manager' THEN 'CBM'
    WHEN 'mentor' THEN 'CBF'
    WHEN 'coordinator' THEN 'CBC'
    ELSE 'CBA' END;
$function$;

CREATE OR REPLACE FUNCTION public.leaderboard_ambassadors(_limit integer DEFAULT 10)
RETURNS TABLE(rank bigint, user_id uuid, auto_id text, full_name text, institution text, learning_points integer, leadership_points integer, total_points integer)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT * FROM (
    SELECT
      rank() OVER (ORDER BY (p.learning_points + p.leadership_points) DESC, p.full_name ASC) AS rank,
      p.id, p.auto_id, p.full_name, p.institution,
      p.learning_points, p.leadership_points,
      (p.learning_points + p.leadership_points) AS total_points
    FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.id AND ur.role = 'ambassador'
  ) ranked
  ORDER BY rank
  LIMIT GREATEST(COALESCE(_limit, 10), 1);
$$;

REVOKE ALL ON FUNCTION public.leaderboard_ambassadors(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.leaderboard_ambassadors(integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.leaderboard_coordinators(_limit integer DEFAULT 10)
RETURNS TABLE(rank bigint, user_id uuid, auto_id text, full_name text, institution text, sales_count bigint, sales_amount numeric)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'support_manager') OR public.has_role(auth.uid(), 'mentor')) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  RETURN QUERY
  WITH coords AS (
    SELECT p.id, p.auto_id, p.full_name, p.institution
    FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.id AND ur.role = 'coordinator'
  ), agg AS (
    SELECT c.id, c.auto_id, c.full_name, c.institution,
      COALESCE(s.cnt, 0) AS sales_count,
      COALESCE(s.amt, 0) AS sales_amount
    FROM coords c
    LEFT JOIN (
      SELECT co.id AS coord_id, COUNT(sa.id) AS cnt, SUM(sa.amount) AS amt
      FROM coords co
      JOIN public.sales sa ON sa.status = 'approved'
      LEFT JOIN public.profiles amb ON amb.id = sa.ambassador_id
      WHERE sa.ambassador_id = co.id OR amb.coordinator_id = co.id
      GROUP BY co.id
    ) s ON s.coord_id = c.id
  )
  SELECT rank() OVER (ORDER BY a.sales_amount DESC, a.sales_count DESC, a.full_name ASC),
         a.id, a.auto_id, a.full_name, a.institution, a.sales_count, a.sales_amount
  FROM agg a
  ORDER BY 1
  LIMIT GREATEST(COALESCE(_limit, 10), 1);
END;
$$;

REVOKE ALL ON FUNCTION public.leaderboard_coordinators(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.leaderboard_coordinators(integer) TO authenticated;

ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

CREATE OR REPLACE FUNCTION public.can_view_all_sales(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin','support_manager','mentor')
  );
$$;

DROP POLICY IF EXISTS "View own or team sales" ON public.sales;
CREATE POLICY "View own or team sales" ON public.sales
  FOR SELECT TO authenticated
  USING (
    ambassador_id = auth.uid()
    OR submitted_by = auth.uid()
    OR public.is_my_ambassador(ambassador_id)
    OR public.can_view_all_sales(auth.uid())
  );

REVOKE ALL ON FUNCTION public.can_view_all_sales(uuid) FROM PUBLIC, anon, authenticated;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS professional_title text,
  ADD COLUMN IF NOT EXISTS present_address text,
  ADD COLUMN IF NOT EXISTS permanent_address text,
  ADD COLUMN IF NOT EXISTS career_objective text,
  ADD COLUMN IF NOT EXISTS education jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS technical_skills text,
  ADD COLUMN IF NOT EXISTS soft_skills text,
  ADD COLUMN IF NOT EXISTS languages text,
  ADD COLUMN IF NOT EXISTS marital_status text,
  ADD COLUMN IF NOT EXISTS nid_no text,
  ADD COLUMN IF NOT EXISTS signature_url text;

GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_my_ambassador(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_my_supervisor(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_downstream(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_all_sales(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;