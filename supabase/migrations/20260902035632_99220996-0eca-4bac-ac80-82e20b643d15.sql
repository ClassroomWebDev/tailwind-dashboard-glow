CREATE TABLE public.course_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  title text NOT NULL,
  note text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_topics TO authenticated;
GRANT ALL ON public.course_topics TO service_role;
ALTER TABLE public.course_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view course topics" ON public.course_topics FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert course topics" ON public.course_topics FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff can update course topics" ON public.course_topics FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff can delete course topics" ON public.course_topics FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

CREATE TRIGGER update_course_topics_updated_at BEFORE UPDATE ON public.course_topics
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX course_topics_course_idx ON public.course_topics(course_id, sort_order);

CREATE TABLE public.batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_date date NOT NULL,
  class_time time,
  days_of_week integer[] NOT NULL DEFAULT '{}',
  total_classes integer NOT NULL DEFAULT 0,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.batches TO authenticated;
GRANT ALL ON public.batches TO service_role;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view batches" ON public.batches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert batches" ON public.batches FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff can update batches" ON public.batches FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff can delete batches" ON public.batches FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

CREATE TRIGGER update_batches_updated_at BEFORE UPDATE ON public.batches
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX batches_course_idx ON public.batches(course_id, start_date);

ALTER TABLE public.class_sessions
  ADD COLUMN batch_id uuid REFERENCES public.batches(id) ON DELETE CASCADE,
  ADD COLUMN session_type text NOT NULL DEFAULT 'regular',
  ADD COLUMN start_time time,
  ADD COLUMN status text NOT NULL DEFAULT 'scheduled',
  ADD COLUMN sequence_no integer;

ALTER TABLE public.class_sessions
  ADD CONSTRAINT class_sessions_session_type_check CHECK (session_type IN ('regular','orientation','exam','extra')),
  ADD CONSTRAINT class_sessions_status_check CHECK (status IN ('scheduled','postponed','cancelled','completed'));

CREATE INDEX class_sessions_batch_idx ON public.class_sessions(batch_id, session_date);