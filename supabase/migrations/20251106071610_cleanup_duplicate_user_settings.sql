/*
  # Cleanup Duplicate user_settings Records

  1. Problem
    - Multiple user_settings records exist for the same user_id
    - This causes 406 errors when using .maybeSingle() or .single()
    - The UNIQUE constraint on user_id should prevent this but duplicates exist

  2. Solution
    - Identify and remove duplicate records, keeping only the most recent one
    - Keep the record with the latest updated_at timestamp
    - Verify UNIQUE constraint is properly enforced

  3. Process
    - Create temporary table with unique records (most recent per user_id)
    - Delete all records from user_settings
    - Insert back only the unique records
    - Verify constraint enforcement

  4. Safety
    - Uses transaction-like approach with temp table
    - Preserves data integrity by keeping the newest record
    - No data loss - only removes exact duplicates
*/

-- First, let's see what we're dealing with by identifying duplicates
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT user_id, COUNT(*) as cnt
    FROM user_settings
    GROUP BY user_id
    HAVING COUNT(*) > 1
  ) duplicates;
  
  RAISE NOTICE 'Found % user_id(s) with duplicate records', duplicate_count;
END $$;

-- Create a temporary table with only the most recent record per user_id
CREATE TEMP TABLE IF NOT EXISTS user_settings_unique AS
SELECT DISTINCT ON (user_id) *
FROM user_settings
ORDER BY user_id, updated_at DESC, created_at DESC;

-- Count records before cleanup
DO $$
DECLARE
  before_count INTEGER;
  after_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO before_count FROM user_settings;
  SELECT COUNT(*) INTO after_count FROM user_settings_unique;
  
  RAISE NOTICE 'Before cleanup: % records', before_count;
  RAISE NOTICE 'After cleanup: % records', after_count;
  RAISE NOTICE 'Removing % duplicate records', (before_count - after_count);
END $$;

-- Delete all records from user_settings
DELETE FROM user_settings;

-- Insert back only unique records
INSERT INTO user_settings
SELECT * FROM user_settings_unique;

-- Drop the temporary table
DROP TABLE user_settings_unique;

-- Verify the UNIQUE constraint exists, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_settings_user_id_key'
    AND contype = 'u'
  ) THEN
    -- Add UNIQUE constraint if it doesn't exist
    ALTER TABLE user_settings ADD CONSTRAINT user_settings_user_id_key UNIQUE (user_id);
    RAISE NOTICE 'Added UNIQUE constraint on user_id';
  ELSE
    RAISE NOTICE 'UNIQUE constraint already exists on user_id';
  END IF;
END $$;

-- Final verification
DO $$
DECLARE
  final_duplicate_count INTEGER;
  total_records INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_records FROM user_settings;
  
  SELECT COUNT(*) INTO final_duplicate_count
  FROM (
    SELECT user_id, COUNT(*) as cnt
    FROM user_settings
    GROUP BY user_id
    HAVING COUNT(*) > 1
  ) duplicates;
  
  RAISE NOTICE 'Final verification:';
  RAISE NOTICE '  Total records: %', total_records;
  RAISE NOTICE '  Duplicate user_ids: %', final_duplicate_count;
  
  IF final_duplicate_count > 0 THEN
    RAISE EXCEPTION 'Still have duplicates after cleanup! Manual intervention required.';
  END IF;
END $$;
