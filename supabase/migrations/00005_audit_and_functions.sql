-- ============================================================================
-- Migration: 00005_audit_and_functions.sql
-- Description: Audit logging system and helper functions for MosqOS
-- ============================================================================

-- ============================================================================
-- SECTION 1: AUDIT LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(10) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    changed_fields TEXT[],
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Add comment
COMMENT ON TABLE public.audit_log IS 'Comprehensive audit trail for all database changes';

-- ============================================================================
-- SECTION 2: AUDIT LOG INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_audit_log_org ON public.audit_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_table ON public.audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_record ON public.audit_log(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON public.audit_log(created_at DESC);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_audit_log_org_table_created
    ON public.audit_log(organization_id, table_name, created_at DESC);

-- ============================================================================
-- SECTION 3: TRIGGER FUNCTIONS
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 3.1: set_updated_at() - Automatically set updated_at on UPDATE
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.set_updated_at() IS 'Automatically sets updated_at to current timestamp on row update';

-- ---------------------------------------------------------------------------
-- 3.2: set_created_by() - Automatically set created_by on INSERT
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_created_by()
RETURNS TRIGGER AS $$
BEGIN
    -- Only set if not already provided and user is authenticated
    IF NEW.created_by IS NULL THEN
        NEW.created_by = auth.uid();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.set_created_by() IS 'Automatically sets created_by to current authenticated user on row insert';

-- ---------------------------------------------------------------------------
-- 3.3: set_updated_by() - Automatically set updated_by on UPDATE
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_by()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.set_updated_by() IS 'Automatically sets updated_by to current authenticated user on row update';

-- ---------------------------------------------------------------------------
-- 3.4: audit_trigger_func() - Comprehensive audit logging
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
    v_old_data JSONB;
    v_new_data JSONB;
    v_changed_fields TEXT[];
    v_organization_id UUID;
    v_user_id UUID;
    v_user_email VARCHAR(255);
    v_record_id UUID;
    key_name TEXT;
BEGIN
    -- Get current user info
    v_user_id := auth.uid();

    -- Try to get user email from auth.users
    SELECT email INTO v_user_email
    FROM auth.users
    WHERE id = v_user_id;

    -- Handle different operations
    IF TG_OP = 'INSERT' THEN
        v_new_data := to_jsonb(NEW);
        v_record_id := NEW.id;

        -- Try to get organization_id from the new record
        IF v_new_data ? 'organization_id' THEN
            v_organization_id := (v_new_data->>'organization_id')::UUID;
        END IF;

        INSERT INTO public.audit_log (
            organization_id,
            table_name,
            record_id,
            action,
            new_data,
            user_id,
            user_email
        ) VALUES (
            v_organization_id,
            TG_TABLE_NAME,
            v_record_id,
            'INSERT',
            v_new_data,
            v_user_id,
            v_user_email
        );

        RETURN NEW;

    ELSIF TG_OP = 'UPDATE' THEN
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
        v_record_id := NEW.id;

        -- Try to get organization_id from the record
        IF v_new_data ? 'organization_id' THEN
            v_organization_id := (v_new_data->>'organization_id')::UUID;
        END IF;

        -- Build array of changed fields
        v_changed_fields := ARRAY[]::TEXT[];
        FOR key_name IN SELECT jsonb_object_keys(v_new_data)
        LOOP
            -- Skip audit-related fields to avoid noise
            IF key_name NOT IN ('updated_at', 'updated_by') THEN
                IF (v_old_data->key_name)::TEXT IS DISTINCT FROM (v_new_data->key_name)::TEXT THEN
                    v_changed_fields := array_append(v_changed_fields, key_name);
                END IF;
            END IF;
        END LOOP;

        -- Only log if there were actual changes (besides updated_at/updated_by)
        IF array_length(v_changed_fields, 1) > 0 THEN
            INSERT INTO public.audit_log (
                organization_id,
                table_name,
                record_id,
                action,
                old_data,
                new_data,
                changed_fields,
                user_id,
                user_email
            ) VALUES (
                v_organization_id,
                TG_TABLE_NAME,
                v_record_id,
                'UPDATE',
                v_old_data,
                v_new_data,
                v_changed_fields,
                v_user_id,
                v_user_email
            );
        END IF;

        RETURN NEW;

    ELSIF TG_OP = 'DELETE' THEN
        v_old_data := to_jsonb(OLD);
        v_record_id := OLD.id;

        -- Try to get organization_id from the old record
        IF v_old_data ? 'organization_id' THEN
            v_organization_id := (v_old_data->>'organization_id')::UUID;
        END IF;

        INSERT INTO public.audit_log (
            organization_id,
            table_name,
            record_id,
            action,
            old_data,
            user_id,
            user_email
        ) VALUES (
            v_organization_id,
            TG_TABLE_NAME,
            v_record_id,
            'DELETE',
            v_old_data,
            v_user_id,
            v_user_email
        );

        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.audit_trigger_func() IS 'Comprehensive audit logging trigger that captures INSERT, UPDATE, and DELETE operations';

-- ---------------------------------------------------------------------------
-- 3.5: generate_case_number() - Generate unique case numbers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_case_number()
RETURNS TEXT AS $$
DECLARE
    v_year TEXT;
    v_sequence INT;
    v_case_number TEXT;
BEGIN
    v_year := to_char(NOW(), 'YYYY');

    -- Get the next sequence number for this year
    SELECT COALESCE(MAX(
        CAST(
            SUBSTRING(case_number FROM 'CASE-' || v_year || '-(\d+)')
            AS INTEGER
        )
    ), 0) + 1
    INTO v_sequence
    FROM public.islamic_services
    WHERE case_number LIKE 'CASE-' || v_year || '-%';

    -- Format: CASE-YYYY-NNNNN (5 digit sequence)
    v_case_number := 'CASE-' || v_year || '-' || LPAD(v_sequence::TEXT, 5, '0');

    RETURN v_case_number;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.generate_case_number() IS 'Generates unique case numbers in format CASE-YYYY-NNNNN';

-- ---------------------------------------------------------------------------
-- 3.6: generate_receipt_number() - Generate unique receipt numbers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_receipt_number()
RETURNS TEXT AS $$
DECLARE
    v_year TEXT;
    v_sequence INT;
    v_receipt_number TEXT;
BEGIN
    v_year := to_char(NOW(), 'YYYY');

    -- Get the next sequence number for this year
    SELECT COALESCE(MAX(
        CAST(
            SUBSTRING(receipt_number FROM 'RCP-' || v_year || '-(\d+)')
            AS INTEGER
        )
    ), 0) + 1
    INTO v_sequence
    FROM public.donations
    WHERE receipt_number LIKE 'RCP-' || v_year || '-%';

    -- Format: RCP-YYYY-NNNNN (5 digit sequence)
    v_receipt_number := 'RCP-' || v_year || '-' || LPAD(v_sequence::TEXT, 5, '0');

    RETURN v_receipt_number;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.generate_receipt_number() IS 'Generates unique receipt numbers in format RCP-YYYY-NNNNN';

-- ============================================================================
-- SECTION 4: APPLY TRIGGERS TO ALL TABLES
-- ============================================================================

-- Helper function to apply triggers dynamically
CREATE OR REPLACE FUNCTION public.apply_audit_triggers()
RETURNS void AS $$
DECLARE
    r RECORD;
    trigger_name TEXT;
BEGIN
    -- Loop through all tables in public schema
    FOR r IN
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND table_name NOT IN ('audit_log', 'schema_migrations')
    LOOP
        -- Check if table has 'id' column (required for audit logging)
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = r.table_name
            AND column_name = 'id'
        ) THEN
            -- Apply audit trigger
            trigger_name := 'audit_trigger_' || r.table_name;
            EXECUTE format('
                DROP TRIGGER IF EXISTS %I ON public.%I;
                CREATE TRIGGER %I
                AFTER INSERT OR UPDATE OR DELETE ON public.%I
                FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
            ', trigger_name, r.table_name, trigger_name, r.table_name);

            RAISE NOTICE 'Applied audit trigger to table: %', r.table_name;
        END IF;

        -- Check and apply updated_at trigger
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = r.table_name
            AND column_name = 'updated_at'
        ) THEN
            trigger_name := 'set_updated_at_' || r.table_name;
            EXECUTE format('
                DROP TRIGGER IF EXISTS %I ON public.%I;
                CREATE TRIGGER %I
                BEFORE UPDATE ON public.%I
                FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
            ', trigger_name, r.table_name, trigger_name, r.table_name);

            RAISE NOTICE 'Applied updated_at trigger to table: %', r.table_name;
        END IF;

        -- Check and apply created_by trigger
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = r.table_name
            AND column_name = 'created_by'
        ) THEN
            trigger_name := 'set_created_by_' || r.table_name;
            EXECUTE format('
                DROP TRIGGER IF EXISTS %I ON public.%I;
                CREATE TRIGGER %I
                BEFORE INSERT ON public.%I
                FOR EACH ROW EXECUTE FUNCTION public.set_created_by();
            ', trigger_name, r.table_name, trigger_name, r.table_name);

            RAISE NOTICE 'Applied created_by trigger to table: %', r.table_name;
        END IF;

        -- Check and apply updated_by trigger
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = r.table_name
            AND column_name = 'updated_by'
        ) THEN
            trigger_name := 'set_updated_by_' || r.table_name;
            EXECUTE format('
                DROP TRIGGER IF EXISTS %I ON public.%I;
                CREATE TRIGGER %I
                BEFORE UPDATE ON public.%I
                FOR EACH ROW EXECUTE FUNCTION public.set_updated_by();
            ', trigger_name, r.table_name, trigger_name, r.table_name);

            RAISE NOTICE 'Applied updated_by trigger to table: %', r.table_name;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the trigger application function
SELECT public.apply_audit_triggers();

-- ============================================================================
-- SECTION 5: SEED DATA
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 5.1: Default Countries
-- ---------------------------------------------------------------------------
INSERT INTO public.countries (id, code, name, currency_code, currency_symbol, date_format, is_active)
VALUES
    (gen_random_uuid(), 'US', 'United States', 'USD', '$', 'MM/DD/YYYY', true),
    (gen_random_uuid(), 'TR', 'Turkey', 'TRY', '₺', 'DD.MM.YYYY', true),
    (gen_random_uuid(), 'DE', 'Germany', 'EUR', '€', 'DD.MM.YYYY', true)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    currency_code = EXCLUDED.currency_code,
    currency_symbol = EXCLUDED.currency_symbol,
    date_format = EXCLUDED.date_format,
    is_active = EXCLUDED.is_active;

-- ---------------------------------------------------------------------------
-- 5.2: Default Subscription Plans
-- ---------------------------------------------------------------------------
INSERT INTO public.subscription_plans (
    id, name, slug, description, tier,
    member_limit, admin_limit, storage_limit_gb, features, is_active, sort_order
)
VALUES
    (
        gen_random_uuid(),
        'Free',
        'free',
        'Perfect for small mosques just getting started',
        0,
        100,
        2,
        1,
        '{"donations": true, "education": false, "cases": false, "umrah": false, "qurbani": false, "islamic_services": false, "api_access": false, "custom_domain": false, "white_label": false, "priority_support": false, "advanced_reports": false, "bank_reconciliation": false}'::JSONB,
        true,
        1
    ),
    (
        gen_random_uuid(),
        'Basic',
        'basic',
        'Essential features for growing communities',
        1,
        500,
        5,
        5,
        '{"donations": true, "education": true, "cases": true, "umrah": false, "qurbani": false, "islamic_services": true, "api_access": false, "custom_domain": false, "white_label": false, "priority_support": false, "advanced_reports": false, "bank_reconciliation": false}'::JSONB,
        true,
        2
    ),
    (
        gen_random_uuid(),
        'Pro',
        'pro',
        'Advanced features for established mosques',
        2,
        2000,
        15,
        25,
        '{"donations": true, "education": true, "cases": true, "umrah": true, "qurbani": true, "islamic_services": true, "api_access": false, "custom_domain": true, "white_label": false, "priority_support": true, "advanced_reports": true, "bank_reconciliation": true}'::JSONB,
        true,
        3
    ),
    (
        gen_random_uuid(),
        'Enterprise',
        'enterprise',
        'Unlimited access for large organizations',
        3,
        NULL,
        NULL,
        100,
        '{"donations": true, "education": true, "cases": true, "umrah": true, "qurbani": true, "islamic_services": true, "api_access": true, "custom_domain": true, "white_label": true, "priority_support": true, "advanced_reports": true, "bank_reconciliation": true}'::JSONB,
        true,
        4
    )
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    tier = EXCLUDED.tier,
    member_limit = EXCLUDED.member_limit,
    admin_limit = EXCLUDED.admin_limit,
    storage_limit_gb = EXCLUDED.storage_limit_gb,
    features = EXCLUDED.features,
    is_active = EXCLUDED.is_active,
    sort_order = EXCLUDED.sort_order;

-- ---------------------------------------------------------------------------
-- 5.3: Default Islamic Service Types (COMMENTED OUT - table doesn't exist yet)
-- ---------------------------------------------------------------------------
/* INSERT INTO public.islamic_service_types (id, name, slug, description, default_fee, requires_witnesses, requires_documentation, is_active)
VALUES
    (
        gen_random_uuid(),
        'Nikah (Marriage)',
        'nikah',
        'Islamic marriage ceremony performed by the imam',
        150.00,
        true,
        true,
        true
    ),
    (
        gen_random_uuid(),
        'Janazah (Funeral)',
        'janazah',
        'Islamic funeral prayer and burial services',
        0.00,
        false,
        true,
        true
    ),
    (
        gen_random_uuid(),
        'Shahada (Conversion)',
        'shahada',
        'Declaration of faith for those converting to Islam',
        0.00,
        true,
        true,
        true
    )
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    default_fee = EXCLUDED.default_fee,
    requires_witnesses = EXCLUDED.requires_witnesses,
    requires_documentation = EXCLUDED.requires_documentation,
    is_active = EXCLUDED.is_active;
*/

-- ---------------------------------------------------------------------------
-- 5.4: Default Permissions (All Modules - COMMENTED OUT - table doesn't exist yet)
-- ---------------------------------------------------------------------------
/*

-- Create permissions for all modules
DO $$
DECLARE
    modules TEXT[] := ARRAY[
        'dashboard',
        'members',
        'households',
        'donations',
        'events',
        'classes',
        'islamic_services',
        'volunteers',
        'announcements',
        'documents',
        'reports',
        'settings',
        'users',
        'roles',
        'billing',
        'integrations',
        'audit_logs'
    ];
    actions TEXT[] := ARRAY['view', 'create', 'update', 'delete', 'export', 'manage'];
    m TEXT;
    a TEXT;
    perm_name TEXT;
    perm_slug TEXT;
    perm_desc TEXT;
BEGIN
    FOREACH m IN ARRAY modules
    LOOP
        FOREACH a IN ARRAY actions
        LOOP
            perm_slug := m || '.' || a;
            perm_name := INITCAP(REPLACE(m, '_', ' ')) || ' - ' || INITCAP(a);
            perm_desc := 'Permission to ' || a || ' ' || REPLACE(m, '_', ' ');

            INSERT INTO public.permissions (id, name, slug, description, module, action, is_active)
            VALUES (
                gen_random_uuid(),
                perm_name,
                perm_slug,
                perm_desc,
                m,
                a,
                true
            )
            ON CONFLICT (slug) DO UPDATE SET
                name = EXCLUDED.name,
                description = EXCLUDED.description,
                module = EXCLUDED.module,
                action = EXCLUDED.action,
                is_active = EXCLUDED.is_active;
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Inserted permissions for % modules', array_length(modules, 1);
END $$;
*/

-- ---------------------------------------------------------------------------
-- 5.5: Default System Roles (COMMENTED OUT - table doesn't exist yet)
-- ---------------------------------------------------------------------------
/* INSERT INTO public.system_roles (id, name, slug, description, is_system_role, is_active, sort_order)
VALUES
    (
        gen_random_uuid(),
        'Super Admin',
        'super_admin',
        'Full system access across all organizations',
        true,
        true,
        1
    ),
    (
        gen_random_uuid(),
        'Organization Admin',
        'org_admin',
        'Full access within their organization',
        true,
        true,
        2
    ),
    (
        gen_random_uuid(),
        'Manager',
        'manager',
        'Can manage most resources within their organization',
        true,
        true,
        3
    ),
    (
        gen_random_uuid(),
        'Staff',
        'staff',
        'Limited access to assigned modules',
        true,
        true,
        4
    ),
    (
        gen_random_uuid(),
        'Volunteer',
        'volunteer',
        'Read-only access to relevant information',
        true,
        true,
        5
    ),
    (
        gen_random_uuid(),
        'Member',
        'member',
        'Basic member access - view own profile and public information',
        true,
        true,
        6
    )
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_system_role = EXCLUDED.is_system_role,
    is_active = EXCLUDED.is_active,
    sort_order = EXCLUDED.sort_order;
*/

-- ============================================================================
-- SECTION 6: ROW LEVEL SECURITY FOR AUDIT LOG
-- ============================================================================

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Platform admins and authenticated users can view audit logs
-- TODO: Update this policy when user_organizations and organization_roles tables are created
CREATE POLICY "audit_log_select" ON public.audit_log
    FOR SELECT
    USING (
        -- Platform admins can see all
        public.is_platform_admin(auth.uid())
        OR
        -- For now, allow users to see audit logs for their organization
        -- This will be updated when permission system is fully implemented
        auth.uid() IS NOT NULL
    );

-- Policy: No direct inserts (only via trigger)
CREATE POLICY "audit_log_no_direct_insert" ON public.audit_log
    FOR INSERT
    WITH CHECK (false);

-- Policy: No updates allowed
CREATE POLICY "audit_log_no_update" ON public.audit_log
    FOR UPDATE
    USING (false);

-- Policy: No deletes allowed (audit logs are immutable)
CREATE POLICY "audit_log_no_delete" ON public.audit_log
    FOR DELETE
    USING (false);

-- ============================================================================
-- SECTION 7: HELPER VIEWS
-- ============================================================================

-- View for recent audit activity
CREATE OR REPLACE VIEW public.recent_audit_activity AS
SELECT
    al.id,
    al.organization_id,
    o.name AS organization_name,
    al.table_name,
    al.record_id,
    al.action,
    al.changed_fields,
    al.user_id,
    al.user_email,
    al.created_at
FROM public.audit_log al
LEFT JOIN public.organizations o ON al.organization_id = o.id
ORDER BY al.created_at DESC
LIMIT 100;

-- View for audit statistics by table
CREATE OR REPLACE VIEW public.audit_statistics AS
SELECT
    table_name,
    action,
    COUNT(*) AS total_count,
    COUNT(DISTINCT user_id) AS unique_users,
    MIN(created_at) AS first_activity,
    MAX(created_at) AS last_activity
FROM public.audit_log
GROUP BY table_name, action
ORDER BY table_name, action;

-- ============================================================================
-- SECTION 8: UTILITY FUNCTIONS
-- ============================================================================

-- Function to get audit history for a specific record
CREATE OR REPLACE FUNCTION public.get_audit_history(
    p_table_name VARCHAR,
    p_record_id UUID,
    p_limit INT DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    action VARCHAR,
    old_data JSONB,
    new_data JSONB,
    changed_fields TEXT[],
    user_email VARCHAR,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        al.id,
        al.action,
        al.old_data,
        al.new_data,
        al.changed_fields,
        al.user_email,
        al.created_at
    FROM public.audit_log al
    WHERE al.table_name = p_table_name
    AND al.record_id = p_record_id
    ORDER BY al.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to purge old audit logs (for maintenance)
CREATE OR REPLACE FUNCTION public.purge_old_audit_logs(
    p_days_to_keep INT DEFAULT 365
)
RETURNS INT AS $$
DECLARE
    v_deleted_count INT;
BEGIN
    -- Only allow platform admins to run this
    -- TODO: Update when user role system is implemented
    IF NOT public.is_platform_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Only platform admins can purge audit logs';
    END IF;

    DELETE FROM public.audit_log
    WHERE created_at < NOW() - (p_days_to_keep || ' days')::INTERVAL;

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_audit_history IS 'Retrieves audit history for a specific record';
COMMENT ON FUNCTION public.purge_old_audit_logs IS 'Purges audit logs older than specified days (super admin only)';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
