/*
  # Create function to get all users for admins
  
  1. Changes
    - Drop the admin_users_view (views don't support RLS well)
    - Create a function that returns all users with their roles
    - Function checks if caller is admin before returning data
  
  2. Security
    - Function uses SECURITY DEFINER to access auth.users
    - Only returns data if the calling user is an admin
    - Returns empty set for non-admin users
*/

-- Drop the view if it exists
DROP VIEW IF EXISTS admin_users_view;

-- Create function to get all users (admin only)
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
  IF NOT EXISTS (
    SELECT 1 FROM user_settings 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
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
    COALESCE(us.role, 'user')::text as role
  FROM auth.users au
  LEFT JOIN user_settings us ON au.id = us.user_id
  ORDER BY au.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_all_users_admin() TO authenticated;