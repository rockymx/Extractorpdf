/*
  # Allow admins to update user roles
  
  1. Changes
    - Add policy to allow admin users to update roles in user_settings table
    - Allows admins to promote/demote users through the admin dashboard
  
  2. Security
    - Only users with role='admin' can update other users' roles
    - Regular users can still only update their own settings (not role)
*/

-- Add policy for admins to update user roles
CREATE POLICY "Admins can update user roles"
  ON user_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_settings
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_settings
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );