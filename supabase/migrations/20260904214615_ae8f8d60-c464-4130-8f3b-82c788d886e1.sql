
CREATE OR REPLACE FUNCTION public.public_apply_meta()
RETURNS TABLE(brand_title text, brand_logo_url text, org_helpline text, helpline_whatsapp text, season_title text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.brand_title, s.brand_logo_url, s.org_helpline, s.helpline_whatsapp,
         (SELECT se.title FROM public.seasons se WHERE se.is_active LIMIT 1)
  FROM public.program_settings s
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.public_lookup_ambassador(_code text)
RETURNS TABLE(id uuid, code text, full_name text, institution text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.auto_id, p.full_name, p.institution
  FROM public.profiles p
  WHERE p.auto_id ILIKE _code
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.public_apply_meta() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.public_lookup_ambassador(text) TO anon, authenticated;
GRANT INSERT ON public.applications TO anon;
GRANT SELECT ON public.seasons TO anon;
