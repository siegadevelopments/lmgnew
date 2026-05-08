-- Add status column to articles
ALTER TABLE articles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published';

-- Add status column to recipes
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published';

-- Update existing items to 'published'
UPDATE articles SET status = 'published' WHERE status IS NULL;
UPDATE recipes SET status = 'published' WHERE status IS NULL;
