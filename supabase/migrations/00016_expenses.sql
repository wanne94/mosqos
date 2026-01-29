-- ============================================================================
-- MOSQOS - MIGRATION 00016: EXPENSES MODULE
-- Description: Expense tracking and categorization
-- ============================================================================

-- ============================================================================
-- SECTION 1: EXPENSES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Fund allocation (expenses reduce fund balance)
    fund_id UUID REFERENCES public.funds(id) ON DELETE SET NULL,

    -- Amount
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'USD',

    -- Date
    expense_date DATE DEFAULT CURRENT_DATE,

    -- Categorization
    category VARCHAR(100),
    description TEXT,

    -- Vendor/payee info
    vendor VARCHAR(255),
    vendor_contact VARCHAR(255),

    -- Payment details
    payment_method VARCHAR(50) CHECK (
        payment_method IN ('cash', 'check', 'card', 'bank_transfer', 'online', 'other')
    ),
    check_number VARCHAR(50),
    reference_number VARCHAR(100),

    -- Documentation
    receipt_url TEXT,
    receipt_date DATE,

    -- Approval workflow
    status VARCHAR(50) DEFAULT 'pending' CHECK (
        status IN ('pending', 'approved', 'rejected', 'paid', 'cancelled')
    ),
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,

    -- Notes
    notes TEXT,

    -- Related case (for case-based expenses)
    service_case_id UUID,  -- Will reference service_cases table

    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes for expenses
