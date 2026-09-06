CREATE TABLE public.success_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text,
  social_url text,
  views_count integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.success_stories TO authenticated;
GRANT SELECT ON public.success_stories TO anon;
GRANT ALL ON public.success_stories TO service_role;

ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read success stories"
ON public.success_stories FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Staff can create success stories"
ON public.success_stories FOR INSERT
TO authenticated
WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update success stories"
ON public.success_stories FOR UPDATE
TO authenticated
USING (public.is_staff(auth.uid()))
WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete success stories"
ON public.success_stories FOR DELETE
TO authenticated
USING (public.is_staff(auth.uid()));

CREATE TRIGGER update_success_stories_updated_at
BEFORE UPDATE ON public.success_stories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.success_story_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.success_stories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (story_id, user_id)
);

GRANT SELECT, INSERT, DELETE ON public.success_story_reactions TO authenticated;
GRANT ALL ON public.success_story_reactions TO service_role;

ALTER TABLE public.success_story_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed-in members can read reactions"
ON public.success_story_reactions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Members can add their own reaction"
ON public.success_story_reactions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members can remove their own reaction"
ON public.success_story_reactions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.bump_success_story_views(_story_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.success_stories
  SET views_count = views_count + 1
  WHERE id = _story_id;
$$;

GRANT EXECUTE ON FUNCTION public.bump_success_story_views(uuid) TO authenticated;