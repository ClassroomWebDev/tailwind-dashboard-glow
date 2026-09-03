-- points columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS learning_points integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS leadership_points integer NOT NULL DEFAULT 0;

CREATE TYPE public.sale_status AS ENUM ('pending', 'approved', 'rejected');

-- helper: staff = admin or support manager
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin','support_manager')
  )
$$;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.is_my_ambassador(_profile_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = _profile_id
      AND (p.coordinator_id = auth.uid() OR p.mentor_id = auth.uid() OR p.support_manager_id = auth.uid())
  )
$$;
REVOKE EXECUTE ON FUNCTION public.is_my_ambassador(uuid) FROM anon, authenticated;

-- COURSES
CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  mission text,
  details text,
  class_quantity integer NOT NULL DEFAULT 1,
  has_certificate boolean NOT NULL DEFAULT false,
  regular_price numeric NOT NULL DEFAULT 0,
  student_price numeric NOT NULL DEFAULT 0,
  coordinator_price numeric NOT NULL DEFAULT 0,
  ambassador_price numeric NOT NULL DEFAULT 0,
  learning_points_per_class integer NOT NULL DEFAULT 0,
  leadership_points_per_sale integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT ALL ON public.courses TO service_role;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view courses" ON public.courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert courses" ON public.courses FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff can update courses" ON public.courses FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff can delete courses" ON public.courses FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

-- CLASS SESSIONS
CREATE TABLE public.class_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  session_date date NOT NULL DEFAULT current_date,
  created_by uuid REFERENCES auth.users,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_sessions TO authenticated;
GRANT ALL ON public.class_sessions TO service_role;
ALTER TABLE public.class_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view sessions" ON public.class_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert sessions" ON public.class_sessions FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff can update sessions" ON public.class_sessions FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff can delete sessions" ON public.class_sessions FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

-- ATTENDANCES
CREATE TABLE public.attendances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.class_sessions(id) ON DELETE CASCADE,
  ambassador_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  present boolean NOT NULL DEFAULT true,
  marked_by uuid REFERENCES auth.users,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, ambassador_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendances TO authenticated;
GRANT ALL ON public.attendances TO service_role;
ALTER TABLE public.attendances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own or team attendance" ON public.attendances FOR SELECT TO authenticated
  USING (ambassador_id = auth.uid() OR public.is_my_ambassador(ambassador_id) OR public.is_staff(auth.uid()));
CREATE POLICY "Supervisors can insert attendance" ON public.attendances FOR INSERT TO authenticated
  WITH CHECK (public.is_my_ambassador(ambassador_id) OR public.is_staff(auth.uid()));
CREATE POLICY "Supervisors can update attendance" ON public.attendances FOR UPDATE TO authenticated
  USING (public.is_my_ambassador(ambassador_id) OR public.is_staff(auth.uid()))
  WITH CHECK (public.is_my_ambassador(ambassador_id) OR public.is_staff(auth.uid()));
CREATE POLICY "Staff can delete attendance" ON public.attendances FOR DELETE TO authenticated
  USING (public.is_staff(auth.uid()));

-- SALES
CREATE TABLE public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
  ambassador_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  submitted_by uuid REFERENCES auth.users,
  student_name text NOT NULL,
  student_mobile text NOT NULL,
  student_email text,
  student_institution text,
  payment_method text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  status public.sale_status NOT NULL DEFAULT 'pending',
  invoice_no text,
  tx_id text,
  approved_by uuid REFERENCES auth.users,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO authenticated;
GRANT ALL ON public.sales TO service_role;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own or team sales" ON public.sales FOR SELECT TO authenticated
  USING (ambassador_id = auth.uid() OR submitted_by = auth.uid() OR public.is_my_ambassador(ambassador_id) OR public.is_staff(auth.uid()));
CREATE POLICY "Submit own or team sales" ON public.sales FOR INSERT TO authenticated
  WITH CHECK (submitted_by = auth.uid()
    AND (ambassador_id = auth.uid() OR public.is_my_ambassador(ambassador_id) OR public.is_staff(auth.uid())));
CREATE POLICY "Staff can update sales" ON public.sales FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff can delete sales" ON public.sales FOR DELETE TO authenticated
  USING (public.is_staff(auth.uid()));

-- timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_class_sessions_updated_at BEFORE UPDATE ON public.class_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_attendances_updated_at BEFORE UPDATE ON public.attendances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- points recalculation
CREATE OR REPLACE FUNCTION public.recalc_points(_user_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.profiles p SET
    learning_points = COALESCE((
      SELECT SUM(c.learning_points_per_class)
      FROM public.attendances a
      JOIN public.class_sessions s ON s.id = a.session_id
      JOIN public.courses c ON c.id = s.course_id
      WHERE a.ambassador_id = _user_id AND a.present
    ), 0),
    leadership_points = COALESCE((
      SELECT SUM(c.leadership_points_per_sale)
      FROM public.sales sa
      JOIN public.courses c ON c.id = sa.course_id
      WHERE sa.ambassador_id = _user_id AND sa.status = 'approved'
    ), 0)
  WHERE p.id = _user_id;
$$;
REVOKE EXECUTE ON FUNCTION public.recalc_points(uuid) FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.points_sync()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalc_points(OLD.ambassador_id);
    RETURN OLD;
  END IF;
  PERFORM public.recalc_points(NEW.ambassador_id);
  IF TG_OP = 'UPDATE' AND OLD.ambassador_id <> NEW.ambassador_id THEN
    PERFORM public.recalc_points(OLD.ambassador_id);
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.points_sync() FROM anon, authenticated;

CREATE TRIGGER attendances_points_sync AFTER INSERT OR UPDATE OR DELETE ON public.attendances
  FOR EACH ROW EXECUTE FUNCTION public.points_sync();
CREATE TRIGGER sales_points_sync AFTER INSERT OR UPDATE OR DELETE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.points_sync();

-- invoice / tx generation on approval
CREATE OR REPLACE FUNCTION public.sales_on_approve()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    NEW.invoice_no := COALESCE(NEW.invoice_no, 'INV-' || to_char(now(), 'YYMMDD') || '-' || upper(substr(replace(NEW.id::text, '-', ''), 1, 6)));
    NEW.tx_id := COALESCE(NEW.tx_id, 'TX-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)));
    NEW.approved_at := now();
    NEW.approved_by := COALESCE(NEW.approved_by, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.sales_on_approve() FROM anon, authenticated;

CREATE TRIGGER sales_approve_meta BEFORE UPDATE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.sales_on_approve();

-- guard: points columns are system managed
CREATE OR REPLACE FUNCTION public.guard_points_columns()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF current_setting('role', true) <> 'rls_off' THEN
    NEW.learning_points := OLD.learning_points;
    NEW.leadership_points := OLD.leadership_points;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.guard_points_columns() FROM anon, authenticated;