CREATE INDEX IF NOT EXISTS idx_expenses_organization_id ON public.expenses(organization_id);
CREATE INDEX IF NOT EXISTS idx_expenses_fund_id ON public.expenses(fund_id) WHERE fund_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(organization_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(organization_id, category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_expenses_vendor ON public.expenses(organization_id, vendor) WHERE vendor IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_expenses_status ON public.expenses(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_expenses_payment_method ON public.expenses(organization_id, payment_method);
CREATE INDEX IF NOT EXISTS idx_expenses_case ON public.expenses(service_case_id) WHERE service_case_id IS NOT NULL;

-- Triggers for expenses
DROP TRIGGER IF EXISTS set_updated_at_expenses ON public.expenses;
CREATE TRIGGER set_updated_at_expenses
    BEFORE UPDATE ON public.expenses
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_created_by_expenses ON public.expenses;
CREATE TRIGGER set_created_by_expenses
    BEFORE INSERT ON public.expenses
    FOR EACH ROW
    EXECUTE FUNCTION public.set_created_by();

DROP TRIGGER IF EXISTS set_updated_by_expenses ON public.expenses;
CREATE TRIGGER set_updated_by_expenses
    BEFORE UPDATE ON public.expenses
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_by();

-- Comments
COMMENT ON TABLE public.expenses IS 'Expense transactions and tracking';
COMMENT ON COLUMN public.expenses.category IS 'Expense category (utilities, maintenance, supplies, etc.)';
COMMENT ON COLUMN public.expenses.status IS 'Approval status: pending, approved, rejected, paid, cancelled';
COMMENT ON COLUMN public.expenses.service_case_id IS 'Link to service case if expense is case-related';
COMMENT ON COLUMN public.expenses.receipt_url IS 'URL to uploaded receipt document';

-- ============================================================================
-- SECTION 2: EXPENSE CATEGORIES TABLE (Optional - for predefined categories)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Category info
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES public.expense_categories(id) ON DELETE SET NULL,

    -- Display
    color VARCHAR(7),  -- Hex color
    icon VARCHAR(50),
    sort_order INTEGER DEFAULT 0,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for expense_categories
CREATE INDEX IF NOT EXISTS idx_expense_categories_organization_id ON public.expense_categories(organization_id);
CREATE INDEX IF NOT EXISTS idx_expense_categories_parent ON public.expense_categories(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_expense_categories_active ON public.expense_categories(organization_id, is_active) WHERE is_active = TRUE;

-- Trigger for expense_categories updated_at
DROP TRIGGER IF EXISTS set_updated_at_expense_categories ON public.expense_categories;
CREATE TRIGGER set_updated_at_expense_categories
    BEFORE UPDATE ON public.expense_categories
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- Comments
COMMENT ON TABLE public.expense_categories IS 'Predefined expense categories per organization';
COMMENT ON COLUMN public.expense_categories.parent_id IS 'Parent category for hierarchical categorization';

-- ============================================================================
-- SECTION 3: ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

-- Expenses policies
CREATE POLICY "expenses_select_org" ON public.expenses
    FOR SELECT TO authenticated
    USING (public.user_belongs_to_organization(organization_id));

CREATE POLICY "expenses_insert_org" ON public.expenses
    FOR INSERT TO authenticated
    WITH CHECK (public.user_belongs_to_organization(organization_id));

CREATE POLICY "expenses_update_org" ON public.expenses
    FOR UPDATE TO authenticated
    USING (public.user_belongs_to_organization(organization_id))
    WITH CHECK (public.user_belongs_to_organization(organization_id));

CREATE POLICY "expenses_delete_org" ON public.expenses
    FOR DELETE TO authenticated
    USING (public.user_belongs_to_organization(organization_id));

CREATE POLICY "expenses_platform_admin" ON public.expenses
    FOR ALL TO authenticated
    USING (public.is_platform_admin())
    WITH CHECK (public.is_platform_admin());

-- Expense categories policies
CREATE POLICY "expense_categories_select_org" ON public.expense_categories
    FOR SELECT TO authenticated
    USING (public.user_belongs_to_organization(organization_id));

CREATE POLICY "expense_categories_insert_org" ON public.expense_categories
    FOR INSERT TO authenticated
    WITH CHECK (public.user_belongs_to_organization(organization_id));

CREATE POLICY "expense_categories_update_org" ON public.expense_categories
    FOR UPDATE TO authenticated
    USING (public.user_belongs_to_organization(organization_id))
    WITH CHECK (public.user_belongs_to_organization(organization_id));

CREATE POLICY "expense_categories_delete_org" ON public.expense_categories
    FOR DELETE TO authenticated
    USING (public.user_belongs_to_organization(organization_id));

CREATE POLICY "expense_categories_platform_admin" ON public.expense_categories
    FOR ALL TO authenticated
    USING (public.is_platform_admin())
    WITH CHECK (public.is_platform_admin());

-- ============================================================================
-- SECTION 4: GRANTS
-- ============================================================================

GRANT ALL ON public.expenses TO service_role;
GRANT ALL ON public.expense_categories TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expense_categories TO authenticated;

-- ============================================================================
-- SECTION 5: AUDIT TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS audit_trigger_expenses ON public.expenses;
CREATE TRIGGER audit_trigger_expenses
    AFTER INSERT OR UPDATE OR DELETE ON public.expenses
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- ============================================================================
-- SECTION 6: DEFAULT EXPENSE CATEGORIES SEED
-- ============================================================================

-- Function to seed default expense categories for new organizations
CREATE OR REPLACE FUNCTION public.seed_default_expense_categories(p_organization_id UUID)
RETURNS void AS $$
DECLARE
    v_categories TEXT[] := ARRAY[
        'Utilities',
        'Maintenance',
        'Supplies',
        'Payroll',
        'Insurance',
        'Professional Services',
        'Office Expenses',
        'Events',
        'Education',
        'Charity/Zakat Distribution',
        'Other'
    ];
    v_category TEXT;
BEGIN
    FOREACH v_category IN ARRAY v_categories
    LOOP
        INSERT INTO public.expense_categories (organization_id, name)
        VALUES (p_organization_id, v_category)
        ON CONFLICT DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.seed_default_expense_categories IS 'Seeds default expense categories for a new organization';

-- ============================================================================
-- END OF MIGRATION 00016
-- ============================================================================
