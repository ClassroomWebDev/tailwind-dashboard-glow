CREATE OR REPLACE FUNCTION public.leaderboard_ambassadors_season(_limit integer DEFAULT 10, _season_id uuid DEFAULT NULL)
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
    WHERE _season_id IS NULL OR p.season_id = _season_id
  ) ranked
  ORDER BY rank
  LIMIT GREATEST(COALESCE(_limit, 10), 1);
$$;

REVOKE ALL ON FUNCTION public.leaderboard_ambassadors_season(integer, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.leaderboard_ambassadors_season(integer, uuid) TO authenticated;