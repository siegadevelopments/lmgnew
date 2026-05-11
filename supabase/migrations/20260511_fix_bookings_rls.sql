-- Fix RLS policies for the bookings table so vendors can read and update their bookings

-- Allow vendors to read bookings where they are the service provider
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'Vendors can view their bookings'
  ) THEN
    CREATE POLICY "Vendors can view their bookings"
      ON bookings FOR SELECT
      TO authenticated
      USING (vendor_id = auth.uid());
  END IF;

  -- Allow vendors to update the status of bookings for their services
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'Vendors can update their bookings'
  ) THEN
    CREATE POLICY "Vendors can update their bookings"
      ON bookings FOR UPDATE
      TO authenticated
      USING (vendor_id = auth.uid())
      WITH CHECK (vendor_id = auth.uid());
  END IF;

  -- Allow customers to read their own bookings
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'Customers can view their bookings'
  ) THEN
    CREATE POLICY "Customers can view their bookings"
      ON bookings FOR SELECT
      TO authenticated
      USING (customer_id = auth.uid());
  END IF;

  -- Allow authenticated users to create bookings (they become the customer)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'Authenticated users can insert bookings'
  ) THEN
    CREATE POLICY "Authenticated users can insert bookings"
      ON bookings FOR INSERT
      TO authenticated
      WITH CHECK (customer_id = auth.uid());
  END IF;
END;
$$;
