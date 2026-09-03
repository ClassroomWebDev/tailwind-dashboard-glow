ALTER TABLE public.program_settings DROP CONSTRAINT IF EXISTS program_settings_id_check;
ALTER TABLE public.program_settings ALTER COLUMN id SET DEFAULT false;