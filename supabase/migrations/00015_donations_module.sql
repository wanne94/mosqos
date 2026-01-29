-- ============================================================================
-- MOSQOS - MIGRATION 00015: DONATIONS MODULE
-- Description: Core finance tables for funds, donations, recurring donations, pledges
-- ============================================================================

-- ============================================================================
-- SECTION 1: FUNDS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.funds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Fund identity
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Fund type (Islamic fund categories)
    fund_type VARCHAR(50) DEFAULT 'general' CHECK (
        fund_type IN ('general', 'zakat', 'sadaqah', 'building', 'education', 'emergency', 'charity', 'special')
    ),

    -- Goal tracking
    goal_amount DECIMAL(12,2),
    current_amount DECIMAL(12,2) DEFAULT 0,

    -- Period
    start_date DATE,
    end_date DATE,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes for funds
CREATE INDEX IF NOT EXISTS idx_funds_organization_id ON public.funds(organization_id);
CREATE INDEX IF NOT EXISTS idx_funds_fund_type ON public.funds(organization_id, fund_type);
CREATE INDEX IF NOT EXISTS idx_funds_active ON public.funds(organization_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_funds_name ON public.funds(organization_id, name);

-- Triggers for funds
DROP TRIGGER IF EXISTS set_updated_at_funds ON public.funds;
CREATE TRIGGER set_updated_at_funds
    BEFORE UPDATE ON public.funds
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_created_by_funds ON public.funds;
CREATE TRIGGER set_created_by_funds
    BEFORE INSERT ON public.funds
    FOR EACH ROW
    EXECUTE FUNCTION public.set_created_by();

DROP TRIGGER IF EXISTS set_updated_by_funds ON public.funds;
CREATE TRIGGER set_updated_by_funds
    BEFORE UPDATE ON public.funds
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_by();

-- Comments
COMMENT ON TABLE public.funds IS 'Donation fund categories (Zakat, Sadaqah, Building, etc.)';
COMMENT ON COLUMN public.funds.fund_type IS 'Type of fund: general, zakat, sadaqah, building, education, emergency, charity, special';
COMMENT ON COLUMN public.funds.goal_amount IS 'Target amount to raise for this fund';
COMMENT ON COLUMN public.funds.current_amount IS 'Total amount currently raised';

-- ============================================================================
-- SECTION 2: DONATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Donor (optional for anonymous)
    member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,

    -- Fund allocation
    fund_id UUID REFERENCES public.funds(id) ON DELETE SET NULL,

    -- Related records
    pledge_id UUID,  -- Will reference pledges table
    recurring_donation_id UUID,  -- Will reference recurring_donations table

    -- Amount
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'USD',

    -- Donation details
    donation_type VARCHAR(50) DEFAULT 'one_time' CHECK (
        donation_type IN ('one_time', 'recurring', 'pledge_payment')
    ),
    payment_method VARCHAR(50) CHECK (
        payment_method IN ('cash', 'check', 'card', 'bank_transfer', 'online', 'other')
    ),
    status VARCHAR(50) DEFAULT 'completed' CHECK (
        status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')
    ),

    -- Date
    donation_date DATE DEFAULT CURRENT_DATE,

    -- References
    reference_number VARCHAR(100),
    check_number VARCHAR(50),
    transaction_id VARCHAR(255),
    receipt_number VARCHAR(100),

    -- Stripe integration
    payment_intent_id VARCHAR(255),
    bank_transaction_id UUID,  -- For bank reconciliation

    -- Flags
    is_anonymous BOOLEAN DEFAULT FALSE,
    is_tax_deductible BOOLEAN DEFAULT TRUE,
    receipt_sent BOOLEAN DEFAULT FALSE,
    receipt_sent_at TIMESTAMPTZ,

    -- Notes
    notes TEXT,

    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes for donations
CREATE INDEX IF NOT EXISTS idx_donations_organization_id ON public.donations(organization_id);
CREATE INDEX IF NOT EXISTS idx_donations_member_id ON public.donations(member_id) WHERE member_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_donations_fund_id ON public.donations(fund_id) WHERE fund_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_donations_pledge_id ON public.donations(pledge_id) WHERE pledge_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_donations_recurring_id ON public.donations(recurring_donation_id) WHERE recurring_donation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_donations_date ON public.donations(organization_id, donation_date DESC);
CREATE INDEX IF NOT EXISTS idx_donations_status ON public.donations(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_donations_type ON public.donations(organization_id, donation_type);
CREATE INDEX IF NOT EXISTS idx_donations_payment_method ON public.donations(organization_id, payment_method);
CREATE INDEX IF NOT EXISTS idx_donations_payment_intent ON public.donations(payment_intent_id) WHERE payment_intent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_donations_receipt ON public.donations(organization_id, receipt_number) WHERE receipt_number IS NOT NULL;

-- Triggers for donations
DROP TRIGGER IF EXISTS set_updated_at_donations ON public.donations;
CREATE TRIGGER set_updated_at_donations
    BEFORE UPDATE ON public.donations
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_created_by_donations ON public.donations;
CREATE TRIGGER set_created_by_donations
    BEFORE INSERT ON public.donations
    FOR EACH ROW
    EXECUTE FUNCTION public.set_created_by();

DROP TRIGGER IF EXISTS set_updated_by_donations ON public.donations;
CREATE TRIGGER set_updated_by_donations
    BEFORE UPDATE ON public.donations
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_by();

-- Comments
COMMENT ON TABLE public.donations IS 'Individual donation transactions';
COMMENT ON COLUMN public.donations.donation_type IS 'Type: one_time, recurring, pledge_payment';
COMMENT ON COLUMN public.donations.payment_method IS 'Payment method: cash, check, card, bank_transfer, online, other';
COMMENT ON COLUMN public.donations.status IS 'Transaction status: pending, completed, failed, refunded, cancelled';
COMMENT ON COLUMN public.donations.payment_intent_id IS 'Stripe PaymentIntent ID for card payments';
COMMENT ON COLUMN public.donations.receipt_number IS 'Generated receipt number (RCP-YYYY-NNNNN format)';

-- ============================================================================
-- SECTION 3: RECURRING DONATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.recurring_donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Donor
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,

    -- Fund allocation
    fund_id UUID REFERENCES public.funds(id) ON DELETE SET NULL,

    -- Amount
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'USD',

    -- Schedule
    frequency VARCHAR(50) NOT NULL CHECK (
        frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'annually')
    ),
    start_date DATE NOT NULL,
    end_date DATE,
    next_payment_date DATE,
    last_payment_date DATE,

    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (
        status IN ('active', 'paused', 'cancelled', 'completed')
    ),

    -- Payment method
    payment_method VARCHAR(50) CHECK (
        payment_method IN ('cash', 'check', 'card', 'bank_transfer', 'online', 'other')
    ),

    -- Stripe integration
    stripe_subscription_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),

    -- Tracking
    total_collected DECIMAL(12,2) DEFAULT 0,
    donation_count INTEGER DEFAULT 0,

    -- Notes
    notes TEXT,

    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes for recurring_donations
