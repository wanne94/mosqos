-- =============================================
-- Migration: 00051_islamic_services
-- Description: Islamic services module (Nikah, Janazah, Shahada, etc.)
-- =============================================

-- Create islamic_service_types table
CREATE TABLE IF NOT EXISTS public.islamic_service_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Type info
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) NOT NULL,
    name_ar VARCHAR(100),
    name_tr VARCHAR(100),
    description TEXT,

    -- Configuration
    default_fee DECIMAL(12,2) DEFAULT 0,
    requires_witnesses BOOLEAN DEFAULT FALSE,
    witness_count INTEGER DEFAULT 2,
    requires_appointment BOOLEAN DEFAULT TRUE,
    certificate_template JSONB DEFAULT '{}',

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    UNIQUE(organization_id, slug)
);

-- Create islamic_services table
CREATE TABLE IF NOT EXISTS public.islamic_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    service_type_id UUID NOT NULL REFERENCES public.islamic_service_types(id) ON DELETE RESTRICT,

    -- Case number (auto-generated)
    case_number VARCHAR(30) NOT NULL,

    -- Status workflow
    status VARCHAR(50) DEFAULT 'requested' CHECK (status IN (
        'requested', 'pending_documents', 'documents_received', 'scheduled',
        'in_progress', 'completed', 'cancelled'
    )),

    -- Scheduling
    scheduled_date DATE,
    scheduled_time TIME,
    location VARCHAR(255),

    -- Fee tracking
    fee_amount DECIMAL(12,2) DEFAULT 0,
    fee_paid DECIMAL(12,2) DEFAULT 0,
    fee_status VARCHAR(50) DEFAULT 'pending' CHECK (fee_status IN ('pending', 'partial', 'paid', 'waived')),

    -- People involved
    officiant_id UUID REFERENCES public.members(id),
    requestor_id UUID REFERENCES public.members(id),
    requestor_name VARCHAR(255),
    requestor_phone VARCHAR(50),
    requestor_email VARCHAR(255),

    -- Service-specific data (varies by service type)
    service_data JSONB DEFAULT '{}',

    -- Witnesses (for services requiring them)
    witnesses JSONB DEFAULT '[]',

    -- Documents and attachments
    attachments JSONB DEFAULT '[]',

    -- Certificate
    certificate_number VARCHAR(50),
    certificate_issued_at TIMESTAMPTZ,
    certificate_url TEXT,

    -- Notes
    notes TEXT,
    internal_notes TEXT,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_service_types_organization ON public.islamic_service_types(organization_id);
CREATE INDEX IF NOT EXISTS idx_services_organization ON public.islamic_services(organization_id);
CREATE INDEX IF NOT EXISTS idx_services_type ON public.islamic_services(service_type_id);
CREATE INDEX IF NOT EXISTS idx_services_status ON public.islamic_services(status);
CREATE INDEX IF NOT EXISTS idx_services_case_number ON public.islamic_services(case_number);
CREATE INDEX IF NOT EXISTS idx_services_scheduled_date ON public.islamic_services(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_services_created_at ON public.islamic_services(created_at DESC);

-- Enable RLS
ALTER TABLE public.islamic_service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.islamic_services ENABLE ROW LEVEL SECURITY;

-- RLS Policies for islamic_service_types
CREATE POLICY "Users can view service types in their organization"
    ON public.islamic_service_types
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
            UNION
            SELECT organization_id FROM public.organization_owners WHERE user_id = auth.uid()
            UNION
            SELECT organization_id FROM public.organization_delegates WHERE user_id = auth.uid()
        )
        OR EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
    );

CREATE POLICY "Admins can manage service types"
    ON public.islamic_service_types
    FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_owners WHERE user_id = auth.uid()
            UNION
            SELECT organization_id FROM public.organization_delegates WHERE user_id = auth.uid()
        )
        OR EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
    );

-- RLS Policies for islamic_services
CREATE POLICY "Users can view services in their organization"
    ON public.islamic_services
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
            UNION
            SELECT organization_id FROM public.organization_owners WHERE user_id = auth.uid()
            UNION
            SELECT organization_id FROM public.organization_delegates WHERE user_id = auth.uid()
        )
        OR EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
    );

CREATE POLICY "Admins can insert services"
    ON public.islamic_services
    FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.organization_owners WHERE user_id = auth.uid()
            UNION
            SELECT organization_id FROM public.organization_delegates WHERE user_id = auth.uid()
        )
        OR EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
    );

CREATE POLICY "Admins can update services"
    ON public.islamic_services
    FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_owners WHERE user_id = auth.uid()
            UNION
            SELECT organization_id FROM public.organization_delegates WHERE user_id = auth.uid()
        )
        OR EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
    );

CREATE POLICY "Admins can delete services"
    ON public.islamic_services
    FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_owners WHERE user_id = auth.uid()
            UNION
            SELECT organization_id FROM public.organization_delegates WHERE user_id = auth.uid()
        )
        OR EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
    );

-- Updated at triggers
CREATE TRIGGER set_islamic_service_types_updated_at
    BEFORE UPDATE ON public.islamic_service_types
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_islamic_services_updated_at
    BEFORE UPDATE ON public.islamic_services
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate case number
CREATE OR REPLACE FUNCTION generate_service_case_number(org_id UUID, service_slug VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    prefix VARCHAR;
    year_str VARCHAR;
    seq_num INTEGER;
    case_num VARCHAR;
BEGIN
    -- Get prefix based on service type
    prefix := UPPER(LEFT(service_slug, 3));
    year_str := TO_CHAR(NOW(), 'YY');

    -- Get next sequence number for this org/year
    SELECT COALESCE(MAX(
        CAST(
            NULLIF(REGEXP_REPLACE(case_number, '[^0-9]', '', 'g'), '')
            AS INTEGER
        )
    ), 0) + 1
    INTO seq_num
    FROM public.islamic_services
    WHERE organization_id = org_id
    AND case_number LIKE prefix || '-' || year_str || '-%';

    -- Format: NIK-25-0001 or JAN-25-0001 etc.
    case_num := prefix || '-' || year_str || '-' || LPAD(seq_num::TEXT, 4, '0');

    RETURN case_num;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT ON public.islamic_service_types TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.islamic_service_types TO authenticated;
GRANT SELECT ON public.islamic_services TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.islamic_services TO authenticated;

COMMENT ON TABLE public.islamic_service_types IS 'Configurable service types per organization (Nikah, Janazah, Shahada, etc.)';
COMMENT ON TABLE public.islamic_services IS 'Islamic service records with status tracking and certificate generation';
