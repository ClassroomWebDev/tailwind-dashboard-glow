ALTER TABLE public.program_settings DROP CONSTRAINT IF EXISTS program_settings_pkey;
UPDATE public.program_settings SET key = 'org' WHERE key IS NULL;
ALTER TABLE public.program_settings ALTER COLUMN key SET NOT NULL;
DROP INDEX IF EXISTS public.program_settings_key_idx;
ALTER TABLE public.program_settings ADD PRIMARY KEY (key);