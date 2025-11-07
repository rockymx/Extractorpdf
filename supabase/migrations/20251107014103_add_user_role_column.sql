/*
  # Add user role column to user_settings

  1. Changes
    - Add `role` column to `user_settings` table
      - Type: text with check constraint
      - Default: 'user'
      - Allowed values: 'admin' or 'user'
    - Create an index on role column for faster queries
  
  2. Security
    - RLS policies remain unchanged
    - Only users can view/update their own settings
    - Admin status doesn't grant special database access (handled in app layer)
  
  3. Notes
    - First registered user can be manually set to admin via SQL
    - Role changes should be done through admin interface (future feature)
*/

-- Add role column with default 'user'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'role'
  ) THEN
    ALTER TABLE user_settings 
    ADD COLUMN role text DEFAULT 'user' CHECK (role IN ('admin', 'user'));
  END IF;
END $$;

-- Create index for faster role-based queries
CREATE INDEX IF NOT EXISTS idx_user_settings_role ON user_settings(role);

-- Update existing records to have 'user' role if null
UPDATE user_settings SET role = 'user' WHERE role IS NULL;
