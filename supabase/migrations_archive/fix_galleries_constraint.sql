-- Migration to fix the category check constraint on galleries
ALTER TABLE public.galleries DROP CONSTRAINT IF EXISTS galleries_category_check;
ALTER TABLE public.galleries ADD CONSTRAINT galleries_category_check CHECK (category IN ('memes', 'charts', 'vendor_gallery'));
