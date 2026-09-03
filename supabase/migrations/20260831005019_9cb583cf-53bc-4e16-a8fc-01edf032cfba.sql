ALTER TABLE public.program_settings ADD COLUMN IF NOT EXISTS brand_title text NOT NULL DEFAULT 'Ambassador Hub';
ALTER TABLE public.company_wings ADD COLUMN IF NOT EXISTS badge_label text;