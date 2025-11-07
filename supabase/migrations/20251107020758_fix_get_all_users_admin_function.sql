/*
  # Fix get_all_users_admin function
  
  1. Changes
    - Fix column ambiguity error by using table aliases properly
    - Qualify all column references to avoid ambiguity
  
  2. Security
    - Maintains same security model (admin-only access)
*/

-- Drop and recreate the function with proper column references
CREATE OR REPLACE FUNCTION get_all_users_admin()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  role text
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the calling user is an admin
  -- Use qualified column names to avoid ambiguity
  IF NOT EXISTS (
    SELECT 1 FROM user_settings us
    WHERE us.user_id = auth.uid() 
    AND us.role = 'admin'
  ) THEN
    -- Return empty set if not admin
    RETURN;
  END IF;

  -- Return all users with their roles
  RETURN QUERY
  SELECT 
    au.id,
    au.email::text,
    au.created_at,
    au.last_sign_in_at,
    COALESCE(us.role, 'user')::text as user_role
  FROM auth.users au
  LEFT JOIN user_settings us ON au.id = us.user_id
  ORDER BY au.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Ensure permissions are set
GRANT EXECUTE ON FUNCTION get_all_users_admin() TO authenticated;