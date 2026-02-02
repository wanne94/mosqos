-- ============================================================================
-- MOSQOS - MIGRATION 00055: ORGANIZATION APPROVAL WORKFLOW
-- Description: Add approval workflow for self-service organization signup
-- ============================================================================

-- ============================================================================
-- ENUM: organization_status
-- Description: Status values for organization approval workflow
-- ============================================================================

CREATE TYPE public.organization_status AS ENUM ('pending', 'approved', 'rejected');

COMMENT ON TYPE public.organization_status IS 'Status for organization approval workflow: pending (awaiting review), approved (active), rejected (declined)';

-- ============================================================================
-- ALTER TABLE: organizations
-- Description: Add approval workflow columns
-- ============================================================================

ALTER TABLE public.organizations
ADD COLUMN status public.organization_status NOT NULL DEFAULT 'approved',
ADD COLUMN approved_at TIMESTAMPTZ,
ADD COLUMN approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN rejection_reason TEXT;

-- Comments for new columns
COMMENT ON COLUMN public.organizations.status IS 'Approval status: pending (awaiting admin review), approved (active), rejected (declined)';
COMMENT ON COLUMN public.organizations.approved_at IS 'Timestamp when organization was approved';
COMMENT ON COLUMN public.organizations.approved_by IS 'User ID of platform admin who approved the organization';
COMMENT ON COLUMN public.organizations.rejection_reason IS 'Reason for rejection if status is rejected';

-- Index for faster filtering by status
CREATE INDEX idx_organizations_status ON public.organizations(status);
CREATE INDEX idx_organizations_pending ON public.organizations(status) WHERE status = 'pending';

-- ============================================================================
-- RLS POLICIES: Update for approval workflow
-- ============================================================================

-- Drop existing select policies that need modification
DROP POLICY IF EXISTS "organizations_select_public" ON public.organizations;

-- Public can view only APPROVED and active organizations (for join pages, public info)
CREATE POLICY "organizations_select_public_approved" ON public.organizations
    FOR SELECT
    USING (is_active = true AND status = 'approved');

-- Authenticated users can see their own pending organizations
CREATE POLICY "organizations_select_own_pending" ON public.organizations
    FOR SELECT
    TO authenticated
    USING (created_by = auth.uid());

-- Platform admins can view all organizations (already exists but re-create for clarity)
DROP POLICY IF EXISTS "organizations_select_platform_admin" ON public.organizations;
CREATE POLICY "organizations_select_platform_admin" ON public.organizations
    FOR SELECT
    TO authenticated
    USING (public.is_platform_admin());

-- ============================================================================
-- FUNCTION: approve_organization
-- Description: Approve a pending organization (platform admin only)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.approve_organization(org_id UUID)
RETURNS public.organizations AS $$
DECLARE
    result public.organizations;
BEGIN
    -- Check if caller is platform admin
    IF NOT public.is_platform_admin() THEN
        RAISE EXCEPTION 'Only platform admins can approve organizations';
    END IF;

    -- Update organization status
    UPDATE public.organizations
    SET
        status = 'approved',
        approved_at = NOW(),
        approved_by = auth.uid(),
        updated_at = NOW(),
        updated_by = auth.uid()
    WHERE id = org_id AND status = 'pending'
    RETURNING * INTO result;

    IF result IS NULL THEN
        RAISE EXCEPTION 'Organization not found or not in pending status';
    END IF;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.approve_organization(UUID) IS 'Approve a pending organization. Platform admin only.';

-- ============================================================================
-- FUNCTION: reject_organization
-- Description: Reject a pending organization with reason (platform admin only)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.reject_organization(org_id UUID, reason TEXT)
RETURNS public.organizations AS $$
DECLARE
    result public.organizations;
BEGIN
    -- Check if caller is platform admin
    IF NOT public.is_platform_admin() THEN
        RAISE EXCEPTION 'Only platform admins can reject organizations';
    END IF;

    -- Validate reason
    IF reason IS NULL OR TRIM(reason) = '' THEN
        RAISE EXCEPTION 'Rejection reason is required';
    END IF;

    -- Update organization status
    UPDATE public.organizations
    SET
        status = 'rejected',
        rejection_reason = reason,
        updated_at = NOW(),
        updated_by = auth.uid()
    WHERE id = org_id AND status = 'pending'
    RETURNING * INTO result;

    IF result IS NULL THEN
        RAISE EXCEPTION 'Organization not found or not in pending status';
    END IF;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.reject_organization(UUID, TEXT) IS 'Reject a pending organization with a reason. Platform admin only.';

-- ============================================================================
-- FUNCTION: get_pending_organizations_count
-- Description: Get count of pending organizations (for dashboard badge)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_pending_organizations_count()
RETURNS INTEGER AS $$
BEGIN
    IF NOT public.is_platform_admin() THEN
        RETURN 0;
    END IF;

    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM public.organizations
        WHERE status = 'pending'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.get_pending_organizations_count() IS 'Get count of pending organization applications. Platform admin only.';

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant execute on new functions
GRANT EXECUTE ON FUNCTION public.approve_organization(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_organization(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pending_organizations_count() TO authenticated;

-- ============================================================================
-- END OF MIGRATION 00055
-- ============================================================================
