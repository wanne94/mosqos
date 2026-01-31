-- ============================================================================
-- MOSQOS - MIGRATION 00045: QURBANI (SACRIFICE) MODULE
-- Description: Qurbani campaign and share management for Eid al-Adha
-- ============================================================================

-- ============================================================================
-- SECTION 1: QURBANI CAMPAIGNS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.qurbani_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Campaign Identity
    name VARCHAR(255) NOT NULL,           -- "Qurbani 2026", "Eid al-Adha 1447H"
    description TEXT,
    year INTEGER NOT NULL,                -- Gregorian year
    hijri_year INTEGER,                   -- Hijri year (e.g., 1447)

    -- Important Dates
    registration_start DATE,
    registration_deadline DATE NOT NULL,
    slaughter_start_date DATE NOT NULL,   -- 10th Dhul Hijjah
    slaughter_end_date DATE NOT NULL,     -- 13th Dhul Hijjah
    distribution_start_date DATE,
    distribution_end_date DATE,

    -- Pricing (per share)
    sheep_price DECIMAL(12,2),
    cow_price DECIMAL(12,2),              -- Price per 1/7 share
    camel_price DECIMAL(12,2),            -- Price per 1/7 share
    currency VARCHAR(3) DEFAULT 'USD',

    -- Capacity
    sheep_capacity INTEGER,               -- Max sheep available
    cow_capacity INTEGER,                 -- Max cows (7 shares each)
    camel_capacity INTEGER,               -- Max camels (7 shares each)

    -- Computed availability (updated by trigger)
    sheep_available INTEGER,
    cow_shares_available INTEGER,
    camel_shares_available INTEGER,

    -- Distribution Options (what this mosque offers)
    allows_local_pickup BOOLEAN DEFAULT true,
    allows_full_charity BOOLEAN DEFAULT true,
    allows_overseas BOOLEAN DEFAULT false,
    overseas_countries JSONB DEFAULT '[]'::JSONB,  -- Countries available for overseas

    -- Pickup Location(s)
    pickup_locations JSONB DEFAULT '[]'::JSONB,   -- Array of {name, address, notes}

    -- Status
    status VARCHAR(50) DEFAULT 'draft' CHECK (
        status IN ('draft', 'open', 'closed', 'in_progress', 'completed', 'cancelled')
    ),

    -- Contact
    coordinator_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),

    -- Settings
    allow_guest_registration BOOLEAN DEFAULT true,
    require_full_payment BOOLEAN DEFAULT false,
    deposit_amount DECIMAL(12,2),

    -- Notes
    notes TEXT,
    terms_and_conditions TEXT,

    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes for qurbani_campaigns
