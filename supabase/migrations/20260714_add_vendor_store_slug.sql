-- ============================================================
-- Migration: Add store_slug to vendor_profiles
-- Purpose: Enable human-readable, shareable vendor page URLs
-- ============================================================

-- 1. Add the store_slug column
ALTER TABLE public.vendor_profiles
  ADD COLUMN IF NOT EXISTS store_slug TEXT;

-- 2. Populate store_slug from existing store_name values
--    Converts to lowercase, replaces non-alphanumeric with hyphens, trims hyphens
UPDATE public.vendor_profiles
SET store_slug = LOWER(
  TRIM(BOTH '-' FROM
    REGEXP_REPLACE(
      REGEXP_REPLACE(store_name, '[^a-zA-Z0-9\s-]', '', 'g'),
      '[\s-]+', '-', 'g'
    )
  )
)
WHERE store_slug IS NULL AND store_name IS NOT NULL;

-- 3. Handle duplicates by appending a numeric suffix
DO $$
DECLARE
  r RECORD;
  counter INT;
  new_slug TEXT;
BEGIN
  FOR r IN
    SELECT id, store_slug
    FROM public.vendor_profiles
    WHERE store_slug IN (
      SELECT store_slug FROM public.vendor_profiles
      GROUP BY store_slug HAVING COUNT(*) > 1
    )
    ORDER BY created_at ASC
  LOOP
    -- Check if this exact slug already exists for a different row
    IF EXISTS (
      SELECT 1 FROM public.vendor_profiles
      WHERE store_slug = r.store_slug AND id != r.id
    ) THEN
      counter := 2;
      new_slug := r.store_slug || '-' || counter;
      WHILE EXISTS (SELECT 1 FROM public.vendor_profiles WHERE store_slug = new_slug) LOOP
        counter := counter + 1;
        new_slug := r.store_slug || '-' || counter;
      END LOOP;
      UPDATE public.vendor_profiles SET store_slug = new_slug WHERE id = r.id;
    END IF;
  END LOOP;
END $$;

-- 4. Make store_slug NOT NULL and UNIQUE
ALTER TABLE public.vendor_profiles
  ALTER COLUMN store_slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_vendor_profiles_store_slug
  ON public.vendor_profiles (store_slug);

-- 5. Create a function to auto-generate store_slug on INSERT/UPDATE
CREATE OR REPLACE FUNCTION public.generate_vendor_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INT := 2;
BEGIN
  -- Only generate slug if store_name changed or slug is empty
  IF NEW.store_slug IS NULL OR NEW.store_slug = '' OR
     (TG_OP = 'UPDATE' AND OLD.store_name IS DISTINCT FROM NEW.store_name) THEN

    base_slug := LOWER(
      TRIM(BOTH '-' FROM
        REGEXP_REPLACE(
          REGEXP_REPLACE(NEW.store_name, '[^a-zA-Z0-9\s-]', '', 'g'),
          '[\s-]+', '-', 'g'
        )
      )
    );

    final_slug := base_slug;

    -- Ensure uniqueness
    WHILE EXISTS (
      SELECT 1 FROM public.vendor_profiles
      WHERE store_slug = final_slug AND id != NEW.id
    ) LOOP
      final_slug := base_slug || '-' || counter;
      counter := counter + 1;
    END LOOP;

    NEW.store_slug := final_slug;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Attach trigger
DROP TRIGGER IF EXISTS trg_generate_vendor_slug ON public.vendor_profiles;
CREATE TRIGGER trg_generate_vendor_slug
  BEFORE INSERT OR UPDATE ON public.vendor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_vendor_slug();
