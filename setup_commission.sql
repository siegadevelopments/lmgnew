-- 1. Add commission_rate to vendor_profiles (default 10%)
ALTER TABLE public.vendor_profiles
ADD COLUMN IF NOT EXISTS commission_rate numeric DEFAULT 10;

-- 2. Create vendor_earnings table
CREATE TABLE IF NOT EXISTS public.vendor_earnings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id uuid REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  platform_fee numeric NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  created_at timestamp with time zone DEFAULT now()
);

-- 3. Set up RLS for vendor_earnings
ALTER TABLE public.vendor_earnings ENABLE ROW LEVEL SECURITY;

-- Admins can view and update everything
CREATE POLICY "Admins can do everything on vendor_earnings"
ON public.vendor_earnings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Vendors can view their own earnings
CREATE POLICY "Vendors can view their own earnings"
ON public.vendor_earnings
FOR SELECT
USING (
  vendor_id = auth.uid()
);
