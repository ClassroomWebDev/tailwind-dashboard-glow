-- Profile reference + experience fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS experience text,
  ADD COLUMN IF NOT EXISTS ref1_name text,
  ADD COLUMN IF NOT EXISTS ref1_designation text,
  ADD COLUMN IF NOT EXISTS ref1_phone text,
  ADD COLUMN IF NOT EXISTS ref1_email text,
  ADD COLUMN IF NOT EXISTS ref1_relation text,
  ADD COLUMN IF NOT EXISTS ref2_name text,
  ADD COLUMN IF NOT EXISTS ref2_designation text,
  ADD COLUMN IF NOT EXISTS ref2_phone text,
  ADD COLUMN IF NOT EXISTS ref2_email text,
  ADD COLUMN IF NOT EXISTS ref2_relation text;

-- Audience enum
DO $$ BEGIN
  CREATE TYPE public.notice_audience AS ENUM ('all', 'roles', 'individual');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  audience public.notice_audience NOT NULL DEFAULT 'all',
  target_roles public.app_role[] NOT NULL DEFAULT '{}',
  target_user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notices TO authenticated;
GRANT ALL ON public.notices TO service_role;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage notices" ON public.notices FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Members read targeted notices" ON public.notices FOR SELECT TO authenticated
  USING (
    audience = 'all'
    OR (audience = 'individual' AND target_user_id = auth.uid())
    OR (audience = 'roles' AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = ANY (target_roles)
    ))
  );

CREATE TRIGGER update_notices_updated_at BEFORE UPDATE ON public.notices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  starts_at timestamptz NOT NULL,
  location text NOT NULL DEFAULT '',
  description text,
  banner_url text,
  is_cancelled boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage events" ON public.events FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Members read events" ON public.events FOR SELECT TO authenticated
  USING (true);

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'notice',
  title text NOT NULL,
  body text,
  notice_id uuid REFERENCES public.notices(id) ON DELETE CASCADE,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications (user_id, is_read, created_at DESC);

GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications" ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Fan-out notifications on notice publish
CREATE OR REPLACE FUNCTION public.notify_on_notice()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.notifications (user_id, kind, title, body, notice_id)
  SELECT p.id, 'notice', NEW.title, left(COALESCE(NEW.content, ''), 200), NEW.id
  FROM public.profiles p
  WHERE p.id <> COALESCE(NEW.created_by, '00000000-0000-0000-0000-000000000000'::uuid)
    AND (
      NEW.audience = 'all'
      OR (NEW.audience = 'individual' AND p.id = NEW.target_user_id)
      OR (NEW.audience = 'roles' AND EXISTS (
        SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id AND ur.role = ANY (NEW.target_roles)
      ))
    );
  RETURN NEW;
END; $$;

CREATE TRIGGER notices_notify AFTER INSERT ON public.notices
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_notice();

CREATE OR REPLACE FUNCTION public.notify_on_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.notifications (user_id, kind, title, body, event_id)
  SELECT p.id, 'event', NEW.title, left(COALESCE(NEW.description, ''), 200), NEW.id
  FROM public.profiles p
  WHERE p.id <> COALESCE(NEW.created_by, '00000000-0000-0000-0000-000000000000'::uuid);
  RETURN NEW;
END; $$;

CREATE TRIGGER events_notify AFTER INSERT ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_event();

REVOKE ALL ON FUNCTION public.notify_on_notice() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_on_event() FROM PUBLIC, anon, authenticated;