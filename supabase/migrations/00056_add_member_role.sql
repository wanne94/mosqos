-- ============================================================================
-- MOSQOS - MIGRATION 00056: ADD MEMBER ROLE COLUMN
-- Description: Add role column to members table for imam identification
-- ============================================================================

-- Create enum type for member roles
CREATE TYPE public.member_role AS ENUM ('member', 'imam', 'volunteer', 'teacher');

COMMENT ON TYPE public.member_role IS 'Role types for members: member (regular), imam (religious leader), volunteer, teacher';

-- Add role column to members table
ALTER TABLE public.members
ADD COLUMN role public.member_role NOT NULL DEFAULT 'member';

COMMENT ON COLUMN public.members.role IS 'Member role: member, imam, volunteer, or teacher';

-- Add index for role filtering
CREATE INDEX idx_members_role ON public.members(organization_id, role);

-- Add is_active column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'members'
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE public.members
        ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

        COMMENT ON COLUMN public.members.is_active IS 'Whether the member account is active';

        CREATE INDEX idx_members_is_active ON public.members(organization_id, is_active);
    END IF;
END $$;

-- ============================================================================
-- END OF MIGRATION 00056
-- ============================================================================
