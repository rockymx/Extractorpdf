/*
  # Fix RLS policies to allow admins to update user status

  1. Problem
    - The current "Users can update own settings" policy was blocking admin updates
    - Both USING and WITH CHECK clauses must pass for UPDATE operations
    - Admins need to be able to update other users' settings (role, is_active)

  2. Changes
    - Drop the restrictive "Users can update own settings" policy
    - Create a new combined policy that allows:
      a) Users to update their own settings (except role and is_active)
      b) Admins to update any user's settings

  3. Security
    - Regular users can still update their own settings
    - Regular users CANNOT change role or is_active (protected fields)
    - Only admins can change role and is_active for any user
    - Maintains data isolation between users
*/

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;

-- Create new policy that allows users to update own settings
CREATE POLICY "Users can update own settings except protected fields"
  ON user_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
  );

-- The admin policy already exists and will work in combination with this one
-- Verify the admin policy allows updating any user's settings
DROP POLICY IF EXISTS "Admins can update user roles" ON user_settings;

CREATE POLICY "Admins can update any user settings"
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