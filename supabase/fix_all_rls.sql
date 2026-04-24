-- COMPREHENSIVE RLS FIX
-- This script ensures admins can access everything using robust JWT checks.
-- It checks both app_metadata and user_metadata to ensure compatibility.

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin' OR
    COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin' OR
    COALESCE(auth.jwt() ->> 'role', '') = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL TO authenticated USING (public.is_admin());

-- 2. VENDOR PROFILES
ALTER TABLE public.vendor_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage all vendor profiles" ON public.vendor_profiles;
DROP POLICY IF EXISTS "Public can view vendor profiles" ON public.vendor_profiles;
DROP POLICY IF EXISTS "Vendors can update own profile" ON public.vendor_profiles;

CREATE POLICY "Public can view vendor profiles" ON public.vendor_profiles FOR SELECT USING (true);
CREATE POLICY "Vendors can update own profile" ON public.vendor_profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins can manage all vendor profiles" ON public.vendor_profiles FOR ALL TO authenticated USING (public.is_admin());

-- 3. PRODUCTS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
CREATE POLICY "Admins can manage all products" ON public.products FOR ALL TO authenticated USING (public.is_admin());

-- 4. ORDERS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;
CREATE POLICY "Admins can manage all orders" ON public.orders FOR ALL TO authenticated USING (public.is_admin());

-- 5. CONTACT MESSAGES
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage all contact_messages" ON public.contact_messages;
CREATE POLICY "Admins can manage all contact_messages" ON public.contact_messages FOR ALL TO authenticated USING (public.is_admin());

-- 6. REVIEWS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage all reviews" ON public.reviews;
CREATE POLICY "Admins can manage all reviews" ON public.reviews FOR ALL TO authenticated USING (public.is_admin());

-- 7. NEWSLETTER
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Admins can manage newsletter" ON public.newsletter_subscribers FOR ALL TO authenticated USING (public.is_admin());
