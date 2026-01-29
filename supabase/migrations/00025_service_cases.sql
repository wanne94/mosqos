-- ============================================================================
-- MOSQOS - MIGRATION 00025: SERVICE CASES MODULE
-- Description: Social services, support requests, and communication logs
-- ============================================================================

-- ============================================================================
-- SECTION 1: SERVICE CASES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.service_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Case number (auto-generated)
    case_number VARCHAR(20),

    -- Client/member
    member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,

    -- Case classification
    case_type VARCHAR(100),  -- Financial assistance, counseling, etc.
    category VARCHAR(100),  -- Sub-category

    -- Case details
    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- Status and priority
    status VARCHAR(50) DEFAULT 'open' CHECK (
        status IN ('open', 'in_progress', 'pending', 'resolved', 'closed', 'cancelled')
    ),
    priority VARCHAR(50) DEFAULT 'medium' CHECK (
        priority IN ('low', 'medium', 'high', 'urgent')
    ),

    -- Financial tracking (for financial assistance cases)
    requested_amount DECIMAL(12,2),
    approved_amount DECIMAL(12,2),
    disbursed_amount DECIMAL(12,2) DEFAULT 0,
    fund_id UUID REFERENCES public.funds(id) ON DELETE SET NULL,

    -- Dates
    assistance_date DATE,
    due_date DATE,
    resolved_date DATE,

    -- Assignment
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ,

    -- Resolution
    resolution_notes TEXT,
    outcome VARCHAR(100),  -- Approved, Denied, Referred, etc.

    -- Threaded notes/discussion (JSONB array)
    -- Format: [{ id, author_id, author_name, content, created_at, is_internal }]
    notes_thread JSONB DEFAULT '[]'::JSONB,

    -- Flags
    is_confidential BOOLEAN DEFAULT TRUE,
    requires_followup BOOLEAN DEFAULT FALSE,
    followup_date DATE,

    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes for service_cases
