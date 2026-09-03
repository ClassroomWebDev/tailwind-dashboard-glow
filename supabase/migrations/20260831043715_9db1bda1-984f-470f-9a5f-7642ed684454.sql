-- No function callable anonymously
REVOKE ALL ON FUNCTION public.can_view_all_sales(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_downstream(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_my_ambassador(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_my_supervisor(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.leaderboard_ambassadors(integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.leaderboard_coordinators(integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.leaderboard_top(integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.my_leaderboard_rank() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.next_auto_id(public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.next_certificate_serial() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.recalc_points(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.certificates_on_approve() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.guard_points_columns() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.guard_profile_locked_fields() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.notify_on_event() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.notify_on_notice() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.points_sync() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.sales_on_approve() FROM PUBLIC, anon;

-- Trigger-only / internal functions: not callable by signed-in users either
REVOKE ALL ON FUNCTION public.certificates_on_approve() FROM authenticated;
REVOKE ALL ON FUNCTION public.guard_points_columns() FROM authenticated;
REVOKE ALL ON FUNCTION public.guard_profile_locked_fields() FROM authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM authenticated;
REVOKE ALL ON FUNCTION public.notify_on_event() FROM authenticated;
REVOKE ALL ON FUNCTION public.notify_on_notice() FROM authenticated;
REVOKE ALL ON FUNCTION public.points_sync() FROM authenticated;
REVOKE ALL ON FUNCTION public.sales_on_approve() FROM authenticated;
REVOKE ALL ON FUNCTION public.next_auto_id(public.app_role) FROM authenticated;
REVOKE ALL ON FUNCTION public.recalc_points(uuid) FROM authenticated;