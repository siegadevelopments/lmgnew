-- Allow vendors to read their own bookings (vendor_id = auth.uid())
CREATE POLICY IF NOT EXISTS "Vendors can view their bookings"
  ON bookings FOR SELECT
  USING (vendor_id = auth.uid());

-- Allow vendors to update status of their own bookings (e.g. confirm, complete, cancel)
CREATE POLICY IF NOT EXISTS "Vendors can update their bookings"
  ON bookings FOR UPDATE
  USING (vendor_id = auth.uid())
  WITH CHECK (vendor_id = auth.uid());

-- Allow customers to read their own bookings
CREATE POLICY IF NOT EXISTS "Customers can view their bookings"
  ON bookings FOR SELECT
  USING (customer_id = auth.uid());

-- Allow authenticated users to insert bookings (they become the customer)
CREATE POLICY IF NOT EXISTS "Authenticated users can insert bookings"
  ON bookings FOR INSERT
  WITH CHECK (customer_id = auth.uid());
