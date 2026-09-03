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