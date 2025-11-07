/*
  # Fix RLS policies for extraction_history to support admin impersonation

  1. Changes
    - Update SELECT policy to allow admins to view data of users they are impersonating
    - Update INSERT policy to allow admins to insert data for users they are impersonating
    - Update UPDATE policy to allow admins to update data of users they are impersonating
    - Update DELETE policy to allow admins to delete data of users they are impersonating

  2. Security
    - Policies check the admin_impersonation_log table to verify active impersonation session
    - Only allows access if there's an active impersonation record (ended_at IS NULL)
    - Maintains existing user access to their own data
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own extraction history" ON extraction_history;
DROP POLICY IF EXISTS "Users can insert own extraction history" ON extraction_history;
DROP POLICY IF EXISTS "Users can update own extraction history" ON extraction_history;
DROP POLICY IF EXISTS "Users can delete own extraction history" ON extraction_history;

-- Create new SELECT policy with impersonation support
CREATE POLICY "Users can view own extraction history or admin can view impersonated user"
  ON extraction_history
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM admin_impersonation_log
      WHERE admin_impersonation_log.admin_id = auth.uid()
        AND admin_impersonation_log.impersonated_user_id = extraction_history.user_id
        AND admin_impersonation_log.ended_at IS NULL
    )
  );

-- Create new INSERT policy with impersonation support
CREATE POLICY "Users can insert own extraction history or admin can insert for impersonated user"
  ON extraction_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM admin_impersonation_log
      WHERE admin_impersonation_log.admin_id = auth.uid()
        AND admin_impersonation_log.impersonated_user_id = extraction_history.user_id
        AND admin_impersonation_log.ended_at IS NULL
    )
  );

-- Create new UPDATE policy with impersonation support
CREATE POLICY "Users can update own extraction history or admin can update impersonated user"
  ON extraction_history
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM admin_impersonation_log
      WHERE admin_impersonation_log.admin_id = auth.uid()
        AND admin_impersonation_log.impersonated_user_id = extraction_history.user_id
        AND admin_impersonation_log.ended_at IS NULL
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM admin_impersonation_log
      WHERE admin_impersonation_log.admin_id = auth.uid()
        AND admin_impersonation_log.impersonated_user_id = extraction_history.user_id
        AND admin_impersonation_log.ended_at IS NULL
    )
  );

-- Create new DELETE policy with impersonation support
CREATE POLICY "Users can delete own extraction history or admin can delete impersonated user"
  ON extraction_history
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM admin_impersonation_log
      WHERE admin_impersonation_log.admin_id = auth.uid()
        AND admin_impersonation_log.impersonated_user_id = extraction_history.user_id
        AND admin_impersonation_log.ended_at IS NULL
    )
  );
