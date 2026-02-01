-- ============================================================================
-- MOSQOS - MIGRATION 00054: PERMISSION SYSTEM TABLES
-- Description: Core permission tables for AD-style authorization system
-- Tables: permissions, permission_groups, permission_group_permissions
-- ============================================================================

-- ============================================================================
-- SECTION 1: PERMISSIONS TABLE
-- Description: Global list of all available permissions in the system
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Permission identification
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Categorization
    module VARCHAR(50) NOT NULL CHECK (
        module IN (
            'members', 'households', 'donations', 'funds', 'pledges',
            'education', 'cases', 'umrah', 'qurbani', 'services',
            'announcements', 'reports', 'settings', 'permissions', 'expenses'
        )
    ),

    -- Display order within module
    sort_order INTEGER DEFAULT 0,

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_permissions_module ON public.permissions(module);
CREATE INDEX IF NOT EXISTS idx_permissions_code ON public.permissions(code);

-- Comments
COMMENT ON TABLE public.permissions IS 'Master list of all available permissions in the system';
COMMENT ON COLUMN public.permissions.code IS 'Unique permission code (e.g., members:view, donations:create)';
COMMENT ON COLUMN public.permissions.module IS 'Module this permission belongs to';

-- ============================================================================
-- SECTION 2: PERMISSION GROUPS TABLE
-- Description: Permission groups per organization (AD-style groups)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.permission_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Group info
    name VARCHAR(100) NOT NULL,
    description TEXT,

    -- System groups cannot be deleted (e.g., "Administrators", "Finance Team")
    is_system BOOLEAN DEFAULT FALSE,

    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Unique name per organization
    CONSTRAINT uq_permission_groups_org_name UNIQUE (organization_id, name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_permission_groups_organization_id ON public.permission_groups(organization_id);
CREATE INDEX IF NOT EXISTS idx_permission_groups_is_system ON public.permission_groups(organization_id, is_system);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_updated_at_permission_groups ON public.permission_groups;
CREATE TRIGGER set_updated_at_permission_groups
    BEFORE UPDATE ON public.permission_groups
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Comments
COMMENT ON TABLE public.permission_groups IS 'Permission groups per organization (AD-style)';
COMMENT ON COLUMN public.permission_groups.is_system IS 'System groups cannot be deleted';

-- ============================================================================
-- SECTION 3: PERMISSION GROUP PERMISSIONS TABLE
-- Description: Many-to-many relationship between groups and permissions
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.permission_group_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    permission_group_id UUID NOT NULL REFERENCES public.permission_groups(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,

    -- Assignment tracking
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Unique permission per group
    CONSTRAINT uq_permission_group_permissions UNIQUE (permission_group_id, permission_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_permission_group_permissions_group_id ON public.permission_group_permissions(permission_group_id);
CREATE INDEX IF NOT EXISTS idx_permission_group_permissions_permission_id ON public.permission_group_permissions(permission_id);

-- Comments
COMMENT ON TABLE public.permission_group_permissions IS 'Links permissions to permission groups';

-- ============================================================================
-- SECTION 4: ADD FK TO EXISTING permission_group_members TABLE
-- ============================================================================

-- Add foreign key constraint to permission_group_members if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_permission_group_members_group'
        AND table_name = 'permission_group_members'
    ) THEN
        ALTER TABLE public.permission_group_members
        ADD CONSTRAINT fk_permission_group_members_group
        FOREIGN KEY (permission_group_id)
        REFERENCES public.permission_groups(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- ============================================================================
-- SECTION 5: ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_group_permissions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies for permissions (global table - read-only for authenticated users)
-- ============================================================================

-- Everyone can read permissions
CREATE POLICY "permissions_select_authenticated" ON public.permissions
    FOR SELECT
    TO authenticated
    USING (TRUE);

-- Only platform admins can insert/update/delete permissions
CREATE POLICY "permissions_insert_platform_admin" ON public.permissions
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_platform_admin());

CREATE POLICY "permissions_update_platform_admin" ON public.permissions
    FOR UPDATE
    TO authenticated
    USING (public.is_platform_admin())
    WITH CHECK (public.is_platform_admin());

CREATE POLICY "permissions_delete_platform_admin" ON public.permissions
    FOR DELETE
    TO authenticated
    USING (public.is_platform_admin());

-- ============================================================================
-- RLS Policies for permission_groups
-- ============================================================================

-- Platform admins can view all
CREATE POLICY "permission_groups_select_platform_admin" ON public.permission_groups
    FOR SELECT
    TO authenticated
    USING (public.is_platform_admin());

-- Organization members can view their org's groups
CREATE POLICY "permission_groups_select_org" ON public.permission_groups
    FOR SELECT
    TO authenticated
    USING (public.user_belongs_to_organization(organization_id));

-- Organization owners/delegates can manage groups
CREATE POLICY "permission_groups_insert_admin" ON public.permission_groups
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.organization_owners oo
            WHERE oo.organization_id = permission_groups.organization_id
            AND oo.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.organization_delegates od
            WHERE od.organization_id = permission_groups.organization_id
            AND od.user_id = auth.uid()
            AND od.is_active = TRUE
        )
        OR public.is_platform_admin()
    );

