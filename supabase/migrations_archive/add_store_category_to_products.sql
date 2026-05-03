-- Add store_category column to products for vendor-specific organization
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS store_category TEXT;
