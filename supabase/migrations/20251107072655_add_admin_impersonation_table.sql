/*
  # Add Admin Impersonation Tracking

  1. New Tables
    - `admin_impersonation_log`
      - `id` (uuid, primary key)
      - `admin_id` (uuid, references auth.users)
      - `impersonated_user_id` (uuid, references auth.users)
      - `started_at` (timestamptz)
      - `ended_at` (timestamptz, nullable)
      - `is_active` (boolean)

  2. Security
    - Enable RLS on `admin_impersonation_log` table
    - Add policy for admins to read their own impersonation logs
    - Add policy for admins to insert new impersonation records

  3. Notes
    - This table tracks when admins impersonate users
    - Only admins can access this table
    - Active impersonation sessions have is_active = true
*/

CREATE TABLE IF NOT EXISTS admin_impersonation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  impersonated_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at timestamptz DEFAULT now() NOT NULL,
  ended_at timestamptz,
  is_active boolean DEFAULT true NOT NULL
);

ALTER TABLE admin_impersonation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read impersonation logs"
  ON admin_impersonation_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_settings
      WHERE user_settings.user_id = auth.uid()
      AND user_settings.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert impersonation logs"
  ON admin_impersonation_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_settings
      WHERE user_settings.user_id = auth.uid()
      AND user_settings.role = 'admin'
    )
  );

CREATE POLICY "Admins can update impersonation logs"
  ON admin_impersonation_log
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_settings
      WHERE user_settings.user_id = auth.uid()
      AND user_settings.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_settings
      WHERE user_settings.user_id = auth.uid()
      AND user_settings.role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_admin_impersonation_admin_id ON admin_impersonation_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_impersonation_user_id ON admin_impersonation_log(impersonated_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_impersonation_is_active ON admin_impersonation_log(is_active);
