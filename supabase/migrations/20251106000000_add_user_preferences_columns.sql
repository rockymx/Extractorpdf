/*
  # Add User Preferences Columns to user_settings

  1. Changes to user_settings table
    - Add `column_preferences` (JSONB) - stores visible column settings
    - Add `privacy_settings` (JSONB) - stores privacy preferences (NSS hiding, etc.)
    - Add `theme_preference` (TEXT) - stores theme preference (dark/light) for future use

  2. Default Values
    - column_preferences: NULL (will use app defaults)
    - privacy_settings: NULL (will use app defaults)
    - theme_preference: 'dark' (default theme)

  3. Notes
    - JSONB format allows flexible storage of preferences
    - Existing rows will get default values
    - Changes are backward compatible
    - Ready for future theme toggle feature
*/

-- Add new columns to user_settings table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'column_preferences'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN column_preferences JSONB DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'privacy_settings'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN privacy_settings JSONB DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'theme_preference'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN theme_preference TEXT DEFAULT 'dark';
  END IF;
END $$;

-- Add index for faster queries on theme preference if needed in the future
CREATE INDEX IF NOT EXISTS idx_user_settings_theme ON user_settings(theme_preference);