CREATE INDEX IF NOT EXISTS idx_service_cases_organization_id ON public.service_cases(organization_id);
CREATE INDEX IF NOT EXISTS idx_service_cases_case_number ON public.service_cases(case_number) WHERE case_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_service_cases_member_id ON public.service_cases(member_id) WHERE member_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_service_cases_status ON public.service_cases(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_service_cases_priority ON public.service_cases(organization_id, priority);
CREATE INDEX IF NOT EXISTS idx_service_cases_type ON public.service_cases(organization_id, case_type) WHERE case_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_service_cases_assigned ON public.service_cases(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_service_cases_fund_id ON public.service_cases(fund_id) WHERE fund_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_service_cases_created ON public.service_cases(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_cases_open ON public.service_cases(organization_id)
    WHERE status IN ('open', 'in_progress', 'pending');
CREATE INDEX IF NOT EXISTS idx_service_cases_followup ON public.service_cases(organization_id, followup_date)
    WHERE requires_followup = TRUE AND status NOT IN ('resolved', 'closed', 'cancelled');

-- Triggers for service_cases
DROP TRIGGER IF EXISTS set_updated_at_service_cases ON public.service_cases;
CREATE TRIGGER set_updated_at_service_cases
    BEFORE UPDATE ON public.service_cases
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_created_by_service_cases ON public.service_cases;
CREATE TRIGGER set_created_by_service_cases
    BEFORE INSERT ON public.service_cases
    FOR EACH ROW
    EXECUTE FUNCTION public.set_created_by();

DROP TRIGGER IF EXISTS set_updated_by_service_cases ON public.service_cases;
CREATE TRIGGER set_updated_by_service_cases
    BEFORE UPDATE ON public.service_cases
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_by();

-- Comments
COMMENT ON TABLE public.service_cases IS 'Social service cases for community assistance';
COMMENT ON COLUMN public.service_cases.case_number IS 'Auto-generated case number (CASE-YYYY-NNNNN)';
COMMENT ON COLUMN public.service_cases.status IS 'Case status: open, in_progress, pending, resolved, closed, cancelled';
COMMENT ON COLUMN public.service_cases.priority IS 'Priority level: low, medium, high, urgent';
COMMENT ON COLUMN public.service_cases.notes_thread IS 'JSON array of threaded discussion notes';
COMMENT ON COLUMN public.service_cases.is_confidential IS 'If true, only assigned staff can view details';

-- Auto-generate case number
CREATE OR REPLACE FUNCTION public.generate_service_case_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.case_number IS NULL THEN
        NEW.case_number := public.generate_case_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS generate_case_number_trigger ON public.service_cases;
CREATE TRIGGER generate_case_number_trigger
    BEFORE INSERT ON public.service_cases
    FOR EACH ROW
    EXECUTE FUNCTION public.generate_service_case_number();

-- Set closed_at when status changes to resolved/closed
CREATE OR REPLACE FUNCTION public.set_case_closed_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IN ('resolved', 'closed') AND OLD.status NOT IN ('resolved', 'closed') THEN
        NEW.closed_at := NOW();
        NEW.resolved_date := CURRENT_DATE;
    ELSIF NEW.status NOT IN ('resolved', 'closed') AND OLD.status IN ('resolved', 'closed') THEN
        NEW.closed_at := NULL;
        NEW.resolved_date := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_case_closed_at ON public.service_cases;
CREATE TRIGGER set_case_closed_at
    BEFORE UPDATE ON public.service_cases
    FOR EACH ROW
    EXECUTE FUNCTION public.set_case_closed_at();

-- Add foreign key for expenses referencing service_cases
ALTER TABLE public.expenses
    DROP CONSTRAINT IF EXISTS expenses_service_case_id_fkey;
ALTER TABLE public.expenses
    ADD CONSTRAINT expenses_service_case_id_fkey
    FOREIGN KEY (service_case_id) REFERENCES public.service_cases(id) ON DELETE SET NULL;

-- ============================================================================
-- SECTION 2: SUPPORT REQUESTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.support_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Requestor
    member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    requester_name VARCHAR(255),
    requester_email VARCHAR(255),
    requester_phone VARCHAR(50),

    -- Request details
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),

    -- Status
    status VARCHAR(50) DEFAULT 'open' CHECK (
        status IN ('open', 'in_progress', 'pending', 'resolved', 'closed')
    ),
    priority VARCHAR(50) DEFAULT 'medium' CHECK (
        priority IN ('low', 'medium', 'high', 'urgent')
    ),

    -- Assignment
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Resolution
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,

    -- Source
    source VARCHAR(50) DEFAULT 'manual' CHECK (
        source IN ('manual', 'portal', 'email', 'phone', 'walk_in', 'other')
    ),

    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes for support_requests
CREATE INDEX IF NOT EXISTS idx_support_requests_organization_id ON public.support_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_support_requests_member_id ON public.support_requests(member_id) WHERE member_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_support_requests_status ON public.support_requests(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_support_requests_priority ON public.support_requests(organization_id, priority);
CREATE INDEX IF NOT EXISTS idx_support_requests_category ON public.support_requests(organization_id, category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_support_requests_assigned ON public.support_requests(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_support_requests_created ON public.support_requests(organization_id, created_at DESC);

-- Triggers for support_requests
DROP TRIGGER IF EXISTS set_updated_at_support_requests ON public.support_requests;
CREATE TRIGGER set_updated_at_support_requests
    BEFORE UPDATE ON public.support_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_created_by_support_requests ON public.support_requests;
CREATE TRIGGER set_created_by_support_requests
    BEFORE INSERT ON public.support_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.set_created_by();

DROP TRIGGER IF EXISTS set_updated_by_support_requests ON public.support_requests;
CREATE TRIGGER set_updated_by_support_requests
    BEFORE UPDATE ON public.support_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_by();

-- Comments
COMMENT ON TABLE public.support_requests IS 'General support/help requests from members';
COMMENT ON COLUMN public.support_requests.source IS 'How request was received: manual, portal, email, phone, walk_in, other';

-- ============================================================================
-- SECTION 3: COMMUNICATION LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.communication_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Related records
    member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
    service_case_id UUID REFERENCES public.service_cases(id) ON DELETE CASCADE,
    support_request_id UUID REFERENCES public.support_requests(id) ON DELETE CASCADE,

    -- Communication details
    communication_type VARCHAR(50) NOT NULL CHECK (
        communication_type IN ('email', 'phone', 'sms', 'in_person', 'letter', 'video_call', 'other')
    ),
    direction VARCHAR(20) NOT NULL CHECK (
        direction IN ('inbound', 'outbound')
    ),

    -- Content
    subject VARCHAR(255),
    content TEXT,
    summary TEXT,  -- Brief summary for quick reference

    -- Status
    status VARCHAR(50) DEFAULT 'completed' CHECK (
        status IN ('scheduled', 'in_progress', 'completed', 'failed', 'cancelled')
    ),

    -- Scheduling (for scheduled communications)
    scheduled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Contact info used
    contact_method VARCHAR(255),  -- Email address, phone number used

    -- Attachments
    attachments JSONB DEFAULT '[]'::JSONB,  -- Array of attachment objects

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes for communication_logs
CREATE INDEX IF NOT EXISTS idx_communication_logs_organization_id ON public.communication_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_communication_logs_member_id ON public.communication_logs(member_id) WHERE member_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_communication_logs_case_id ON public.communication_logs(service_case_id) WHERE service_case_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_communication_logs_support_id ON public.communication_logs(support_request_id) WHERE support_request_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_communication_logs_type ON public.communication_logs(organization_id, communication_type);
CREATE INDEX IF NOT EXISTS idx_communication_logs_direction ON public.communication_logs(organization_id, direction);
CREATE INDEX IF NOT EXISTS idx_communication_logs_created ON public.communication_logs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_communication_logs_scheduled ON public.communication_logs(scheduled_at)
    WHERE status = 'scheduled' AND scheduled_at IS NOT NULL;

-- Triggers for communication_logs
DROP TRIGGER IF EXISTS set_created_by_communication_logs ON public.communication_logs;
CREATE TRIGGER set_created_by_communication_logs
    BEFORE INSERT ON public.communication_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.set_created_by();

-- Comments
COMMENT ON TABLE public.communication_logs IS 'Log of all communications with members and cases';
COMMENT ON COLUMN public.communication_logs.communication_type IS 'Type: email, phone, sms, in_person, letter, video_call, other';
COMMENT ON COLUMN public.communication_logs.direction IS 'Communication direction: inbound or outbound';
COMMENT ON COLUMN public.communication_logs.attachments IS 'JSON array of attachment objects';

-- ============================================================================
-- SECTION 4: ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE public.service_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_logs ENABLE ROW LEVEL SECURITY;

-- Service cases policies
CREATE POLICY "service_cases_select_org" ON public.service_cases
    FOR SELECT TO authenticated
    USING (public.user_belongs_to_organization(organization_id));

CREATE POLICY "service_cases_insert_org" ON public.service_cases
    FOR INSERT TO authenticated
    WITH CHECK (public.user_belongs_to_organization(organization_id));

CREATE POLICY "service_cases_update_org" ON public.service_cases
    FOR UPDATE TO authenticated
    USING (public.user_belongs_to_organization(organization_id))
    WITH CHECK (public.user_belongs_to_organization(organization_id));

CREATE POLICY "service_cases_delete_org" ON public.service_cases
    FOR DELETE TO authenticated
    USING (public.user_belongs_to_organization(organization_id));

CREATE POLICY "service_cases_platform_admin" ON public.service_cases
    FOR ALL TO authenticated
    USING (public.is_platform_admin())
    WITH CHECK (public.is_platform_admin());

-- Support requests policies
CREATE POLICY "support_requests_select_org" ON public.support_requests
    FOR SELECT TO authenticated
    USING (public.user_belongs_to_organization(organization_id));

CREATE POLICY "support_requests_insert_org" ON public.support_requests
    FOR INSERT TO authenticated
    WITH CHECK (public.user_belongs_to_organization(organization_id));

CREATE POLICY "support_requests_update_org" ON public.support_requests
    FOR UPDATE TO authenticated
    USING (public.user_belongs_to_organization(organization_id))
    WITH CHECK (public.user_belongs_to_organization(organization_id));

CREATE POLICY "support_requests_delete_org" ON public.support_requests
    FOR DELETE TO authenticated
    USING (public.user_belongs_to_organization(organization_id));

CREATE POLICY "support_requests_platform_admin" ON public.support_requests
    FOR ALL TO authenticated
    USING (public.is_platform_admin())
    WITH CHECK (public.is_platform_admin());

-- Communication logs policies
CREATE POLICY "communication_logs_select_org" ON public.communication_logs
    FOR SELECT TO authenticated
    USING (public.user_belongs_to_organization(organization_id));

CREATE POLICY "communication_logs_insert_org" ON public.communication_logs
    FOR INSERT TO authenticated
    WITH CHECK (public.user_belongs_to_organization(organization_id));

CREATE POLICY "communication_logs_update_org" ON public.communication_logs
    FOR UPDATE TO authenticated
    USING (public.user_belongs_to_organization(organization_id))
    WITH CHECK (public.user_belongs_to_organization(organization_id));

CREATE POLICY "communication_logs_delete_org" ON public.communication_logs
    FOR DELETE TO authenticated
    USING (public.user_belongs_to_organization(organization_id));

CREATE POLICY "communication_logs_platform_admin" ON public.communication_logs
    FOR ALL TO authenticated
    USING (public.is_platform_admin())
    WITH CHECK (public.is_platform_admin());

-- ============================================================================
-- SECTION 5: GRANTS
-- ============================================================================

GRANT ALL ON public.service_cases TO service_role;
GRANT ALL ON public.support_requests TO service_role;
GRANT ALL ON public.communication_logs TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_cases TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.communication_logs TO authenticated;

-- ============================================================================
-- SECTION 6: AUDIT TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS audit_trigger_service_cases ON public.service_cases;
CREATE TRIGGER audit_trigger_service_cases
    AFTER INSERT OR UPDATE OR DELETE ON public.service_cases
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

DROP TRIGGER IF EXISTS audit_trigger_support_requests ON public.support_requests;
CREATE TRIGGER audit_trigger_support_requests
    AFTER INSERT OR UPDATE OR DELETE ON public.support_requests
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- ============================================================================
-- END OF MIGRATION 00025
-- ============================================================================
