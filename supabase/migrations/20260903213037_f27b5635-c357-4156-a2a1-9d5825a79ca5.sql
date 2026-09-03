ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.leaderboard_top(_limit integer DEFAULT 10)
 RETURNS TABLE(rank bigint, user_id uuid, auto_id text, full_name text, institution text, learning_points integer, leadership_points integer, total_points integer)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
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
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
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
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
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
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
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

CREATE TABLE public.support_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  role_label text,
  phone text,
  whatsapp text,
  email text,
  photo_url text,
  available_hours text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_contacts TO authenticated;
GRANT SELECT ON public.support_contacts TO anon;
GRANT ALL ON public.support_contacts TO service_role;
ALTER TABLE public.support_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "support_contacts_read" ON public.support_contacts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "support_contacts_manage" ON public.support_contacts FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER update_support_contacts_updated_at BEFORE UPDATE ON public.support_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.program_settings
  ADD COLUMN IF NOT EXISTS helpline_whatsapp text,
  ADD COLUMN IF NOT EXISTS helpline_note text;

CREATE TABLE public.season_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  title text NOT NULL,
  min_learning_points integer NOT NULL DEFAULT 0,
  min_leadership_points integer NOT NULL DEFAULT 0,
  reward_description text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.season_milestones TO authenticated;
GRANT ALL ON public.season_milestones TO service_role;
ALTER TABLE public.season_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "season_milestones_read" ON public.season_milestones FOR SELECT TO authenticated USING (true);
CREATE POLICY "season_milestones_manage" ON public.season_milestones FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER update_season_milestones_updated_at BEFORE UPDATE ON public.season_milestones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.milestone_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id uuid NOT NULL REFERENCES public.season_milestones(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  learning_points integer NOT NULL DEFAULT 0,
  leadership_points integer NOT NULL DEFAULT 0,
  achieved_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (milestone_id, user_id)
);
GRANT SELECT ON public.milestone_achievements TO authenticated;
GRANT ALL ON public.milestone_achievements TO service_role;
ALTER TABLE public.milestone_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "milestone_achievements_read" ON public.milestone_achievements FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.sync_milestone_achievements(_user_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  INSERT INTO public.milestone_achievements (milestone_id, user_id, learning_points, leadership_points)
  SELECT m.id, p.id, p.learning_points, p.leadership_points
  FROM public.profiles p
  JOIN public.season_milestones m
    ON m.season_id = COALESCE(p.season_id, (SELECT s.id FROM public.seasons s WHERE s.is_active LIMIT 1))
  WHERE p.id = _user_id
    AND p.learning_points >= m.min_learning_points
    AND p.leadership_points >= m.min_leadership_points
    AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id AND ur.role = 'ambassador')
  ON CONFLICT (milestone_id, user_id) DO NOTHING;
$$;

CREATE OR REPLACE FUNCTION public.profiles_milestone_sync()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  PERFORM public.sync_milestone_achievements(NEW.id);
  RETURN NEW;
END;
$$;
CREATE TRIGGER profiles_milestone_sync AFTER UPDATE OF learning_points, leadership_points ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_milestone_sync();

REVOKE EXECUTE ON FUNCTION public.sync_milestone_achievements(uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.profiles_milestone_sync() FROM anon, authenticated, PUBLIC;