CREATE POLICY "permission_groups_update_admin" ON public.permission_groups
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_owners oo
            WHERE oo.organization_id = permission_groups.organization_id
            AND oo.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.organization_delegates od
            WHERE od.organization_id = permission_groups.organization_id
            AND od.user_id = auth.uid()
            AND od.is_active = TRUE
        )
        OR public.is_platform_admin()
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.organization_owners oo
            WHERE oo.organization_id = permission_groups.organization_id
            AND oo.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.organization_delegates od
            WHERE od.organization_id = permission_groups.organization_id
            AND od.user_id = auth.uid()
            AND od.is_active = TRUE
        )
        OR public.is_platform_admin()
    );

CREATE POLICY "permission_groups_delete_admin" ON public.permission_groups
    FOR DELETE
    TO authenticated
    USING (
        -- Cannot delete system groups
        is_system = FALSE
        AND (
            EXISTS (
                SELECT 1 FROM public.organization_owners oo
                WHERE oo.organization_id = permission_groups.organization_id
                AND oo.user_id = auth.uid()
            )
            OR EXISTS (
                SELECT 1 FROM public.organization_delegates od
                WHERE od.organization_id = permission_groups.organization_id
                AND od.user_id = auth.uid()
                AND od.is_active = TRUE
            )
            OR public.is_platform_admin()
        )
    );

-- ============================================================================
-- RLS Policies for permission_group_permissions
-- ============================================================================

-- Platform admins can view all
CREATE POLICY "permission_group_permissions_select_platform_admin" ON public.permission_group_permissions
    FOR SELECT
    TO authenticated
    USING (public.is_platform_admin());

-- Organization members can view their org's group permissions
CREATE POLICY "permission_group_permissions_select_org" ON public.permission_group_permissions
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.permission_groups pg
            WHERE pg.id = permission_group_permissions.permission_group_id
            AND public.user_belongs_to_organization(pg.organization_id)
        )
    );

-- Organization owners/delegates can manage group permissions
CREATE POLICY "permission_group_permissions_insert_admin" ON public.permission_group_permissions
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.permission_groups pg
            JOIN public.organization_owners oo ON oo.organization_id = pg.organization_id
            WHERE pg.id = permission_group_permissions.permission_group_id
            AND oo.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.permission_groups pg
            JOIN public.organization_delegates od ON od.organization_id = pg.organization_id
            WHERE pg.id = permission_group_permissions.permission_group_id
            AND od.user_id = auth.uid()
            AND od.is_active = TRUE
        )
        OR public.is_platform_admin()
    );

CREATE POLICY "permission_group_permissions_delete_admin" ON public.permission_group_permissions
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.permission_groups pg
            JOIN public.organization_owners oo ON oo.organization_id = pg.organization_id
            WHERE pg.id = permission_group_permissions.permission_group_id
            AND oo.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.permission_groups pg
            JOIN public.organization_delegates od ON od.organization_id = pg.organization_id
            WHERE pg.id = permission_group_permissions.permission_group_id
            AND od.user_id = auth.uid()
            AND od.is_active = TRUE
        )
        OR public.is_platform_admin()
    );

-- ============================================================================
-- SECTION 6: GRANTS
-- ============================================================================

-- Service role full access
GRANT ALL ON public.permissions TO service_role;
GRANT ALL ON public.permission_groups TO service_role;
GRANT ALL ON public.permission_group_permissions TO service_role;

-- Authenticated users
GRANT SELECT ON public.permissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.permission_groups TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.permission_group_permissions TO authenticated;

-- ============================================================================
-- SECTION 7: AUDIT TRIGGERS
-- ============================================================================

-- Apply audit trigger to permission_groups
DROP TRIGGER IF EXISTS audit_trigger_permission_groups ON public.permission_groups;
CREATE TRIGGER audit_trigger_permission_groups
    AFTER INSERT OR UPDATE OR DELETE ON public.permission_groups
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_trigger_func();

-- Apply audit trigger to permission_group_permissions
DROP TRIGGER IF EXISTS audit_trigger_permission_group_permissions ON public.permission_group_permissions;
CREATE TRIGGER audit_trigger_permission_group_permissions
    AFTER INSERT OR UPDATE OR DELETE ON public.permission_group_permissions
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_trigger_func();

-- ============================================================================
-- SECTION 8: SEED DEFAULT PERMISSIONS
-- ============================================================================

