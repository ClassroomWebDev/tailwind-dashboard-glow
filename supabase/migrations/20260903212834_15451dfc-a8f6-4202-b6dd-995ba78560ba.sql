ALTER TABLE public.program_settings
  ADD COLUMN IF NOT EXISTS key text,
  ADD COLUMN IF NOT EXISTS value jsonb;

ALTER TABLE public.program_settings DROP CONSTRAINT IF EXISTS program_settings_id_check;
ALTER TABLE public.program_settings ALTER COLUMN id SET DEFAULT false;

ALTER TABLE public.program_settings DROP CONSTRAINT IF EXISTS program_settings_pkey;
UPDATE public.program_settings SET key = 'org' WHERE key IS NULL;
ALTER TABLE public.program_settings ALTER COLUMN key SET NOT NULL;
DROP INDEX IF EXISTS public.program_settings_key_idx;
ALTER TABLE public.program_settings ADD PRIMARY KEY (key);

INSERT INTO public.program_settings (id, key, value) VALUES
  (false, 'program_structure', '{"sections":[]}'),
  (false, 'wings', '[]')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS banner_url text;