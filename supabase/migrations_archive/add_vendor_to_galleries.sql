-- Migration to add vendor support to galleries
ALTER TABLE public.galleries ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES public.profiles(id);

-- Update RLS for galleries
ALTER TABLE public.galleries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendors can manage own galleries" ON public.galleries;
CREATE POLICY "Vendors can manage own galleries"
  ON public.galleries FOR ALL
  TO authenticated
  USING (auth.uid() = vendor_id OR public.is_admin());

DROP POLICY IF EXISTS "Public can view all galleries" ON public.galleries;
CREATE POLICY "Public can view all galleries"
  ON public.galleries FOR SELECT
  USING (true);

-- Update RLS for gallery_items
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendors can manage own gallery items" ON public.gallery_items;
CREATE POLICY "Vendors can manage own gallery items"
  ON public.gallery_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.galleries
      WHERE galleries.id = gallery_items.gallery_id
      AND (galleries.vendor_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "Public can view all gallery items" ON public.gallery_items;
CREATE POLICY "Public can view all gallery items"
  ON public.gallery_items FOR SELECT
  USING (true);
-- Fix category constraint to allow vendor galleries
ALTER TABLE public.galleries DROP CONSTRAINT IF EXISTS galleries_category_check;
ALTER TABLE public.galleries ADD CONSTRAINT galleries_category_check CHECK (category IN ('memes', 'charts', 'vendor_gallery'));
