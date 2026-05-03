-- Create Vendor Withdrawals table
CREATE TABLE IF NOT EXISTS public.vendor_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  paypal_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processed', 'rejected'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vendor_withdrawals ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Vendors can view their own withdrawal requests" 
  ON public.vendor_withdrawals FOR SELECT 
  USING (auth.uid() = vendor_id);

CREATE POLICY "Vendors can insert their own withdrawal requests" 
  ON public.vendor_withdrawals FOR INSERT 
  WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "Admins can manage all withdrawal requests" 
  ON public.vendor_withdrawals FOR ALL 
  USING (
    COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin' OR
    COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
  );