CREATE INDEX IF NOT EXISTS idx_qurbani_campaigns_organization_id ON public.qurbani_campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_qurbani_campaigns_year ON public.qurbani_campaigns(organization_id, year);
CREATE INDEX IF NOT EXISTS idx_qurbani_campaigns_status ON public.qurbani_campaigns(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_qurbani_campaigns_dates ON public.qurbani_campaigns(organization_id, registration_deadline);
CREATE INDEX IF NOT EXISTS idx_qurbani_campaigns_open ON public.qurbani_campaigns(organization_id)
    WHERE status = 'open';

-- Triggers for qurbani_campaigns
DROP TRIGGER IF EXISTS set_updated_at_qurbani_campaigns ON public.qurbani_campaigns;
CREATE TRIGGER set_updated_at_qurbani_campaigns
    BEFORE UPDATE ON public.qurbani_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_created_by_qurbani_campaigns ON public.qurbani_campaigns;
CREATE TRIGGER set_created_by_qurbani_campaigns
    BEFORE INSERT ON public.qurbani_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION public.set_created_by();

DROP TRIGGER IF EXISTS set_updated_by_qurbani_campaigns ON public.qurbani_campaigns;
CREATE TRIGGER set_updated_by_qurbani_campaigns
    BEFORE UPDATE ON public.qurbani_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_by();

-- Comments
COMMENT ON TABLE public.qurbani_campaigns IS 'Qurbani (sacrifice) campaigns for Eid al-Adha';
COMMENT ON COLUMN public.qurbani_campaigns.status IS 'Campaign status: draft, open, closed, in_progress, completed, cancelled';
COMMENT ON COLUMN public.qurbani_campaigns.sheep_price IS 'Price per full sheep (1 share = full animal)';
COMMENT ON COLUMN public.qurbani_campaigns.cow_price IS 'Price per cow share (7 shares = 1 cow)';
COMMENT ON COLUMN public.qurbani_campaigns.camel_price IS 'Price per camel share (7 shares = 1 camel)';
COMMENT ON COLUMN public.qurbani_campaigns.overseas_countries IS 'JSON array of countries available for overseas distribution';
COMMENT ON COLUMN public.qurbani_campaigns.pickup_locations IS 'JSON array of pickup locations with name, address, notes';

-- ============================================================================
-- SECTION 2: QURBANI SHARES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.qurbani_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES public.qurbani_campaigns(id) ON DELETE CASCADE,

    -- Share Details
    share_number VARCHAR(50),              -- Auto-generated: QRB-2026-0001
    animal_type VARCHAR(20) NOT NULL CHECK (
        animal_type IN ('sheep', 'cow', 'camel')
    ),
    quantity INTEGER NOT NULL DEFAULT 1,   -- Number of shares (1 for sheep, 1-7 for cow/camel)

    -- Registrant (member OR guest)
    member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    -- Guest fields (if member_id is NULL)
    guest_name VARCHAR(255),
    guest_email VARCHAR(255),
    guest_phone VARCHAR(50),
    guest_address TEXT,

    -- Intention (on whose behalf)
    intention_type VARCHAR(50) DEFAULT 'self' CHECK (
        intention_type IN ('self', 'family', 'deceased', 'other')
    ),
    intention_names JSONB DEFAULT '[]'::JSONB,    -- Array of names for the intention
    intention_notes TEXT,

    -- Distribution Preference
    distribution_type VARCHAR(50) NOT NULL CHECK (
        distribution_type IN ('local_pickup', 'full_charity', 'overseas', 'hybrid')
    ),
    -- For hybrid: specify portions
    pickup_portion DECIMAL(3,2) DEFAULT 0,  -- 0.33 = 1/3
    charity_portion DECIMAL(3,2) DEFAULT 0,
    overseas_portion DECIMAL(3,2) DEFAULT 0,
    overseas_country VARCHAR(100),          -- If overseas selected

    -- Pickup Details (simple text fields)
    pickup_location VARCHAR(255),
    pickup_date DATE,
    pickup_time VARCHAR(50),           -- Simple text like "10:00 AM - 12:00 PM"
    pickup_notes TEXT,

    -- Payment
    unit_price DECIMAL(12,2) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,    -- unit_price * quantity
    amount_paid DECIMAL(12,2) DEFAULT 0,
    balance_due DECIMAL(12,2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (
        payment_status IN ('pending', 'deposit_paid', 'partial', 'paid', 'refunded')
    ),
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),
    payment_date DATE,

    -- Status
    status VARCHAR(50) DEFAULT 'pending' CHECK (
        status IN ('pending', 'confirmed', 'cancelled', 'completed', 'refunded')
    ),

    -- Processing Status (for admin tracking)
    processing_status VARCHAR(50) DEFAULT 'registered' CHECK (
        processing_status IN ('registered', 'slaughtered', 'processed', 'ready_for_pickup', 'distributed', 'completed')
    ),
    slaughtered_at TIMESTAMPTZ,
    distributed_at TIMESTAMPTZ,

    -- Cancellation
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    refund_amount DECIMAL(12,2),

    -- Notes
    notes TEXT,
    internal_notes TEXT,

    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes for qurbani_shares
CREATE INDEX IF NOT EXISTS idx_qurbani_shares_organization_id ON public.qurbani_shares(organization_id);
CREATE INDEX IF NOT EXISTS idx_qurbani_shares_campaign_id ON public.qurbani_shares(campaign_id);
CREATE INDEX IF NOT EXISTS idx_qurbani_shares_member_id ON public.qurbani_shares(member_id);
CREATE INDEX IF NOT EXISTS idx_qurbani_shares_status ON public.qurbani_shares(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_qurbani_shares_payment ON public.qurbani_shares(campaign_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_qurbani_shares_processing ON public.qurbani_shares(campaign_id, processing_status);
CREATE INDEX IF NOT EXISTS idx_qurbani_shares_animal_type ON public.qurbani_shares(campaign_id, animal_type);
CREATE INDEX IF NOT EXISTS idx_qurbani_shares_distribution ON public.qurbani_shares(campaign_id, distribution_type);
CREATE INDEX IF NOT EXISTS idx_qurbani_shares_number ON public.qurbani_shares(share_number)
    WHERE share_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_qurbani_shares_pickup_date ON public.qurbani_shares(campaign_id, pickup_date)
    WHERE pickup_date IS NOT NULL AND distribution_type IN ('local_pickup', 'hybrid');
CREATE INDEX IF NOT EXISTS idx_qurbani_shares_with_balance ON public.qurbani_shares(organization_id)
    WHERE balance_due > 0 AND status IN ('pending', 'confirmed');

-- Triggers for qurbani_shares
DROP TRIGGER IF EXISTS set_updated_at_qurbani_shares ON public.qurbani_shares;
CREATE TRIGGER set_updated_at_qurbani_shares
    BEFORE UPDATE ON public.qurbani_shares
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_created_by_qurbani_shares ON public.qurbani_shares;
CREATE TRIGGER set_created_by_qurbani_shares
    BEFORE INSERT ON public.qurbani_shares
    FOR EACH ROW
    EXECUTE FUNCTION public.set_created_by();

DROP TRIGGER IF EXISTS set_updated_by_qurbani_shares ON public.qurbani_shares;
CREATE TRIGGER set_updated_by_qurbani_shares
    BEFORE UPDATE ON public.qurbani_shares
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_by();

-- Comments
COMMENT ON TABLE public.qurbani_shares IS 'Individual Qurbani share registrations';
COMMENT ON COLUMN public.qurbani_shares.share_number IS 'Auto-generated share number (QRB-YYYY-NNNN)';
COMMENT ON COLUMN public.qurbani_shares.animal_type IS 'Type of animal: sheep, cow, camel';
COMMENT ON COLUMN public.qurbani_shares.quantity IS 'Number of shares (1 for sheep, 1-7 for cow/camel)';
COMMENT ON COLUMN public.qurbani_shares.intention_type IS 'On whose behalf: self, family, deceased, other';
COMMENT ON COLUMN public.qurbani_shares.intention_names IS 'JSON array of names for the sacrifice intention';
COMMENT ON COLUMN public.qurbani_shares.distribution_type IS 'How to distribute: local_pickup, full_charity, overseas, hybrid';
COMMENT ON COLUMN public.qurbani_shares.pickup_portion IS 'For hybrid: portion to pickup (0.33 = 1/3)';
COMMENT ON COLUMN public.qurbani_shares.status IS 'Share status: pending, confirmed, cancelled, completed, refunded';
COMMENT ON COLUMN public.qurbani_shares.processing_status IS 'Processing status: registered, slaughtered, processed, ready_for_pickup, distributed, completed';
COMMENT ON COLUMN public.qurbani_shares.payment_status IS 'Payment status: pending, deposit_paid, partial, paid, refunded';

-- ============================================================================
-- SECTION 3: AUTO-GENERATE SHARE NUMBER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_qurbani_share_number()
RETURNS TRIGGER AS $$
DECLARE
    v_campaign_year INTEGER;
    v_sequence INT;
BEGIN
    IF NEW.share_number IS NULL THEN
        -- Get campaign year
        SELECT year INTO v_campaign_year
        FROM public.qurbani_campaigns WHERE id = NEW.campaign_id;

        -- Get next sequence for this campaign
        SELECT COALESCE(MAX(
            CAST(
                SUBSTRING(share_number FROM 'QRB-\d+-(\d+)')
                AS INTEGER
            )
        ), 0) + 1
        INTO v_sequence
        FROM public.qurbani_shares
        WHERE campaign_id = NEW.campaign_id;

        NEW.share_number := 'QRB-' || COALESCE(v_campaign_year, EXTRACT(YEAR FROM NOW())::INTEGER) || '-' || LPAD(v_sequence::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS generate_qurbani_share_number_trigger ON public.qurbani_shares;
CREATE TRIGGER generate_qurbani_share_number_trigger
    BEFORE INSERT ON public.qurbani_shares
    FOR EACH ROW
    EXECUTE FUNCTION public.generate_qurbani_share_number();

-- ============================================================================
-- SECTION 4: UPDATE CAMPAIGN AVAILABILITY
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_qurbani_campaign_availability()
RETURNS TRIGGER AS $$
DECLARE
    v_campaign_id UUID;
    v_sheep_sold INTEGER;
    v_cow_shares_sold INTEGER;
    v_camel_shares_sold INTEGER;
    v_sheep_cap INTEGER;
    v_cow_cap INTEGER;
    v_camel_cap INTEGER;
BEGIN
    -- Get the campaign_id
    v_campaign_id := COALESCE(NEW.campaign_id, OLD.campaign_id);

    -- Count sold shares by animal type (only pending/confirmed shares)
    SELECT
        COALESCE(SUM(CASE WHEN animal_type = 'sheep' THEN quantity ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN animal_type = 'cow' THEN quantity ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN animal_type = 'camel' THEN quantity ELSE 0 END), 0)
    INTO v_sheep_sold, v_cow_shares_sold, v_camel_shares_sold
    FROM public.qurbani_shares
    WHERE campaign_id = v_campaign_id
    AND status IN ('pending', 'confirmed');

    -- Get campaign capacities
    SELECT sheep_capacity, cow_capacity, camel_capacity
    INTO v_sheep_cap, v_cow_cap, v_camel_cap
    FROM public.qurbani_campaigns
    WHERE id = v_campaign_id;

    -- Update availability
    UPDATE public.qurbani_campaigns
    SET
        sheep_available = GREATEST(COALESCE(v_sheep_cap, 0) - v_sheep_sold, 0),
        cow_shares_available = GREATEST(COALESCE(v_cow_cap, 0) * 7 - v_cow_shares_sold, 0),
        camel_shares_available = GREATEST(COALESCE(v_camel_cap, 0) * 7 - v_camel_shares_sold, 0)
    WHERE id = v_campaign_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_qurbani_availability ON public.qurbani_shares;
CREATE TRIGGER update_qurbani_availability
    AFTER INSERT OR UPDATE OF status, animal_type, quantity OR DELETE ON public.qurbani_shares
    FOR EACH ROW
    EXECUTE FUNCTION public.update_qurbani_campaign_availability();

-- Also update availability when campaign capacity changes
CREATE OR REPLACE FUNCTION public.update_qurbani_availability_on_campaign_change()
RETURNS TRIGGER AS $$
DECLARE
    v_sheep_sold INTEGER;
    v_cow_shares_sold INTEGER;
    v_camel_shares_sold INTEGER;
BEGIN
    -- Count sold shares by animal type
    SELECT
        COALESCE(SUM(CASE WHEN animal_type = 'sheep' THEN quantity ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN animal_type = 'cow' THEN quantity ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN animal_type = 'camel' THEN quantity ELSE 0 END), 0)
    INTO v_sheep_sold, v_cow_shares_sold, v_camel_shares_sold
    FROM public.qurbani_shares
    WHERE campaign_id = NEW.id
    AND status IN ('pending', 'confirmed');

    -- Update availability
    NEW.sheep_available := GREATEST(COALESCE(NEW.sheep_capacity, 0) - v_sheep_sold, 0);
    NEW.cow_shares_available := GREATEST(COALESCE(NEW.cow_capacity, 0) * 7 - v_cow_shares_sold, 0);
    NEW.camel_shares_available := GREATEST(COALESCE(NEW.camel_capacity, 0) * 7 - v_camel_shares_sold, 0);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_qurbani_campaign_capacity ON public.qurbani_campaigns;
CREATE TRIGGER update_qurbani_campaign_capacity
    BEFORE INSERT OR UPDATE OF sheep_capacity, cow_capacity, camel_capacity ON public.qurbani_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION public.update_qurbani_availability_on_campaign_change();

-- ============================================================================
-- SECTION 5: ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE public.qurbani_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qurbani_shares ENABLE ROW LEVEL SECURITY;

-- Qurbani campaigns policies
CREATE POLICY "qurbani_campaigns_select_org" ON public.qurbani_campaigns
    FOR SELECT TO authenticated
    USING (public.user_belongs_to_organization(organization_id));

CREATE POLICY "qurbani_campaigns_insert_org" ON public.qurbani_campaigns
    FOR INSERT TO authenticated
    WITH CHECK (public.user_belongs_to_organization(organization_id));

CREATE POLICY "qurbani_campaigns_update_org" ON public.qurbani_campaigns
    FOR UPDATE TO authenticated
    USING (public.user_belongs_to_organization(organization_id))
    WITH CHECK (public.user_belongs_to_organization(organization_id));

CREATE POLICY "qurbani_campaigns_delete_org" ON public.qurbani_campaigns
    FOR DELETE TO authenticated
    USING (public.user_belongs_to_organization(organization_id));

CREATE POLICY "qurbani_campaigns_platform_admin" ON public.qurbani_campaigns
    FOR ALL TO authenticated
    USING (public.is_platform_admin())
    WITH CHECK (public.is_platform_admin());

-- Qurbani shares policies
CREATE POLICY "qurbani_shares_select_org" ON public.qurbani_shares
    FOR SELECT TO authenticated
    USING (public.user_belongs_to_organization(organization_id));

CREATE POLICY "qurbani_shares_insert_org" ON public.qurbani_shares
    FOR INSERT TO authenticated
    WITH CHECK (public.user_belongs_to_organization(organization_id));

CREATE POLICY "qurbani_shares_update_org" ON public.qurbani_shares
    FOR UPDATE TO authenticated
    USING (public.user_belongs_to_organization(organization_id))
    WITH CHECK (public.user_belongs_to_organization(organization_id));

CREATE POLICY "qurbani_shares_delete_org" ON public.qurbani_shares
    FOR DELETE TO authenticated
    USING (public.user_belongs_to_organization(organization_id));

CREATE POLICY "qurbani_shares_platform_admin" ON public.qurbani_shares
    FOR ALL TO authenticated
    USING (public.is_platform_admin())
    WITH CHECK (public.is_platform_admin());

-- ============================================================================
-- SECTION 6: GRANTS
-- ============================================================================

GRANT ALL ON public.qurbani_campaigns TO service_role;
GRANT ALL ON public.qurbani_shares TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.qurbani_campaigns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.qurbani_shares TO authenticated;

-- ============================================================================
-- SECTION 7: AUDIT TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS audit_trigger_qurbani_campaigns ON public.qurbani_campaigns;
CREATE TRIGGER audit_trigger_qurbani_campaigns
    AFTER INSERT OR UPDATE OR DELETE ON public.qurbani_campaigns
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

DROP TRIGGER IF EXISTS audit_trigger_qurbani_shares ON public.qurbani_shares;
CREATE TRIGGER audit_trigger_qurbani_shares
    AFTER INSERT OR UPDATE OR DELETE ON public.qurbani_shares
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- ============================================================================
-- END OF MIGRATION 00045
-- ============================================================================
