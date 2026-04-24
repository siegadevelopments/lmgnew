-- Fix get_admin_users RPC to properly return user data including emails
-- This function must be SECURITY DEFINER to bypass RLS on auth.users

DROP FUNCTION IF EXISTS public.get_admin_users();

CREATE OR REPLACE FUNCTION public.get_admin_users()
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    role TEXT,
    email TEXT,
    created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    -- Check if the calling user is an admin
    IF NOT (
        COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin' OR
        COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin' OR
        COALESCE(auth.jwt() ->> 'role', '') = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied. Admin role required.';
    END IF;

    RETURN QUERY
    SELECT 
        p.id,
        p.full_name::TEXT,
        p.role::TEXT,
        u.email::TEXT,
        p.created_at
    FROM 
        public.profiles p
    JOIN 
        auth.users u ON p.id = u.id
    ORDER BY 
        p.created_at DESC;
END;
$$;

-- Grant execution to authenticated users (the function checks for admin role inside)
GRANT EXECUTE ON FUNCTION public.get_admin_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_users() TO service_role;
