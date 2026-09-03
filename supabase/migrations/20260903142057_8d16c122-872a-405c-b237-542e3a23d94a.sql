ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.program_settings ADD COLUMN IF NOT EXISTS certificate_threshold_percent integer NOT NULL DEFAULT 70;