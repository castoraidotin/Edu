-- Add the optional company/team identifier used during signup and profile editing.
-- Values are deliberately slug-like: letters and numbers only, with no spaces.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS company_name TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint constraint_record
    JOIN pg_class table_record ON table_record.oid = constraint_record.conrelid
    WHERE constraint_record.conname = 'profiles_company_name_format'
      AND table_record.relname = 'profiles'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_company_name_format CHECK (
        company_name IS NULL OR (
          char_length(company_name) <= 100
          AND company_name ~ '^[A-Za-z0-9]+$'
        )
      );
  END IF;
END $$;
