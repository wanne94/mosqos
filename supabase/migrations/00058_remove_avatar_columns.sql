-- Migration: Remove avatar/photo columns
-- Purpose: Remove photo_url from members and teachers tables as per avatar removal plan
-- Execute AFTER all code changes are deployed and tested

-- =============================================================================
-- Drop photo_url column from members table
-- =============================================================================

ALTER TABLE members DROP COLUMN IF EXISTS photo_url;

COMMENT ON TABLE members IS 'Member profiles (photo_url removed - using initials only)';

-- =============================================================================
-- Drop photo_url column from teachers table
-- =============================================================================

ALTER TABLE teachers DROP COLUMN IF EXISTS photo_url;

COMMENT ON TABLE teachers IS 'Teacher profiles (photo_url removed - using initials only)';

-- =============================================================================
-- Notes:
-- - This migration is safe to run as the application code no longer references photo_url
-- - Avatar display now uses initials exclusively
-- - No data loss as photo_url was not actively used
-- - Rollback: Add columns back if needed (see rollback section below)
-- =============================================================================

-- ROLLBACK (if needed):
--
-- ALTER TABLE members ADD COLUMN photo_url TEXT;
-- ALTER TABLE teachers ADD COLUMN photo_url TEXT;
--
-- COMMENT ON TABLE members IS 'Member profiles';
-- COMMENT ON TABLE teachers IS 'Teacher profiles';
