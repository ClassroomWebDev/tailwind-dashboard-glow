-- 1. Status vocabulary
ALTER TYPE public.account_status ADD VALUE IF NOT EXISTS 'inactive';
ALTER TYPE public.account_status ADD VALUE IF NOT EXISTS 'trashed';

-- 2. Global assignment point bounds
ALTER TABLE public.program_settings
  ADD COLUMN IF NOT EXISTS assignment_min_points integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS assignment_max_points integer NOT NULL DEFAULT 100;

-- 3. Manual ordering for success stories
ALTER TABLE public.success_stories
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;