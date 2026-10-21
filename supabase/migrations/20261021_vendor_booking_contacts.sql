-- ============================================================
-- Migration: vendor_booking_contacts()
--
-- Vendors' Bookings tab showed "Guest" with no contact details: it joined profiles for
-- email (not a profiles column) and phone (not readable by other users since
-- 20261021_hide_phone_from_signed_in_users.sql). This function returns name, email and phone
-- for the customers of the CALLING vendor's own bookings only (bookings.vendor_id = auth.uid(),
-- the same rule as the "Vendors can view their bookings" policy). Vendors already receive
-- exactly these details in the booking notification email (confirm-booking edge function).
--
-- Email comes from auth.users, which only a SECURITY DEFINER function can read.
-- The app works before and after this runs: without it, the tab shows "Guest" as before.
--
-- Safe to run more than once.
-- ============================================================

CREATE OR REPLACE FUNCTION public.vendor_booking_contacts()
RETURNS TABLE (booking_id text, full_name text, email text, phone text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.id::text, p.full_name, u.email::text, p.phone
  FROM public.bookings b
  LEFT JOIN public.profiles p ON p.id = b.customer_id
  LEFT JOIN auth.users u ON u.id = b.customer_id
  WHERE b.vendor_id = auth.uid();
$$;

-- Supabase grants new public functions to anon by default; signed-in vendors only.
REVOKE ALL ON FUNCTION public.vendor_booking_contacts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.vendor_booking_contacts() TO authenticated;
