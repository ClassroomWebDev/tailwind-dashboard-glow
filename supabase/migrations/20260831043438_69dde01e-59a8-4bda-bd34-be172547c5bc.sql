DROP INDEX IF EXISTS public.program_settings_key_idx;
CREATE UNIQUE INDEX program_settings_key_idx ON public.program_settings (key);