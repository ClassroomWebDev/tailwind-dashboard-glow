ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS thumbnail_url text;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;
ALTER TABLE public.big_opportunities ADD COLUMN IF NOT EXISTS thumbnail_url text;

-- ---------- Reset helpers (admin only) ----------
CREATE OR REPLACE FUNCTION public.assert_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only administrators can perform system resets';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_master_reset()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _kept int;
BEGIN
  PERFORM public.assert_admin();

  DELETE FROM public.success_story_reactions;
  DELETE FROM public.notifications;
  DELETE FROM public.milestone_achievements;
  DELETE FROM public.certificates;
  DELETE FROM public.member_reviews;
  DELETE FROM public.event_attendances;
  DELETE FROM public.attendances;
  DELETE FROM public.prospects;
  DELETE FROM public.applications;
  DELETE FROM public.sales;

  DELETE FROM public.user_roles ur
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles a WHERE a.user_id = ur.user_id AND a.role = 'admin'
  );
  UPDATE public.profiles SET coordinator_id = NULL, mentor_id = NULL, support_manager_id = NULL
  WHERE coordinator_id IS NOT NULL OR mentor_id IS NOT NULL OR support_manager_id IS NOT NULL;
  DELETE FROM public.profiles p
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles a WHERE a.user_id = p.id AND a.role = 'admin'
  );

  SELECT count(*) INTO _kept FROM public.profiles;
  RETURN 'Master reset complete. ' || _kept || ' admin account(s) retained.';
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reset_season(_season_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _n int; _uid uuid;
BEGIN
  PERFORM public.assert_admin();
  IF _season_id IS NULL THEN RAISE EXCEPTION 'Select a season first'; END IF;

  DELETE FROM public.milestone_achievements ma
  USING public.season_milestones m
  WHERE ma.milestone_id = m.id AND m.season_id = _season_id;

  DELETE FROM public.applications WHERE season_id = _season_id;
  DELETE FROM public.sales WHERE season_id = _season_id;
  GET DIAGNOSTICS _n = ROW_COUNT;

  FOR _uid IN SELECT id FROM public.profiles WHERE season_id = _season_id LOOP
    PERFORM public.recalc_points(_uid);
  END LOOP;

  RETURN 'Season reset complete. ' || _n || ' opportunity record(s) cleared.';
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reset_ambassadors()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _n int;
BEGIN
  PERFORM public.assert_admin();

  CREATE TEMP TABLE _amb ON COMMIT DROP AS
  SELECT ur.user_id AS id FROM public.user_roles ur
  WHERE ur.role = 'ambassador'
    AND NOT EXISTS (
      SELECT 1 FROM public.user_roles o
      WHERE o.user_id = ur.user_id AND o.role IN ('admin','support_manager','mentor','coordinator')
    );

  DELETE FROM public.success_story_reactions WHERE user_id IN (SELECT id FROM _amb);
  DELETE FROM public.notifications WHERE user_id IN (SELECT id FROM _amb);
  DELETE FROM public.milestone_achievements WHERE user_id IN (SELECT id FROM _amb);
  DELETE FROM public.certificates WHERE user_id IN (SELECT id FROM _amb);
  DELETE FROM public.member_reviews WHERE user_id IN (SELECT id FROM _amb);
  DELETE FROM public.event_attendances WHERE ambassador_id IN (SELECT id FROM _amb);
  DELETE FROM public.attendances WHERE ambassador_id IN (SELECT id FROM _amb);
  DELETE FROM public.prospects WHERE ambassador_id IN (SELECT id FROM _amb);
  DELETE FROM public.applications WHERE ambassador_id IN (SELECT id FROM _amb);
  DELETE FROM public.sales WHERE ambassador_id IN (SELECT id FROM _amb) OR submitted_by IN (SELECT id FROM _amb);

  DELETE FROM public.user_roles WHERE user_id IN (SELECT id FROM _amb);
  DELETE FROM public.profiles WHERE id IN (SELECT id FROM _amb);
  GET DIAGNOSTICS _n = ROW_COUNT;

  RETURN 'Ambassador reset complete. ' || _n || ' ambassador account(s) removed.';
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reset_coordinators()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _n int;
BEGIN
  PERFORM public.assert_admin();

  IF EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.coordinator_id AND ur.role = 'coordinator'
  ) THEN
    RAISE EXCEPTION 'Cannot reset coordinator: active team members assigned. Reassign or remove team members first.';
  END IF;

  DELETE FROM public.sales WHERE ambassador_id IN (SELECT user_id FROM public.user_roles WHERE role = 'coordinator')
     OR submitted_by IN (SELECT user_id FROM public.user_roles WHERE role = 'coordinator');
  DELETE FROM public.notifications WHERE user_id IN (SELECT user_id FROM public.user_roles WHERE role = 'coordinator');
  DELETE FROM public.member_reviews WHERE user_id IN (SELECT user_id FROM public.user_roles WHERE role = 'coordinator');
  DELETE FROM public.profiles WHERE id IN (SELECT user_id FROM public.user_roles WHERE role = 'coordinator');
  GET DIAGNOSTICS _n = ROW_COUNT;
  DELETE FROM public.user_roles WHERE role = 'coordinator';

  RETURN 'Coordinator reset complete. ' || _n || ' coordinator account(s) removed.';
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reset_faculty()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _n int;
BEGIN
  PERFORM public.assert_admin();

  IF EXISTS (
    SELECT 1 FROM public.courses c
    JOIN public.user_roles ur ON ur.user_id = c.created_by AND ur.role = 'mentor'
  ) OR EXISTS (
    SELECT 1 FROM public.class_sessions s
    JOIN public.user_roles ur ON ur.user_id = s.created_by AND ur.role = 'mentor'
  ) OR EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.mentor_id AND ur.role = 'mentor'
  ) THEN
    RAISE EXCEPTION 'Cannot reset faculty: active courses, classes or team members are linked. Remove or reassign them first.';
  END IF;

  DELETE FROM public.notifications WHERE user_id IN (SELECT user_id FROM public.user_roles WHERE role = 'mentor');
  DELETE FROM public.member_reviews WHERE user_id IN (SELECT user_id FROM public.user_roles WHERE role = 'mentor');
  DELETE FROM public.profiles WHERE id IN (SELECT user_id FROM public.user_roles WHERE role = 'mentor');
  GET DIAGNOSTICS _n = ROW_COUNT;
  DELETE FROM public.user_roles WHERE role = 'mentor';

  RETURN 'Faculty reset complete. ' || _n || ' faculty account(s) removed.';
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reset_managers()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _n int;
BEGIN
  PERFORM public.assert_admin();

  IF EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.support_manager_id AND ur.role = 'support_manager'
  ) OR EXISTS (
    SELECT 1 FROM public.sales s
    JOIN public.user_roles ur ON ur.user_id = s.approved_by AND ur.role = 'support_manager'
  ) THEN
    RAISE EXCEPTION 'Cannot reset manager: downstream coordinators or operational logs depend on them. Reassign them first.';
  END IF;

  DELETE FROM public.notifications WHERE user_id IN (SELECT user_id FROM public.user_roles WHERE role = 'support_manager');
  DELETE FROM public.member_reviews WHERE user_id IN (SELECT user_id FROM public.user_roles WHERE role = 'support_manager');
  DELETE FROM public.profiles p WHERE p.id IN (
    SELECT ur.user_id FROM public.user_roles ur
    WHERE ur.role = 'support_manager'
      AND NOT EXISTS (SELECT 1 FROM public.user_roles a WHERE a.user_id = ur.user_id AND a.role = 'admin')
  );
  GET DIAGNOSTICS _n = ROW_COUNT;
  DELETE FROM public.user_roles WHERE role = 'support_manager';

  RETURN 'Manager reset complete. ' || _n || ' manager account(s) removed.';
END;
$$;

REVOKE ALL ON FUNCTION public.assert_admin() FROM public;
GRANT EXECUTE ON FUNCTION public.admin_master_reset() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reset_season(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reset_ambassadors() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reset_coordinators() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reset_faculty() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reset_managers() TO authenticated;