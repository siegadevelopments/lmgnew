-- Add brand and tags columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Update RLS policies (optional, usually they cover all columns)
-- If there are specific policies for SELECT/INSERT/UPDATE, they should already work for new columns.
