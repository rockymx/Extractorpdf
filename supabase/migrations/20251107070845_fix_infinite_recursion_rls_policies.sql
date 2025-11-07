/*
  # Fix Infinite Recursion in RLS Policies

  1. Problem
    - RLS policies on user_settings are querying user_settings to check admin role
    - This creates infinite recursion: policy → query user_settings → policy → ...
    - Error: "infinite recursion detected in policy for relation user_settings"

  2. Solution
    - Create a security definer function that bypasses RLS to check admin role
    - Update all policies to use this function instead of querying user_settings directly
    - This breaks the recursion loop

  3. Changes
    - Create function: is_admin(user_id) that checks role without RLS
    - Drop and recreate problematic policies to use the new function
    - Affected policies:
      a) "Admins can view any user settings"
      b) "Admins can update any user settings"

  4. Security
    - Function uses SECURITY DEFINER to bypass RLS (safe for read-only check)
    - Only returns boolean, no data exposure
    - Maintains all existing security constraints
*/

-- Create a function that checks if a user is admin WITHOUT triggering RLS
CREATE OR REPLACE FUNCTION is_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM user_settings
  WHERE user_id = check_user_id
  LIMIT 1;
  
  RETURN COALESCE(user_role = 'admin', false);
END;
$$;

-- Drop the problematic policies
DROP POLICY IF EXISTS "Admins can view any user settings" ON user_settings;
DROP POLICY IF EXISTS "Admins can update any user settings" ON user_settings;

-- Recreate the SELECT policy for admins using the safe function
CREATE POLICY "Admins can view any user settings"
  ON user_settings
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Recreate the UPDATE policy for admins using the safe function
CREATE POLICY "Admins can update any user settings"
  ON user_settings
  FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));