CREATE INDEX IF NOT EXISTS idx_recurring_donations_organization_id ON public.recurring_donations(organization_id);
CREATE INDEX IF NOT EXISTS idx_recurring_donations_member_id ON public.recurring_donations(member_id);
CREATE INDEX IF NOT EXISTS idx_recurring_donations_fund_id ON public.recurring_donations(fund_id) WHERE fund_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_recurring_donations_status ON public.recurring_donations(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_recurring_donations_next_payment ON public.recurring_donations(next_payment_date) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_recurring_donations_stripe_sub ON public.recurring_donations(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_recurring_donations_stripe_cust ON public.recurring_donations(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- Triggers for recurring_donations
DROP TRIGGER IF EXISTS set_updated_at_recurring_donations ON public.recurring_donations;
CREATE TRIGGER set_updated_at_recurring_donations
    BEFORE UPDATE ON public.recurring_donations
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_created_by_recurring_donations ON public.recurring_donations;
CREATE TRIGGER set_created_by_recurring_donations
    BEFORE INSERT ON public.recurring_donations
    FOR EACH ROW
    EXECUTE FUNCTION public.set_created_by();

DROP TRIGGER IF EXISTS set_updated_by_recurring_donations ON public.recurring_donations;
CREATE TRIGGER set_updated_by_recurring_donations
    BEFORE UPDATE ON public.recurring_donations
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_by();

-- Comments
COMMENT ON TABLE public.recurring_donations IS 'Recurring donation subscriptions';
COMMENT ON COLUMN public.recurring_donations.frequency IS 'Payment frequency: weekly, biweekly, monthly, quarterly, annually';
COMMENT ON COLUMN public.recurring_donations.stripe_subscription_id IS 'Stripe Subscription ID for automated billing';
COMMENT ON COLUMN public.recurring_donations.total_collected IS 'Running total of all payments made';

-- ============================================================================
-- SECTION 4: PLEDGES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.pledges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Donor
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,

    -- Fund allocation
    fund_id UUID REFERENCES public.funds(id) ON DELETE SET NULL,

    -- Amount
    total_amount DECIMAL(12,2) NOT NULL CHECK (total_amount > 0),
    paid_amount DECIMAL(12,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',

    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (
        status IN ('active', 'completed', 'cancelled', 'overdue')
    ),

    -- Dates
    pledge_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,

    -- Payment schedule (JSONB array of schedule items)
    payment_schedule JSONB DEFAULT '[]'::JSONB,

    -- Notes
    notes TEXT,

    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes for pledges
CREATE INDEX IF NOT EXISTS idx_pledges_organization_id ON public.pledges(organization_id);
CREATE INDEX IF NOT EXISTS idx_pledges_member_id ON public.pledges(member_id);
CREATE INDEX IF NOT EXISTS idx_pledges_fund_id ON public.pledges(fund_id) WHERE fund_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pledges_status ON public.pledges(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_pledges_due_date ON public.pledges(due_date) WHERE status = 'active';

-- Triggers for pledges
DROP TRIGGER IF EXISTS set_updated_at_pledges ON public.pledges;
CREATE TRIGGER set_updated_at_pledges
    BEFORE UPDATE ON public.pledges
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_created_by_pledges ON public.pledges;
CREATE TRIGGER set_created_by_pledges
    BEFORE INSERT ON public.pledges
    FOR EACH ROW
    EXECUTE FUNCTION public.set_created_by();

DROP TRIGGER IF EXISTS set_updated_by_pledges ON public.pledges;
CREATE TRIGGER set_updated_by_pledges
    BEFORE UPDATE ON public.pledges
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_by();

-- Comments
COMMENT ON TABLE public.pledges IS 'Donation pledges with payment schedules';
COMMENT ON COLUMN public.pledges.payment_schedule IS 'JSON array of payment schedule items: [{due_date, amount, paid, paid_date, donation_id}]';
COMMENT ON COLUMN public.pledges.status IS 'Pledge status: active, completed, cancelled, overdue';

-- Add foreign key references now that pledges exists
ALTER TABLE public.donations
    DROP CONSTRAINT IF EXISTS donations_pledge_id_fkey;
ALTER TABLE public.donations
    ADD CONSTRAINT donations_pledge_id_fkey
    FOREIGN KEY (pledge_id) REFERENCES public.pledges(id) ON DELETE SET NULL;

ALTER TABLE public.donations
    DROP CONSTRAINT IF EXISTS donations_recurring_donation_id_fkey;
ALTER TABLE public.donations
    ADD CONSTRAINT donations_recurring_donation_id_fkey
    FOREIGN KEY (recurring_donation_id) REFERENCES public.recurring_donations(id) ON DELETE SET NULL;

-- ============================================================================
-- SECTION 5: BANK TRANSACTIONS TABLE (for reconciliation)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.bank_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Bank account (future extension)
    bank_account_id UUID,

    -- Transaction details
    transaction_date DATE NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    transaction_type VARCHAR(10) NOT NULL CHECK (transaction_type IN ('credit', 'debit')),
    reference VARCHAR(255),

    -- Matching status
    match_status VARCHAR(50) DEFAULT 'unmatched' CHECK (
        match_status IN ('unmatched', 'matched', 'ignored', 'manually_created')
    ),
    matched_donation_id UUID REFERENCES public.donations(id) ON DELETE SET NULL,

    -- Import tracking
    imported_at TIMESTAMPTZ DEFAULT NOW(),
    raw_data JSONB,

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for bank_transactions
CREATE INDEX IF NOT EXISTS idx_bank_transactions_organization_id ON public.bank_transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_date ON public.bank_transactions(organization_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_match_status ON public.bank_transactions(organization_id, match_status);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_matched ON public.bank_transactions(matched_donation_id) WHERE matched_donation_id IS NOT NULL;

-- Comments
COMMENT ON TABLE public.bank_transactions IS 'Imported bank transactions for reconciliation with donations';
COMMENT ON COLUMN public.bank_transactions.match_status IS 'Reconciliation status: unmatched, matched, ignored, manually_created';
COMMENT ON COLUMN public.bank_transactions.raw_data IS 'Original import data as JSON';

-- Add foreign key reference to donations
ALTER TABLE public.donations
    DROP CONSTRAINT IF EXISTS donations_bank_transaction_id_fkey;
ALTER TABLE public.donations
    ADD CONSTRAINT donations_bank_transaction_id_fkey
    FOREIGN KEY (bank_transaction_id) REFERENCES public.bank_transactions(id) ON DELETE SET NULL;

-- ============================================================================
-- SECTION 6: ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE public.funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pledges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;

-- Funds policies
CREATE POLICY "funds_select_org" ON public.funds
    FOR SELECT TO authenticated
    USING (public.user_belongs_to_organization(organization_id));

CREATE POLICY "funds_insert_org" ON public.funds
    FOR INSERT TO authenticated
    WITH CHECK (public.user_belongs_to_organization(organization_id));

CREATE POLICY "funds_update_org" ON public.funds
    FOR UPDATE TO authenticated
    USING (public.user_belongs_to_organization(organization_id))
    WITH CHECK (public.user_belongs_to_organization(organization_id));

CREATE POLICY "funds_delete_org" ON public.funds
    FOR DELETE TO authenticated
    USING (public.user_belongs_to_organization(organization_id));

CREATE POLICY "funds_platform_admin" ON public.funds
    FOR ALL TO authenticated
    USING (public.is_platform_admin())
    WITH CHECK (public.is_platform_admin());

-- Donations policies
CREATE POLICY "donations_select_org" ON public.donations
    FOR SELECT TO authenticated
    USING (public.user_belongs_to_organization(organization_id));

CREATE POLICY "donations_insert_org" ON public.donations
    FOR INSERT TO authenticated
    WITH CHECK (public.user_belongs_to_organization(organization_id));

CREATE POLICY "donations_update_org" ON public.donations
    FOR UPDATE TO authenticated
    USING (public.user_belongs_to_organization(organization_id))
    WITH CHECK (public.user_belongs_to_organization(organization_id));

CREATE POLICY "donations_delete_org" ON public.donations
    FOR DELETE TO authenticated
    USING (public.user_belongs_to_organization(organization_id));

CREATE POLICY "donations_platform_admin" ON public.donations
    FOR ALL TO authenticated
    USING (public.is_platform_admin())
    WITH CHECK (public.is_platform_admin());

-- Recurring donations policies
CREATE POLICY "recurring_donations_select_org" ON public.recurring_donations
    FOR SELECT TO authenticated
    USING (public.user_belongs_to_organization(organization_id));

CREATE POLICY "recurring_donations_insert_org" ON public.recurring_donations
    FOR INSERT TO authenticated
    WITH CHECK (public.user_belongs_to_organization(organization_id));

CREATE POLICY "recurring_donations_update_org" ON public.recurring_donations
    FOR UPDATE TO authenticated
    USING (public.user_belongs_to_organization(organization_id))
    WITH CHECK (public.user_belongs_to_organization(organization_id));

CREATE POLICY "recurring_donations_delete_org" ON public.recurring_donations
    FOR DELETE TO authenticated
    USING (public.user_belongs_to_organization(organization_id));

CREATE POLICY "recurring_donations_platform_admin" ON public.recurring_donations
    FOR ALL TO authenticated
    USING (public.is_platform_admin())
    WITH CHECK (public.is_platform_admin());

-- Pledges policies
CREATE POLICY "pledges_select_org" ON public.pledges
    FOR SELECT TO authenticated
    USING (public.user_belongs_to_organization(organization_id));

CREATE POLICY "pledges_insert_org" ON public.pledges
    FOR INSERT TO authenticated
    WITH CHECK (public.user_belongs_to_organization(organization_id));

CREATE POLICY "pledges_update_org" ON public.pledges
    FOR UPDATE TO authenticated
    USING (public.user_belongs_to_organization(organization_id))
    WITH CHECK (public.user_belongs_to_organization(organization_id));

CREATE POLICY "pledges_delete_org" ON public.pledges
    FOR DELETE TO authenticated
    USING (public.user_belongs_to_organization(organization_id));

CREATE POLICY "pledges_platform_admin" ON public.pledges
    FOR ALL TO authenticated
    USING (public.is_platform_admin())
    WITH CHECK (public.is_platform_admin());

-- Bank transactions policies
CREATE POLICY "bank_transactions_select_org" ON public.bank_transactions
    FOR SELECT TO authenticated
    USING (public.user_belongs_to_organization(organization_id));

CREATE POLICY "bank_transactions_insert_org" ON public.bank_transactions
    FOR INSERT TO authenticated
    WITH CHECK (public.user_belongs_to_organization(organization_id));

CREATE POLICY "bank_transactions_update_org" ON public.bank_transactions
    FOR UPDATE TO authenticated
    USING (public.user_belongs_to_organization(organization_id))
    WITH CHECK (public.user_belongs_to_organization(organization_id));

CREATE POLICY "bank_transactions_delete_org" ON public.bank_transactions
    FOR DELETE TO authenticated
    USING (public.user_belongs_to_organization(organization_id));

CREATE POLICY "bank_transactions_platform_admin" ON public.bank_transactions
    FOR ALL TO authenticated
    USING (public.is_platform_admin())
    WITH CHECK (public.is_platform_admin());

-- ============================================================================
-- SECTION 7: GRANTS
-- ============================================================================

GRANT ALL ON public.funds TO service_role;
GRANT ALL ON public.donations TO service_role;
GRANT ALL ON public.recurring_donations TO service_role;
GRANT ALL ON public.pledges TO service_role;
GRANT ALL ON public.bank_transactions TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.funds TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.donations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recurring_donations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pledges TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bank_transactions TO authenticated;

-- ============================================================================
-- SECTION 8: AUDIT TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS audit_trigger_funds ON public.funds;
CREATE TRIGGER audit_trigger_funds
    AFTER INSERT OR UPDATE OR DELETE ON public.funds
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

DROP TRIGGER IF EXISTS audit_trigger_donations ON public.donations;
CREATE TRIGGER audit_trigger_donations
    AFTER INSERT OR UPDATE OR DELETE ON public.donations
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

DROP TRIGGER IF EXISTS audit_trigger_recurring_donations ON public.recurring_donations;
CREATE TRIGGER audit_trigger_recurring_donations
    AFTER INSERT OR UPDATE OR DELETE ON public.recurring_donations
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

DROP TRIGGER IF EXISTS audit_trigger_pledges ON public.pledges;
CREATE TRIGGER audit_trigger_pledges
    AFTER INSERT OR UPDATE OR DELETE ON public.pledges
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- ============================================================================
-- END OF MIGRATION 00015
-- ============================================================================
