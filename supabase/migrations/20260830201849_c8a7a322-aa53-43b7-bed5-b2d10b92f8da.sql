GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_my_ambassador(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_my_supervisor(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_downstream(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_all_sales(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;