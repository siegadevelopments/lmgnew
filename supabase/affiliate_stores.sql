-- Create affiliate_stores table
CREATE TABLE IF NOT EXISTS public.affiliate_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  affiliate_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.affiliate_stores ENABLE ROW LEVEL SECURITY;

-- Public can read active affiliates
CREATE POLICY "Public can view active affiliates"
  ON public.affiliate_stores FOR SELECT
  USING (is_active = true);

-- Admins can manage all
CREATE POLICY "Admins can manage affiliates"
  ON public.affiliate_stores FOR ALL
  TO authenticated
  USING (public.is_admin());

-- Seed Youngevity as the first affiliate
INSERT INTO public.affiliate_stores (name, description, logo_url, affiliate_url, is_active, sort_order)
VALUES (
  'Youngevity',
  'Get 20% off on your Youngevity orders when registered. Shop premium health & nutrition products including the renowned Healthy Body Pak™ range.',
  'https://etraininggroup.youngevity.com/static/version1777095922/frontend/GC/Youngevity_AU/en_AU/images/logo.svg',
  'https://etraininggroup.youngevity.com/au_en/',
  true,
  1
);
