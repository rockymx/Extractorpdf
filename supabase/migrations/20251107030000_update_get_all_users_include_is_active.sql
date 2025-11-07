/*
  # Update get_all_users_admin function to include is_active field

  1. Changes
    - Update the RETURNS TABLE to include is_active boolean field
    - Add is_active to the SELECT query from user_settings
    - Default is_active to true if user_settings record doesn't exist

  2. Security
    - Maintains existing security model (admin-only access via SECURITY DEFINER)
    - Same authentication check as before

  3. Notes
    - This fixes the issue where admin dashboard doesn't show correct user status
    - The is_active field was added in a previous migration but not included in this function
    - Changes will be reflected immediately in the admin dashboard after deployment
*/

-- Drop and recreate the function with is_active field
CREATE OR REPLACE FUNCTION get_all_users_admin()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  role text,
  is_active boolean
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the calling user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM user_settings us
    WHERE us.user_id = auth.uid()
    AND us.role = 'admin'
  ) THEN
    -- Return empty set if not admin
    RETURN;
  END IF;

  -- Return all users with their roles and active status
  RETURN QUERY
  SELECT
    au.id,
    au.email::text,
    au.created_at,
    au.last_sign_in_at,
    COALESCE(us.role, 'user')::text as user_role,
    COALESCE(us.is_active, true) as user_is_active
  FROM auth.users au
  LEFT JOIN user_settings us ON au.id = us.user_id
  ORDER BY au.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Ensure permissions are set
GRANT EXECUTE ON FUNCTION get_all_users_admin() TO authenticated;
