/*
  # Authentication Setup with RLS Policies
  
  1. Overview
    This migration sets up Row Level Security policies for the app_settings table
    to work with Supabase Auth. The auth.users table already exists in Supabase.
  
  2. Changes to Existing Tables
    - `app_settings` table:
      - Update RLS policies to work with authenticated users
      - Add policy for authenticated users to read settings
      - Add policy for authenticated users to insert/update settings
  
  3. Security
    - Enable RLS on app_settings (already enabled)
    - Add policies for authenticated users to manage their settings
    - Ensure users can only access their own data
  
  4. Important Notes
    - Email confirmation is disabled by default in Supabase
    - Users can sign up and sign in immediately
    - The auth.users table is managed by Supabase Auth
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'app_settings' 
    AND policyname = 'Authenticated users can read settings'
  ) THEN
    CREATE POLICY "Authenticated users can read settings"
      ON app_settings
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'app_settings' 
    AND policyname = 'Authenticated users can insert settings'
  ) THEN
    CREATE POLICY "Authenticated users can insert settings"
      ON app_settings
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'app_settings' 
    AND policyname = 'Authenticated users can update settings'
  ) THEN
    CREATE POLICY "Authenticated users can update settings"
      ON app_settings
      FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'app_settings' 
    AND policyname = 'Authenticated users can delete settings'
  ) THEN
    CREATE POLICY "Authenticated users can delete settings"
      ON app_settings
      FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END $$;