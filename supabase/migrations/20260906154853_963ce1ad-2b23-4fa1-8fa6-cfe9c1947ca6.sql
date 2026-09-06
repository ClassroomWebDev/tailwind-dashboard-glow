ALTER TABLE public.batches
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'upcoming',
  ADD COLUMN IF NOT EXISTS seat_limit integer,
  ADD COLUMN IF NOT EXISTS faculty_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.batches
  DROP CONSTRAINT IF EXISTS batches_status_check;

ALTER TABLE public.batches
  ADD CONSTRAINT batches_status_check CHECK (status IN ('running','upcoming','completed'));