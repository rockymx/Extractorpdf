/*
  # Add user active status field

  1. Changes
    - Add `is_active` column to `user_settings` table
      - Type: boolean
      - Default: true (all users are active by default)
      - Not null constraint
    - Create an index on is_active column for faster queries
    - Update all existing users to active status
  
  2. Security
    - RLS policies remain unchanged
    - Only admins can modify user active status (enforced at application layer)
  
  3. Notes
    - This field controls whether a user can use AI scanning features
    - Inactive users will see a message to contact administrator
    - Admins can toggle user status from the admin dashboard
*/

-- Add is_active column with default true
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE user_settings 
    ADD COLUMN is_active boolean DEFAULT true NOT NULL;
  END IF;
END $$;

-- Create index for faster status-based queries
CREATE INDEX IF NOT EXISTS idx_user_settings_is_active ON user_settings(is_active);

-- Ensure all existing users are set to active
UPDATE user_settings SET is_active = true WHERE is_active IS NULL;