INSERT INTO public.permissions (code, name, description, module, sort_order) VALUES
    -- Members module
    ('members:view', 'View Members', 'Can view member list and details', 'members', 1),
    ('members:create', 'Create Members', 'Can add new members', 'members', 2),
    ('members:edit', 'Edit Members', 'Can edit member information', 'members', 3),
    ('members:delete', 'Delete Members', 'Can delete members', 'members', 4),
    ('members:export', 'Export Members', 'Can export member data', 'members', 5),
    ('members:import', 'Import Members', 'Can import member data', 'members', 6),

    -- Households module
    ('households:view', 'View Households', 'Can view household list and details', 'households', 1),
    ('households:create', 'Create Households', 'Can create new households', 'households', 2),
    ('households:edit', 'Edit Households', 'Can edit household information', 'households', 3),
    ('households:delete', 'Delete Households', 'Can delete households', 'households', 4),

    -- Donations module
    ('donations:view', 'View Donations', 'Can view donation records', 'donations', 1),
    ('donations:create', 'Create Donations', 'Can record new donations', 'donations', 2),
    ('donations:edit', 'Edit Donations', 'Can edit donation records', 'donations', 3),
    ('donations:delete', 'Delete Donations', 'Can delete donation records', 'donations', 4),
    ('donations:export', 'Export Donations', 'Can export donation data', 'donations', 5),
    ('donations:refund', 'Refund Donations', 'Can process donation refunds', 'donations', 6),

    -- Funds module
    ('funds:view', 'View Funds', 'Can view fund balances and details', 'funds', 1),
    ('funds:create', 'Create Funds', 'Can create new funds', 'funds', 2),
    ('funds:edit', 'Edit Funds', 'Can edit fund information', 'funds', 3),
    ('funds:delete', 'Delete Funds', 'Can delete funds', 'funds', 4),
    ('funds:transfer', 'Transfer Between Funds', 'Can transfer money between funds', 'funds', 5),

    -- Pledges module
    ('pledges:view', 'View Pledges', 'Can view pledge records', 'pledges', 1),
    ('pledges:create', 'Create Pledges', 'Can create new pledges', 'pledges', 2),
    ('pledges:edit', 'Edit Pledges', 'Can edit pledge records', 'pledges', 3),
    ('pledges:delete', 'Delete Pledges', 'Can delete pledge records', 'pledges', 4),

    -- Expenses module
    ('expenses:view', 'View Expenses', 'Can view expense records', 'expenses', 1),
    ('expenses:create', 'Create Expenses', 'Can log new expenses', 'expenses', 2),
    ('expenses:edit', 'Edit Expenses', 'Can edit expense records', 'expenses', 3),
    ('expenses:delete', 'Delete Expenses', 'Can delete expense records', 'expenses', 4),
    ('expenses:approve', 'Approve Expenses', 'Can approve expense requests', 'expenses', 5),

    -- Education module
    ('education:view', 'View Education', 'Can view classes and enrollments', 'education', 1),
    ('education:create', 'Create Classes', 'Can create new classes', 'education', 2),
    ('education:edit', 'Edit Classes', 'Can edit class information', 'education', 3),
    ('education:delete', 'Delete Classes', 'Can delete classes', 'education', 4),
    ('education:enroll', 'Manage Enrollments', 'Can enroll/unenroll students', 'education', 5),
    ('education:grades', 'Manage Grades', 'Can enter and edit grades', 'education', 6),

    -- Cases module
    ('cases:view', 'View Cases', 'Can view service cases', 'cases', 1),
    ('cases:create', 'Create Cases', 'Can create new cases', 'cases', 2),
    ('cases:edit', 'Edit Cases', 'Can edit case information', 'cases', 3),
    ('cases:delete', 'Delete Cases', 'Can delete cases', 'cases', 4),
    ('cases:assign', 'Assign Cases', 'Can assign cases to staff', 'cases', 5),
    ('cases:close', 'Close Cases', 'Can close/resolve cases', 'cases', 6),

    -- Umrah module
    ('umrah:view', 'View Umrah Trips', 'Can view Umrah trip details', 'umrah', 1),
    ('umrah:create', 'Create Umrah Trips', 'Can create new Umrah trips', 'umrah', 2),
    ('umrah:edit', 'Edit Umrah Trips', 'Can edit trip information', 'umrah', 3),
    ('umrah:delete', 'Delete Umrah Trips', 'Can delete trips', 'umrah', 4),
    ('umrah:manage', 'Manage Pilgrims', 'Can manage pilgrim registrations', 'umrah', 5),

    -- Qurbani module
    ('qurbani:view', 'View Qurbani', 'Can view Qurbani campaigns', 'qurbani', 1),
    ('qurbani:create', 'Create Campaigns', 'Can create new campaigns', 'qurbani', 2),
    ('qurbani:edit', 'Edit Campaigns', 'Can edit campaign information', 'qurbani', 3),
    ('qurbani:delete', 'Delete Campaigns', 'Can delete campaigns', 'qurbani', 4),
    ('qurbani:manage', 'Manage Shares', 'Can manage share registrations', 'qurbani', 5),

    -- Services module
    ('services:view', 'View Islamic Services', 'Can view service records', 'services', 1),
    ('services:create', 'Create Services', 'Can create new service records', 'services', 2),
    ('services:edit', 'Edit Services', 'Can edit service records', 'services', 3),
    ('services:delete', 'Delete Services', 'Can delete service records', 'services', 4),
    ('services:schedule', 'Schedule Services', 'Can schedule services', 'services', 5),

    -- Announcements module
    ('announcements:view', 'View Announcements', 'Can view announcements', 'announcements', 1),
    ('announcements:create', 'Create Announcements', 'Can create announcements', 'announcements', 2),
    ('announcements:edit', 'Edit Announcements', 'Can edit announcements', 'announcements', 3),
    ('announcements:delete', 'Delete Announcements', 'Can delete announcements', 'announcements', 4),
    ('announcements:publish', 'Publish Announcements', 'Can publish/unpublish announcements', 'announcements', 5),

    -- Reports module
    ('reports:view', 'View Reports', 'Can view basic reports', 'reports', 1),
    ('reports:financial', 'Financial Reports', 'Can view financial reports', 'reports', 2),
    ('reports:membership', 'Membership Reports', 'Can view membership reports', 'reports', 3),
    ('reports:export', 'Export Reports', 'Can export reports', 'reports', 4),

    -- Settings module
    ('settings:view', 'View Settings', 'Can view organization settings', 'settings', 1),
    ('settings:edit', 'Edit Settings', 'Can edit organization settings', 'settings', 2),
    ('settings:billing', 'Manage Billing', 'Can manage billing and subscription', 'settings', 3),
    ('settings:integrations', 'Manage Integrations', 'Can manage third-party integrations', 'settings', 4),

    -- Permissions module
    ('permissions:view', 'View Permissions', 'Can view permission groups', 'permissions', 1),
    ('permissions:manage', 'Manage Permissions', 'Can create/edit permission groups', 'permissions', 2)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- SECTION 9: FUNCTION TO SEED DEFAULT GROUPS FOR NEW ORGANIZATIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.seed_default_permission_groups(p_organization_id UUID)
