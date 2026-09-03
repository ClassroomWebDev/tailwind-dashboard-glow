ALTER TABLE public.big_opportunities
  ADD COLUMN IF NOT EXISTS regular_price numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS student_price numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS coordinator_price numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ambassador_price numeric NOT NULL DEFAULT 0;

UPDATE public.big_opportunities
SET regular_price = CASE WHEN regular_price = 0 THEN price ELSE regular_price END,
    student_price = CASE WHEN student_price = 0 THEN price ELSE student_price END;