-- Add variants and images support to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}'::text[];

ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS variant_id BIGINT;

-- Update RLS to ensure these columns are visible
-- (Existing policies usually cover all columns unless restricted)