RETURNS void AS $$
DECLARE
    v_admin_group_id UUID;
    v_finance_group_id UUID;
    v_education_group_id UUID;
    v_viewer_group_id UUID;
BEGIN
    -- Create Administrators group (all permissions)
    INSERT INTO public.permission_groups (organization_id, name, description, is_system)
    VALUES (p_organization_id, 'Administrators', 'Full administrative access to all modules', TRUE)
    RETURNING id INTO v_admin_group_id;

    -- Add all permissions to Administrators group
    INSERT INTO public.permission_group_permissions (permission_group_id, permission_id)
    SELECT v_admin_group_id, p.id
    FROM public.permissions p;

    -- Create Finance Team group
    INSERT INTO public.permission_groups (organization_id, name, description, is_system)
    VALUES (p_organization_id, 'Finance Team', 'Access to financial modules (donations, funds, expenses, reports)', TRUE)
    RETURNING id INTO v_finance_group_id;

    -- Add finance-related permissions
    INSERT INTO public.permission_group_permissions (permission_group_id, permission_id)
    SELECT v_finance_group_id, p.id
    FROM public.permissions p
    WHERE p.module IN ('donations', 'funds', 'pledges', 'expenses', 'reports');

    -- Create Education Team group
    INSERT INTO public.permission_groups (organization_id, name, description, is_system)
    VALUES (p_organization_id, 'Education Team', 'Access to education module', TRUE)
    RETURNING id INTO v_education_group_id;

    -- Add education-related permissions
    INSERT INTO public.permission_group_permissions (permission_group_id, permission_id)
    SELECT v_education_group_id, p.id
    FROM public.permissions p
    WHERE p.module = 'education';

    -- Create Viewers group (view-only access)
    INSERT INTO public.permission_groups (organization_id, name, description, is_system)
    VALUES (p_organization_id, 'Viewers', 'Read-only access to basic information', TRUE)
    RETURNING id INTO v_viewer_group_id;

    -- Add view-only permissions
    INSERT INTO public.permission_group_permissions (permission_group_id, permission_id)
    SELECT v_viewer_group_id, p.id
    FROM public.permissions p
    WHERE p.code LIKE '%:view';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.seed_default_permission_groups IS 'Seeds default permission groups for a new organization';

-- ============================================================================
-- END OF MIGRATION 00054
-- ============================================================================
