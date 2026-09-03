ALTER TABLE public.program_settings
  ADD COLUMN IF NOT EXISTS key text,
  ADD COLUMN IF NOT EXISTS value jsonb;
CREATE UNIQUE INDEX IF NOT EXISTS program_settings_key_idx ON public.program_settings (key) WHERE key IS NOT NULL;