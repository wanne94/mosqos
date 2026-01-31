-- ============================================================================
-- MOSQOS - MIGRATION 00041: ORGANIZATION FUNDS
-- Description: Organization-specific fund tracking for tuition/education payments
-- ============================================================================

-- ============================================================================
-- SECTION 1: ORGANIZATION FUNDS TABLE
-- Description: Links funds to organizations with balance tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.organization_funds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    fund_id UUID REFERENCES public.funds(id) ON DELETE SET NULL,

    -- Fund identity
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Fund type (matches funds.fund_type)
    fund_type VARCHAR(50) DEFAULT 'general' CHECK (
        fund_type IN ('general', 'zakat', 'sadaqah', 'building', 'education', 'emergency', 'charity', 'special')
    ),

    -- Balance tracking
    balance DECIMAL(12,2) DEFAULT 0,

    -- Goal (organization-specific target)
    goal_amount DECIMAL(12,2),

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_organization_funds_org_id ON public.organization_funds(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_funds_fund_id ON public.organization_funds(fund_id);
CREATE INDEX IF NOT EXISTS idx_organization_funds_active ON public.organization_funds(organization_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_organization_funds_name ON public.organization_funds(organization_id, name);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_updated_at_organization_funds ON public.organization_funds;
CREATE TRIGGER set_updated_at_organization_funds
    BEFORE UPDATE ON public.organization_funds
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for created_by
DROP TRIGGER IF EXISTS set_created_by_organization_funds ON public.organization_funds;
CREATE TRIGGER set_created_by_organization_funds
    BEFORE INSERT ON public.organization_funds
    FOR EACH ROW
    EXECUTE FUNCTION public.set_created_by();

-- Trigger for updated_by
DROP TRIGGER IF EXISTS set_updated_by_organization_funds ON public.organization_funds;
CREATE TRIGGER set_updated_by_organization_funds
    BEFORE UPDATE ON public.organization_funds
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_by();

-- Comments
COMMENT ON TABLE public.organization_funds IS 'Organization-specific fund instances with balance tracking';
COMMENT ON COLUMN public.organization_funds.balance IS 'Current balance in this organization fund';
COMMENT ON COLUMN public.organization_funds.goal_amount IS 'Organization-specific fundraising goal';

-- ============================================================================
-- SECTION 2: ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE public.organization_funds ENABLE ROW LEVEL SECURITY;

-- Platform admins can view all
CREATE POLICY "organization_funds_select_platform_admin" ON public.organization_funds
    FOR SELECT
    TO authenticated
    USING (public.is_platform_admin());

-- Organization members can view their org funds
CREATE POLICY "organization_funds_select_org" ON public.organization_funds
    FOR SELECT
    TO authenticated
    USING (public.user_belongs_to_organization(organization_id));

-- Organization admins can manage funds
CREATE POLICY "organization_funds_insert_admin" ON public.organization_funds
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.user_belongs_to_organization(organization_id)
        OR public.is_platform_admin()
    );

CREATE POLICY "organization_funds_update_admin" ON public.organization_funds
    FOR UPDATE
    TO authenticated
    USING (
        public.user_belongs_to_organization(organization_id)
        OR public.is_platform_admin()
    )
    WITH CHECK (
        public.user_belongs_to_organization(organization_id)
        OR public.is_platform_admin()
    );

CREATE POLICY "organization_funds_delete_admin" ON public.organization_funds
    FOR DELETE
    TO authenticated
    USING (
        public.user_belongs_to_organization(organization_id)
        OR public.is_platform_admin()
    );

-- ============================================================================
-- SECTION 3: GRANTS
-- ============================================================================

-- Service role full access
GRANT ALL ON public.organization_funds TO service_role;

-- Authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_funds TO authenticated;

-- ============================================================================
-- SECTION 4: AUDIT TRIGGERS
-- ============================================================================

-- Apply audit trigger
DROP TRIGGER IF EXISTS audit_trigger_organization_funds ON public.organization_funds;
CREATE TRIGGER audit_trigger_organization_funds
    AFTER INSERT OR UPDATE OR DELETE ON public.organization_funds
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_trigger_func();

-- ============================================================================
-- END OF MIGRATION 00041
-- ============================================================================
