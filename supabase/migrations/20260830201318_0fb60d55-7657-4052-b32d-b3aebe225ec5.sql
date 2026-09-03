ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS professional_title text,
  ADD COLUMN IF NOT EXISTS present_address text,
  ADD COLUMN IF NOT EXISTS permanent_address text,
  ADD COLUMN IF NOT EXISTS career_objective text,
  ADD COLUMN IF NOT EXISTS education jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS technical_skills text,
  ADD COLUMN IF NOT EXISTS soft_skills text,
  ADD COLUMN IF NOT EXISTS languages text,
  ADD COLUMN IF NOT EXISTS marital_status text,
  ADD COLUMN IF NOT EXISTS nid_no text,
  ADD COLUMN IF NOT EXISTS signature_url text;