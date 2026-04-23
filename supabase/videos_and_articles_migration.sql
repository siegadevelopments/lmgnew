-- 1. Create Videos Table
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  embed_url TEXT NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add category support to articles
ALTER TABLE articles ADD COLUMN category_name TEXT DEFAULT 'Articles';

-- 3. Relax RLS polices for new table
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view videos" ON videos FOR SELECT USING (true);
