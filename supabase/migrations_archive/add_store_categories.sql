-- Add store_categories to vendor_profiles
ALTER TABLE public.vendor_profiles 
ADD COLUMN IF NOT EXISTS store_categories TEXT[] DEFAULT '{}'::text[];
