-- ============================================================================
-- MOSQOS - MIGRATION 00010: MEMBERS AND HOUSEHOLDS
-- Description: Core member management and household grouping tables
-- ============================================================================

-- ============================================================================
-- SECTION 1: MEMBERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Link to auth user (optional - members can exist without accounts)
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Personal information
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    date_of_birth DATE,
    date_of_birth_hijri VARCHAR(20),
    gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other')),

    -- Address
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    country VARCHAR(100),

    -- Membership details
    membership_type VARCHAR(50) DEFAULT 'individual' CHECK (
        membership_type IN ('individual', 'family', 'student', 'senior', 'lifetime', 'honorary')
    ),
    membership_status VARCHAR(50) DEFAULT 'active' CHECK (
        membership_status IN ('active', 'inactive', 'pending', 'suspended', 'deceased')
    ),
    joined_date DATE DEFAULT CURRENT_DATE,

    -- Profile
    photo_url TEXT,
    notes TEXT,
    custom_fields JSONB DEFAULT '{}'::JSONB,

    -- Self-registration tracking
    self_registered BOOLEAN DEFAULT FALSE,

    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes for members
CREATE INDEX IF NOT EXISTS idx_members_organization_id ON public.members(organization_id);
CREATE INDEX IF NOT EXISTS idx_members_user_id ON public.members(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_members_email ON public.members(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_members_phone ON public.members(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_members_membership_status ON public.members(organization_id, membership_status);
CREATE INDEX IF NOT EXISTS idx_members_membership_type ON public.members(organization_id, membership_type);
CREATE INDEX IF NOT EXISTS idx_members_joined_date ON public.members(organization_id, joined_date DESC);
CREATE INDEX IF NOT EXISTS idx_members_name ON public.members(organization_id, last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_members_city ON public.members(organization_id, city) WHERE city IS NOT NULL;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_updated_at_members ON public.members;
CREATE TRIGGER set_updated_at_members
    BEFORE UPDATE ON public.members
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- Trigger for created_by
DROP TRIGGER IF EXISTS set_created_by_members ON public.members;
CREATE TRIGGER set_created_by_members
    BEFORE INSERT ON public.members
    FOR EACH ROW
    EXECUTE FUNCTION public.set_created_by();

-- Trigger for updated_by
DROP TRIGGER IF EXISTS set_updated_by_members ON public.members;
CREATE TRIGGER set_updated_by_members
    BEFORE UPDATE ON public.members
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_by();

-- Comments
COMMENT ON TABLE public.members IS 'Member profiles for mosque community members';
COMMENT ON COLUMN public.members.user_id IS 'Optional link to auth.users for members with accounts';
COMMENT ON COLUMN public.members.membership_type IS 'Type of membership: individual, family, student, senior, lifetime, honorary';
COMMENT ON COLUMN public.members.membership_status IS 'Current status: active, inactive, pending, suspended, deceased';
COMMENT ON COLUMN public.members.date_of_birth_hijri IS 'Date of birth in Hijri calendar format';
COMMENT ON COLUMN public.members.custom_fields IS 'Organization-specific custom fields as JSON';
COMMENT ON COLUMN public.members.self_registered IS 'Whether member self-registered through portal';

-- ============================================================================
-- SECTION 2: HOUSEHOLDS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.households (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Household info
    name VARCHAR(255) NOT NULL,

    -- Address (can be shared by family members)
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    country VARCHAR(100),

    -- Contact
    phone VARCHAR(50),
    email VARCHAR(255),

    -- Notes
    notes TEXT,

    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes for households
CREATE INDEX IF NOT EXISTS idx_households_organization_id ON public.households(organization_id);
CREATE INDEX IF NOT EXISTS idx_households_name ON public.households(organization_id, name);
CREATE INDEX IF NOT EXISTS idx_households_city ON public.households(organization_id, city) WHERE city IS NOT NULL;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_updated_at_households ON public.households;
CREATE TRIGGER set_updated_at_households
    BEFORE UPDATE ON public.households
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- Trigger for created_by
DROP TRIGGER IF EXISTS set_created_by_households ON public.households;
CREATE TRIGGER set_created_by_households
    BEFORE INSERT ON public.households
    FOR EACH ROW
    EXECUTE FUNCTION public.set_created_by();

-- Trigger for updated_by
DROP TRIGGER IF EXISTS set_updated_by_households ON public.households;
CREATE TRIGGER set_updated_by_households
    BEFORE UPDATE ON public.households
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_by();

-- Comments
COMMENT ON TABLE public.households IS 'Family/household groupings for members';
COMMENT ON COLUMN public.households.name IS 'Household name (typically family surname)';

-- ============================================================================
-- SECTION 3: ADD HOUSEHOLD REFERENCE TO MEMBERS
-- ============================================================================

-- Add household_id to members if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'members'
        AND column_name = 'household_id'
    ) THEN
        ALTER TABLE public.members
        ADD COLUMN household_id UUID REFERENCES public.households(id) ON DELETE SET NULL;

        CREATE INDEX idx_members_household_id ON public.members(household_id) WHERE household_id IS NOT NULL;
    END IF;
END $$;

-- ============================================================================
-- SECTION 4: HEAD OF HOUSEHOLD
-- ============================================================================

-- Add head_of_household_id to households
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'households'
        AND column_name = 'head_of_household_id'
    ) THEN
        ALTER TABLE public.households
        ADD COLUMN head_of_household_id UUID REFERENCES public.members(id) ON DELETE SET NULL;

        CREATE INDEX idx_households_head ON public.households(head_of_household_id) WHERE head_of_household_id IS NOT NULL;
    END IF;
END $$;

COMMENT ON COLUMN public.households.head_of_household_id IS 'Reference to the member who is head of household';

-- ============================================================================
-- SECTION 5: ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies for members
-- ============================================================================

-- Helper function to check organization membership
CREATE OR REPLACE FUNCTION public.user_belongs_to_organization(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Platform admins have access to all organizations
    IF public.is_platform_admin() THEN
        RETURN TRUE;
    END IF;

    -- Check if user is in organization_owners, organization_delegates, or organization_members
    RETURN EXISTS (
        SELECT 1 FROM public.organization_owners WHERE user_id = auth.uid() AND organization_id = org_id
        UNION
        SELECT 1 FROM public.organization_delegates WHERE user_id = auth.uid() AND organization_id = org_id
        UNION
        SELECT 1 FROM public.organization_members WHERE user_id = auth.uid() AND organization_id = org_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.user_belongs_to_organization(UUID) IS 'Checks if current user belongs to the specified organization';

-- SELECT policy for members
CREATE POLICY "members_select_org" ON public.members
    FOR SELECT
    TO authenticated
    USING (public.user_belongs_to_organization(organization_id));

-- INSERT policy for members
CREATE POLICY "members_insert_org" ON public.members
    FOR INSERT
    TO authenticated
    WITH CHECK (public.user_belongs_to_organization(organization_id));

-- UPDATE policy for members
CREATE POLICY "members_update_org" ON public.members
    FOR UPDATE
    TO authenticated
    USING (public.user_belongs_to_organization(organization_id))
    WITH CHECK (public.user_belongs_to_organization(organization_id));

-- DELETE policy for members
CREATE POLICY "members_delete_org" ON public.members
    FOR DELETE
    TO authenticated
    USING (public.user_belongs_to_organization(organization_id));

-- Platform admin full access to members
CREATE POLICY "members_platform_admin" ON public.members
    FOR ALL
    TO authenticated
    USING (public.is_platform_admin())
    WITH CHECK (public.is_platform_admin());

-- ============================================================================
-- RLS Policies for households
-- ============================================================================

-- SELECT policy for households
CREATE POLICY "households_select_org" ON public.households
    FOR SELECT
    TO authenticated
    USING (public.user_belongs_to_organization(organization_id));

-- INSERT policy for households
CREATE POLICY "households_insert_org" ON public.households
    FOR INSERT
    TO authenticated
    WITH CHECK (public.user_belongs_to_organization(organization_id));

-- UPDATE policy for households
CREATE POLICY "households_update_org" ON public.households
    FOR UPDATE
    TO authenticated
    USING (public.user_belongs_to_organization(organization_id))
    WITH CHECK (public.user_belongs_to_organization(organization_id));

-- DELETE policy for households
CREATE POLICY "households_delete_org" ON public.households
    FOR DELETE
    TO authenticated
    USING (public.user_belongs_to_organization(organization_id));

-- Platform admin full access to households
CREATE POLICY "households_platform_admin" ON public.households
    FOR ALL
    TO authenticated
    USING (public.is_platform_admin())
    WITH CHECK (public.is_platform_admin());

-- ============================================================================
-- SECTION 6: GRANTS
-- ============================================================================

-- Service role full access
GRANT ALL ON public.members TO service_role;
GRANT ALL ON public.households TO service_role;

-- Authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.households TO authenticated;

-- ============================================================================
-- SECTION 7: AUDIT TRIGGERS
-- ============================================================================

-- Apply audit trigger to members
DROP TRIGGER IF EXISTS audit_trigger_members ON public.members;
CREATE TRIGGER audit_trigger_members
    AFTER INSERT OR UPDATE OR DELETE ON public.members
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_trigger_func();

-- Apply audit trigger to households
DROP TRIGGER IF EXISTS audit_trigger_households ON public.households;
CREATE TRIGGER audit_trigger_households
    AFTER INSERT OR UPDATE OR DELETE ON public.households
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_trigger_func();

-- ============================================================================
-- END OF MIGRATION 00010
-- ============================================================================
