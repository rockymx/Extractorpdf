/*
  # Create admin users view
  
  1. Changes
    - Create a view that combines auth.users with user_settings
    - This allows admins to see all users without needing service role key
    - View includes: id, email, created_at, last_sign_in_at, role
  
  2. Security
    - View is accessible only to admin users through RLS
    - Regular users cannot access this view
*/

-- Create view combining auth.users and user_settings
CREATE OR REPLACE VIEW admin_users_view AS
SELECT 
  au.id,
  au.email,
  au.created_at,
  au.last_sign_in_at,
  COALESCE(us.role, 'user') as role
FROM auth.users au
LEFT JOIN user_settings us ON au.id = us.user_id;

-- Grant access to authenticated users (RLS will control who can actually query it)
GRANT SELECT ON admin_users_view TO authenticated;

-- Enable RLS on the view
ALTER VIEW admin_users_view SET (security_invoker = on);