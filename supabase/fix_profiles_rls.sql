-- Fix profiles RLS to allow users to read their own data and admins to manage all
-- This avoids the chicken-and-egg problem where a user can't see their own role to become authorized.

-- 1. Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to start fresh
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- 3. Policy: Everyone can view basic profile info (needed for vendor pages etc.)
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  TO public
  USING (true);

-- 4. Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- 5. Policy: Admins can do EVERYTHING (using JWT metadata for performance)
CREATE POLICY "Admins can manage all profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Also fix vendor_profiles RLS
ALTER TABLE public.vendor_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can update vendor_profiles" ON public.vendor_profiles;
DROP POLICY IF EXISTS "Public can view vendor profiles" ON public.vendor_profiles;
DROP POLICY IF EXISTS "Vendors can update own profile" ON public.vendor_profiles;

CREATE POLICY "Public can view vendor profiles"
  ON public.vendor_profiles FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Vendors can update own profile"
  ON public.vendor_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can manage all vendor profiles"
  ON public.vendor_profiles FOR ALL
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );
