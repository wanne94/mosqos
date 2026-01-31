-- ============================================================================
-- MOSQOS - MIGRATION 00040: PERMISSION TABLES
-- Description: Core permission tables for multi-tenant authorization
-- Tables: organization_owners, organization_delegates, organization_members,
--         permission_group_members
-- ============================================================================

-- ============================================================================
-- SECTION 1: ORGANIZATION OWNERS TABLE
-- Description: Highest level access to an organization (founders/owners)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.organization_owners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Ensure unique user per organization
    CONSTRAINT uq_organization_owners_org_user UNIQUE (organization_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_organization_owners_org_id ON public.organization_owners(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_owners_user_id ON public.organization_owners(user_id);

-- Comments
COMMENT ON TABLE public.organization_owners IS 'Organization owners with full administrative access';
COMMENT ON COLUMN public.organization_owners.user_id IS 'Reference to auth.users - the owner user';

-- ============================================================================
-- SECTION 2: ORGANIZATION DELEGATES TABLE
-- Description: Co-admins with configurable permissions
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.organization_delegates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Delegate-specific permissions (subset of owner permissions)
    permissions JSONB DEFAULT '[]'::JSONB,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Ensure unique user per organization
    CONSTRAINT uq_organization_delegates_org_user UNIQUE (organization_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_organization_delegates_org_id ON public.organization_delegates(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_delegates_user_id ON public.organization_delegates(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_delegates_active ON public.organization_delegates(organization_id, is_active) WHERE is_active = TRUE;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_updated_at_organization_delegates ON public.organization_delegates;
CREATE TRIGGER set_updated_at_organization_delegates
    BEFORE UPDATE ON public.organization_delegates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Comments
COMMENT ON TABLE public.organization_delegates IS 'Organization co-admins with delegated permissions';
COMMENT ON COLUMN public.organization_delegates.permissions IS 'JSON array of permission slugs granted to this delegate';

-- ============================================================================
-- SECTION 3: ORGANIZATION MEMBERS TABLE
-- Description: Regular users linked to organizations (with optional member profile)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Link to member profile (optional - allows user to have multiple member profiles)
    member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,

    -- Role within organization
    role VARCHAR(50) DEFAULT 'member' CHECK (
        role IN ('member', 'volunteer', 'staff', 'board_member', 'imam', 'teacher', 'admin')
    ),

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Timestamps
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ensure unique user per organization
    CONSTRAINT uq_organization_members_org_user UNIQUE (organization_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_member_id ON public.organization_members(member_id) WHERE member_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_organization_members_role ON public.organization_members(organization_id, role);
CREATE INDEX IF NOT EXISTS idx_organization_members_active ON public.organization_members(organization_id, is_active) WHERE is_active = TRUE;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_updated_at_organization_members ON public.organization_members;
CREATE TRIGGER set_updated_at_organization_members
    BEFORE UPDATE ON public.organization_members
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Comments
COMMENT ON TABLE public.organization_members IS 'Links auth users to organizations with role-based access';
COMMENT ON COLUMN public.organization_members.member_id IS 'Optional link to detailed member profile';
COMMENT ON COLUMN public.organization_members.role IS 'Role within organization: member, volunteer, staff, board_member, imam, teacher, admin';

-- ============================================================================
-- SECTION 4: PERMISSION GROUP MEMBERS TABLE
-- Description: Links members to permission groups (Active Directory-style)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.permission_group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Note: permission_group_id references permission_groups table
    -- which should be created in a separate migration if not exists
    permission_group_id UUID NOT NULL,

    -- Member being assigned to the group
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,

    -- Assignment tracking
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Ensure unique member per group
    CONSTRAINT uq_permission_group_members_group_member UNIQUE (permission_group_id, member_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_permission_group_members_group_id ON public.permission_group_members(permission_group_id);
CREATE INDEX IF NOT EXISTS idx_permission_group_members_member_id ON public.permission_group_members(member_id);

-- Comments
COMMENT ON TABLE public.permission_group_members IS 'Maps members to permission groups for granular access control';
COMMENT ON COLUMN public.permission_group_members.permission_group_id IS 'References permission_groups table';

-- ============================================================================
-- SECTION 5: ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE public.organization_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_delegates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_group_members ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies for organization_owners
-- ============================================================================

-- Platform admins can view all
CREATE POLICY "organization_owners_select_platform_admin" ON public.organization_owners
    FOR SELECT
    TO authenticated
    USING (public.is_platform_admin());

-- Organization owners can view their own records
CREATE POLICY "organization_owners_select_self" ON public.organization_owners
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Organization owners can view other owners in their org
CREATE POLICY "organization_owners_select_org" ON public.organization_owners
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_owners oo
            WHERE oo.organization_id = organization_owners.organization_id
            AND oo.user_id = auth.uid()
        )
    );

-- Platform admins can insert
CREATE POLICY "organization_owners_insert_platform_admin" ON public.organization_owners
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_platform_admin());

-- Organization creators can add themselves as owners
CREATE POLICY "organization_owners_insert_creator" ON public.organization_owners
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.organizations o
            WHERE o.id = organization_id
            AND o.created_by = auth.uid()
        )
    );

-- Platform admins can delete
CREATE POLICY "organization_owners_delete_platform_admin" ON public.organization_owners
    FOR DELETE
    TO authenticated
    USING (public.is_platform_admin());

-- ============================================================================
-- RLS Policies for organization_delegates
-- ============================================================================

-- Platform admins can view all
CREATE POLICY "organization_delegates_select_platform_admin" ON public.organization_delegates
    FOR SELECT
    TO authenticated
    USING (public.is_platform_admin());

-- Delegates can view their own records
CREATE POLICY "organization_delegates_select_self" ON public.organization_delegates
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Organization owners/delegates can view delegates in their org
CREATE POLICY "organization_delegates_select_org" ON public.organization_delegates
    FOR SELECT
    TO authenticated
    USING (public.user_belongs_to_organization(organization_id));

-- Organization owners can manage delegates
CREATE POLICY "organization_delegates_insert_owner" ON public.organization_delegates
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.organization_owners oo
            WHERE oo.organization_id = organization_delegates.organization_id
            AND oo.user_id = auth.uid()
        )
        OR public.is_platform_admin()
    );

CREATE POLICY "organization_delegates_update_owner" ON public.organization_delegates
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_owners oo
            WHERE oo.organization_id = organization_delegates.organization_id
            AND oo.user_id = auth.uid()
        )
        OR public.is_platform_admin()
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.organization_owners oo
            WHERE oo.organization_id = organization_delegates.organization_id
            AND oo.user_id = auth.uid()
        )
        OR public.is_platform_admin()
    );

CREATE POLICY "organization_delegates_delete_owner" ON public.organization_delegates
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_owners oo
            WHERE oo.organization_id = organization_delegates.organization_id
            AND oo.user_id = auth.uid()
        )
        OR public.is_platform_admin()
    );

-- ============================================================================
-- RLS Policies for organization_members
-- ============================================================================

-- Platform admins can view all
CREATE POLICY "organization_members_select_platform_admin" ON public.organization_members
    FOR SELECT
    TO authenticated
    USING (public.is_platform_admin());

-- Members can view their own records
CREATE POLICY "organization_members_select_self" ON public.organization_members
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Organization admins can view members in their org
CREATE POLICY "organization_members_select_org" ON public.organization_members
    FOR SELECT
    TO authenticated
    USING (public.user_belongs_to_organization(organization_id));

-- Organization owners/delegates can manage members
CREATE POLICY "organization_members_insert_admin" ON public.organization_members
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.organization_owners oo
            WHERE oo.organization_id = organization_members.organization_id
            AND oo.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.organization_delegates od
            WHERE od.organization_id = organization_members.organization_id
            AND od.user_id = auth.uid()
            AND od.is_active = TRUE
        )
        OR public.is_platform_admin()
    );

CREATE POLICY "organization_members_update_admin" ON public.organization_members
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_owners oo
            WHERE oo.organization_id = organization_members.organization_id
            AND oo.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.organization_delegates od
            WHERE od.organization_id = organization_members.organization_id
            AND od.user_id = auth.uid()
            AND od.is_active = TRUE
        )
        OR public.is_platform_admin()
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.organization_owners oo
            WHERE oo.organization_id = organization_members.organization_id
            AND oo.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.organization_delegates od
            WHERE od.organization_id = organization_members.organization_id
            AND od.user_id = auth.uid()
            AND od.is_active = TRUE
        )
        OR public.is_platform_admin()
    );

CREATE POLICY "organization_members_delete_admin" ON public.organization_members
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_owners oo
            WHERE oo.organization_id = organization_members.organization_id
            AND oo.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.organization_delegates od
            WHERE od.organization_id = organization_members.organization_id
            AND od.user_id = auth.uid()
            AND od.is_active = TRUE
        )
        OR public.is_platform_admin()
    );

-- ============================================================================
-- RLS Policies for permission_group_members
-- ============================================================================

-- Platform admins can view all
CREATE POLICY "permission_group_members_select_platform_admin" ON public.permission_group_members
    FOR SELECT
    TO authenticated
    USING (public.is_platform_admin());

-- Organization admins can view permission group members
CREATE POLICY "permission_group_members_select_org" ON public.permission_group_members
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.members m
            WHERE m.id = permission_group_members.member_id
            AND public.user_belongs_to_organization(m.organization_id)
        )
    );

-- Organization owners/delegates can manage permission group members
CREATE POLICY "permission_group_members_insert_admin" ON public.permission_group_members
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.members m
            JOIN public.organization_owners oo ON oo.organization_id = m.organization_id
            WHERE m.id = permission_group_members.member_id
            AND oo.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.members m
            JOIN public.organization_delegates od ON od.organization_id = m.organization_id
            WHERE m.id = permission_group_members.member_id
            AND od.user_id = auth.uid()
            AND od.is_active = TRUE
        )
        OR public.is_platform_admin()
    );

CREATE POLICY "permission_group_members_delete_admin" ON public.permission_group_members
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.members m
            JOIN public.organization_owners oo ON oo.organization_id = m.organization_id
            WHERE m.id = permission_group_members.member_id
            AND oo.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.members m
            JOIN public.organization_delegates od ON od.organization_id = m.organization_id
            WHERE m.id = permission_group_members.member_id
            AND od.user_id = auth.uid()
            AND od.is_active = TRUE
        )
        OR public.is_platform_admin()
    );

-- ============================================================================
-- SECTION 6: GRANTS
-- ============================================================================

-- Service role full access
GRANT ALL ON public.organization_owners TO service_role;
GRANT ALL ON public.organization_delegates TO service_role;
GRANT ALL ON public.organization_members TO service_role;
GRANT ALL ON public.permission_group_members TO service_role;

-- Authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_owners TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_delegates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.permission_group_members TO authenticated;

-- ============================================================================
-- SECTION 7: AUDIT TRIGGERS
-- ============================================================================

-- Apply audit trigger to organization_owners
DROP TRIGGER IF EXISTS audit_trigger_organization_owners ON public.organization_owners;
CREATE TRIGGER audit_trigger_organization_owners
    AFTER INSERT OR UPDATE OR DELETE ON public.organization_owners
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_trigger_func();

-- Apply audit trigger to organization_delegates
DROP TRIGGER IF EXISTS audit_trigger_organization_delegates ON public.organization_delegates;
CREATE TRIGGER audit_trigger_organization_delegates
    AFTER INSERT OR UPDATE OR DELETE ON public.organization_delegates
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_trigger_func();

-- Apply audit trigger to organization_members
DROP TRIGGER IF EXISTS audit_trigger_organization_members ON public.organization_members;
CREATE TRIGGER audit_trigger_organization_members
    AFTER INSERT OR UPDATE OR DELETE ON public.organization_members
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_trigger_func();

-- Apply audit trigger to permission_group_members
DROP TRIGGER IF EXISTS audit_trigger_permission_group_members ON public.permission_group_members;
CREATE TRIGGER audit_trigger_permission_group_members
    AFTER INSERT OR UPDATE OR DELETE ON public.permission_group_members
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_trigger_func();

-- ============================================================================
-- END OF MIGRATION 00040
-- ============================================================================
