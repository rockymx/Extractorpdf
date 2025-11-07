/*
  # Add SELECT policy for admins on user_settings table

  1. Problem
    - Admins can UPDATE user settings but cannot SELECT them after the update
    - The .update().select() pattern fails because of missing SELECT permission
    - This causes the admin dashboard to show empty results after updates

  2. Changes
    - Add SELECT policy that allows admins to view any user's settings
    - This enables admins to:
      a) View all user settings in the dashboard
      b) Confirm updates with .select() after .update()

  3. Security
    - Only users with role='admin' can view other users' settings
    - Regular users can still only view their own settings
    - Maintains data privacy for non-admin users
*/

-- Add policy for admins to select any user's settings
CREATE POLICY "Admins can view any user settings"
  ON user_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_settings
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );