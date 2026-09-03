CREATE OR REPLACE FUNCTION public.leaderboard_top(_limit integer DEFAULT 10)
 RETURNS TABLE(rank bigint, user_id uuid, auto_id text, full_name text, institution text, learning_points integer, leadership_points integer, total_points integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT * FROM (
    SELECT
      rank() OVER (ORDER BY (p.learning_points + p.leadership_points) DESC, p.full_name ASC) AS rank,
      p.id, p.auto_id, p.full_name, p.institution,
      p.learning_points, p.leadership_points,
      (p.learning_points + p.leadership_points) AS total_points
    FROM public.profiles p
    WHERE EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id AND ur.role = 'ambassador')
      AND NOT EXISTS (SELECT 1 FROM public.user_roles ur2 WHERE ur2.user_id = p.id AND ur2.role IN ('admin','support_manager','mentor','coordinator'))
  ) ranked
  ORDER BY rank
  LIMIT GREATEST(COALESCE(_limit, 10), 1);
$function$;

CREATE OR REPLACE FUNCTION public.leaderboard_ambassadors(_limit integer DEFAULT 10)
 RETURNS TABLE(rank bigint, user_id uuid, auto_id text, full_name text, institution text, learning_points integer, leadership_points integer, total_points integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT * FROM (
    SELECT
      rank() OVER (ORDER BY (p.learning_points + p.leadership_points) DESC, p.full_name ASC) AS rank,
      p.id, p.auto_id, p.full_name, p.institution,
      p.learning_points, p.leadership_points,
      (p.learning_points + p.leadership_points) AS total_points
    FROM public.profiles p
    WHERE EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id AND ur.role = 'ambassador')
      AND NOT EXISTS (SELECT 1 FROM public.user_roles ur2 WHERE ur2.user_id = p.id AND ur2.role IN ('admin','support_manager','mentor','coordinator'))
  ) ranked
  ORDER BY rank
  LIMIT GREATEST(COALESCE(_limit, 10), 1);
$function$;

CREATE OR REPLACE FUNCTION public.leaderboard_ambassadors_season(_limit integer DEFAULT 10, _season_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(rank bigint, user_id uuid, auto_id text, full_name text, institution text, learning_points integer, leadership_points integer, total_points integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT * FROM (
    SELECT
      rank() OVER (ORDER BY (p.learning_points + p.leadership_points) DESC, p.full_name ASC) AS rank,
      p.id, p.auto_id, p.full_name, p.institution,
      p.learning_points, p.leadership_points,
      (p.learning_points + p.leadership_points) AS total_points
    FROM public.profiles p
    WHERE EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id AND ur.role = 'ambassador')
      AND NOT EXISTS (SELECT 1 FROM public.user_roles ur2 WHERE ur2.user_id = p.id AND ur2.role IN ('admin','support_manager','mentor','coordinator'))
      AND (_season_id IS NULL OR p.season_id = _season_id)
  ) ranked
  ORDER BY rank
  LIMIT GREATEST(COALESCE(_limit, 10), 1);
$function$;

CREATE OR REPLACE FUNCTION public.my_leaderboard_rank()
 RETURNS TABLE(rank bigint, total_points integer, leader_points integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH ranked AS (
    SELECT p.id,
      rank() OVER (ORDER BY (p.learning_points + p.leadership_points) DESC, p.full_name ASC) AS rank,
      (p.learning_points + p.leadership_points) AS total_points
    FROM public.profiles p
    WHERE EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id AND ur.role = 'ambassador')
      AND NOT EXISTS (SELECT 1 FROM public.user_roles ur2 WHERE ur2.user_id = p.id AND ur2.role IN ('admin','support_manager','mentor','coordinator'))
  )
  SELECT r.rank, r.total_points,
    (SELECT MAX(total_points) FROM ranked) AS leader_points
  FROM ranked r WHERE r.id = auth.uid();
$function$;

REVOKE EXECUTE ON FUNCTION public.leaderboard_top(integer) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.leaderboard_ambassadors(integer) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.leaderboard_ambassadors_season(integer, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.my_leaderboard_rank() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.leaderboard_top(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leaderboard_ambassadors(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leaderboard_ambassadors_season(integer, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_leaderboard_rank() TO authenticated;