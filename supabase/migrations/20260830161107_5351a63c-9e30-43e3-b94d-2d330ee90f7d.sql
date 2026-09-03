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