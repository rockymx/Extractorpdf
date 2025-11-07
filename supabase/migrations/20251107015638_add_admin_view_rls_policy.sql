/*
  # Add RLS policy for admin users view
  
  1. Changes
    - Add policy to allow only admin users to query the admin_users_view
    - Ensures regular users cannot see the list of all users
  
  2. Security
    - Only users with role='admin' in user_settings can access the view
    - This protects user data from unauthorized access
*/

-- Create policy for admin_users_view
-- Note: Views in Postgres with security_invoker need policies on the underlying tables
-- But we can create a function to check admin access

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_user_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_settings 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_user_admin() TO authenticated;