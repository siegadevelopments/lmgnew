-- Fix infinite recursion in RLS policies using JWT metadata
-- This approach is much faster and avoids querying the 'profiles' table recursively.

-- 1. VENDOR PROFILES
DROP POLICY IF EXISTS "Admins can update vendor_profiles" ON public.vendor_profiles;
CREATE POLICY "Admins can update vendor_profiles"
  ON public.vendor_profiles FOR ALL
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- 2. PRODUCTS
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
CREATE POLICY "Admins can update products"
  ON public.products FOR ALL
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- 3. ORDERS
DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;
CREATE POLICY "Admins can manage all orders"
  ON public.orders FOR ALL
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- 4. CONTACT MESSAGES
DROP POLICY IF EXISTS "Admins can manage all contact_messages" ON public.contact_messages;
CREATE POLICY "Admins can manage all contact_messages"
  ON public.contact_messages FOR ALL
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- 5. PROFILES (THE CAUSE OF RECURSION)
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- 6. REVIEWS
DROP POLICY IF EXISTS "Admins can manage all reviews" ON public.reviews;
CREATE POLICY "Admins can manage all reviews"
  ON public.reviews FOR ALL
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- 7. NEWSLETTER
DROP POLICY IF EXISTS "Admins can manage newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Admins can manage newsletter"
  ON public.newsletter_subscribers FOR ALL
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );
