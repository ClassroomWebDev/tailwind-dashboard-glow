REVOKE ALL ON FUNCTION public.leaderboard_top(integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.my_leaderboard_rank() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.leaderboard_top(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_leaderboard_rank() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff TO authenticated, anon, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, anon, service_role;