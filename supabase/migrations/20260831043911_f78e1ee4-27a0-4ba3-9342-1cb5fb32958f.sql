ALTER TABLE public.program_settings ADD COLUMN IF NOT EXISTS brand_title text;

UPDATE public.logo_boards SET title = '' WHERE title IS NULL;
UPDATE public.logo_boards SET logo_url = '' WHERE logo_url IS NULL;
ALTER TABLE public.logo_boards
  ALTER COLUMN title SET NOT NULL,
  ALTER COLUMN title SET DEFAULT '',
  ALTER COLUMN logo_url SET NOT NULL,
  ALTER COLUMN logo_url SET DEFAULT '';

UPDATE public.member_reviews SET author_name = 'Member' WHERE author_name IS NULL;
UPDATE public.member_reviews SET review_text = '' WHERE review_text IS NULL;
UPDATE public.member_reviews SET rating = 5 WHERE rating IS NULL;
ALTER TABLE public.member_reviews
  ALTER COLUMN author_name SET NOT NULL,
  ALTER COLUMN review_text SET NOT NULL,
  ALTER COLUMN rating SET NOT NULL;