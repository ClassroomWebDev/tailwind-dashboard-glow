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
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
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
REVOKE EXECUTE ON FUNCTION public.sync_milestone_achievements(uuid) FROM anon, PUBLIC;

CREATE OR REPLACE FUNCTION public.profiles_milestone_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.sync_milestone_achievements(NEW.id);
  RETURN NEW;
END;
$$;
CREATE TRIGGER profiles_milestone_sync AFTER UPDATE OF learning_points, leadership_points ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_milestone_sync();