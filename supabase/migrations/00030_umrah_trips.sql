-- ============================================================================
-- MOSQOS - MIGRATION 00030: UMRAH/HAJJ TRIPS MODULE
-- Description: Trip management and pilgrim registrations
-- ============================================================================

-- ============================================================================
-- SECTION 1: TRIPS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Trip identity
    name VARCHAR(255) NOT NULL,
    description TEXT,
    code VARCHAR(50),  -- Trip code (e.g., UMR-2024-01)

    -- Trip type
    trip_type VARCHAR(50) DEFAULT 'umrah' CHECK (
        trip_type IN ('umrah', 'hajj', 'ziyarat', 'educational', 'other')
    ),

    -- Dates
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    registration_deadline DATE,

    -- Destination
    destination VARCHAR(255),  -- Makkah & Madinah, etc.
    itinerary TEXT,
    highlights JSONB DEFAULT '[]'::JSONB,  -- Array of highlight strings

    -- Accommodation
    hotel_makkah VARCHAR(255),
    hotel_madinah VARCHAR(255),
    accommodation_details TEXT,

    -- Pricing
    price DECIMAL(12,2),
    early_bird_price DECIMAL(12,2),
    early_bird_deadline DATE,
    deposit_amount DECIMAL(12,2),
    currency VARCHAR(3) DEFAULT 'USD',

    -- Inclusions/Exclusions
    inclusions JSONB DEFAULT '[]'::JSONB,  -- Array of included items
    exclusions JSONB DEFAULT '[]'::JSONB,  -- Array of excluded items

    -- Capacity
    capacity INTEGER,
    available_spots INTEGER,
    waitlist_capacity INTEGER DEFAULT 10,

    -- Status
    status VARCHAR(50) DEFAULT 'draft' CHECK (
        status IN ('draft', 'open', 'closed', 'full', 'in_progress', 'completed', 'cancelled')
    ),

    -- Requirements
    requirements TEXT,
    visa_requirements TEXT,
    health_requirements TEXT,

    -- Contact
    group_leader_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),

    -- Images
    image_url TEXT,
    gallery JSONB DEFAULT '[]'::JSONB,  -- Array of image URLs

    -- Notes
    notes TEXT,

    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes for trips
CREATE INDEX IF NOT EXISTS idx_trips_organization_id ON public.trips(organization_id);
CREATE INDEX IF NOT EXISTS idx_trips_type ON public.trips(organization_id, trip_type);
CREATE INDEX IF NOT EXISTS idx_trips_status ON public.trips(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_trips_dates ON public.trips(organization_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_trips_code ON public.trips(organization_id, code) WHERE code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trips_open ON public.trips(organization_id)
    WHERE status = 'open' AND available_spots > 0;
CREATE INDEX IF NOT EXISTS idx_trips_upcoming ON public.trips(organization_id, start_date)
    WHERE status IN ('open', 'closed', 'full') AND start_date > CURRENT_DATE;

-- Triggers for trips
DROP TRIGGER IF EXISTS set_updated_at_trips ON public.trips;
CREATE TRIGGER set_updated_at_trips
    BEFORE UPDATE ON public.trips
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_created_by_trips ON public.trips;
CREATE TRIGGER set_created_by_trips
    BEFORE INSERT ON public.trips
    FOR EACH ROW
    EXECUTE FUNCTION public.set_created_by();

DROP TRIGGER IF EXISTS set_updated_by_trips ON public.trips;
CREATE TRIGGER set_updated_by_trips
    BEFORE UPDATE ON public.trips
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_by();

-- Comments
COMMENT ON TABLE public.trips IS 'Umrah, Hajj, and other organized trips';
COMMENT ON COLUMN public.trips.trip_type IS 'Type of trip: umrah, hajj, ziyarat, educational, other';
COMMENT ON COLUMN public.trips.status IS 'Trip status: draft, open, closed, full, in_progress, completed, cancelled';
COMMENT ON COLUMN public.trips.available_spots IS 'Remaining spots (auto-updated on registration)';
COMMENT ON COLUMN public.trips.highlights IS 'JSON array of trip highlights';
COMMENT ON COLUMN public.trips.inclusions IS 'JSON array of what is included in the price';
COMMENT ON COLUMN public.trips.exclusions IS 'JSON array of what is not included';

-- ============================================================================
-- SECTION 2: TRIP REGISTRATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.trip_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Trip reference
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,

    -- Pilgrim/traveler
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,

    -- Registration details
    registration_date DATE DEFAULT CURRENT_DATE,
    registration_number VARCHAR(50),  -- Auto-generated

    -- Status
    status VARCHAR(50) DEFAULT 'pending' CHECK (
        status IN ('pending', 'confirmed', 'waitlisted', 'cancelled', 'completed', 'no_show')
    ),

    -- Payment tracking
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (
        payment_status IN ('pending', 'deposit_paid', 'partial', 'paid', 'refunded')
    ),
    total_amount DECIMAL(12,2),
    deposit_paid DECIMAL(12,2) DEFAULT 0,
    amount_paid DECIMAL(12,2) DEFAULT 0,
    balance_due DECIMAL(12,2) GENERATED ALWAYS AS (COALESCE(total_amount, 0) - amount_paid) STORED,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_deadline DATE,

    -- Room preferences
    room_type VARCHAR(50) CHECK (
        room_type IN ('single', 'double', 'triple', 'quad', 'family')
    ),
    room_sharing_with JSONB DEFAULT '[]'::JSONB,  -- Array of member IDs

    -- Travel documents
    passport_number VARCHAR(50),
    passport_expiry DATE,
    passport_country VARCHAR(100),

    -- Visa tracking
    visa_status VARCHAR(50) DEFAULT 'not_started' CHECK (
        visa_status IN ('not_started', 'documents_submitted', 'processing', 'approved', 'rejected', 'issued')
    ),
    visa_number VARCHAR(100),
    visa_issue_date DATE,
    visa_expiry_date DATE,
    visa_notes TEXT,

    -- Health info
    medical_conditions TEXT,
    dietary_requirements TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    emergency_contact_relation VARCHAR(100),

    -- Flight info (if applicable)
    flight_details JSONB DEFAULT '{}'::JSONB,

    -- Special requests
    special_requests TEXT,
    accessibility_needs TEXT,

    -- Notes
    notes TEXT,
    internal_notes TEXT,

    -- Cancellation info
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    refund_amount DECIMAL(12,2),
    refund_date DATE,

    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Unique constraint: one registration per member per trip
    CONSTRAINT uq_registration_member_trip UNIQUE (trip_id, member_id)
);

-- Indexes for trip_registrations
CREATE INDEX IF NOT EXISTS idx_trip_registrations_organization_id ON public.trip_registrations(organization_id);
CREATE INDEX IF NOT EXISTS idx_trip_registrations_trip_id ON public.trip_registrations(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_registrations_member_id ON public.trip_registrations(member_id);
CREATE INDEX IF NOT EXISTS idx_trip_registrations_status ON public.trip_registrations(trip_id, status);
CREATE INDEX IF NOT EXISTS idx_trip_registrations_payment ON public.trip_registrations(trip_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_trip_registrations_visa ON public.trip_registrations(trip_id, visa_status);
CREATE INDEX IF NOT EXISTS idx_trip_registrations_date ON public.trip_registrations(organization_id, registration_date DESC);
CREATE INDEX IF NOT EXISTS idx_trip_registrations_number ON public.trip_registrations(registration_number)
    WHERE registration_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trip_registrations_with_balance ON public.trip_registrations(organization_id)
    WHERE balance_due > 0 AND status = 'confirmed';

-- Triggers for trip_registrations
DROP TRIGGER IF EXISTS set_updated_at_trip_registrations ON public.trip_registrations;
CREATE TRIGGER set_updated_at_trip_registrations
    BEFORE UPDATE ON public.trip_registrations
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_created_by_trip_registrations ON public.trip_registrations;
CREATE TRIGGER set_created_by_trip_registrations
    BEFORE INSERT ON public.trip_registrations
    FOR EACH ROW
    EXECUTE FUNCTION public.set_created_by();

DROP TRIGGER IF EXISTS set_updated_by_trip_registrations ON public.trip_registrations;
CREATE TRIGGER set_updated_by_trip_registrations
    BEFORE UPDATE ON public.trip_registrations
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_by();

-- Comments
COMMENT ON TABLE public.trip_registrations IS 'Pilgrim registrations for trips';
COMMENT ON COLUMN public.trip_registrations.status IS 'Registration status: pending, confirmed, waitlisted, cancelled, completed, no_show';
COMMENT ON COLUMN public.trip_registrations.payment_status IS 'Payment status: pending, deposit_paid, partial, paid, refunded';
COMMENT ON COLUMN public.trip_registrations.visa_status IS 'Visa processing status: not_started, documents_submitted, processing, approved, rejected, issued';
COMMENT ON COLUMN public.trip_registrations.room_sharing_with IS 'JSON array of member IDs sharing room';
COMMENT ON COLUMN public.trip_registrations.flight_details IS 'JSON object with flight information';

-- ============================================================================
-- SECTION 3: AUTO-GENERATE REGISTRATION NUMBER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_registration_number()
RETURNS TRIGGER AS $$
DECLARE
    v_trip_code VARCHAR;
    v_sequence INT;
BEGIN
    IF NEW.registration_number IS NULL THEN
        -- Get trip code or use trip ID prefix
        SELECT COALESCE(code, 'TRIP') INTO v_trip_code
        FROM public.trips WHERE id = NEW.trip_id;

        -- Get next sequence for this trip
        SELECT COALESCE(MAX(
            CAST(
                SUBSTRING(registration_number FROM v_trip_code || '-(\d+)')
                AS INTEGER
            )
        ), 0) + 1
        INTO v_sequence
        FROM public.trip_registrations
        WHERE trip_id = NEW.trip_id;

        NEW.registration_number := v_trip_code || '-' || LPAD(v_sequence::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS generate_registration_number_trigger ON public.trip_registrations;
CREATE TRIGGER generate_registration_number_trigger
    BEFORE INSERT ON public.trip_registrations
    FOR EACH ROW
    EXECUTE FUNCTION public.generate_registration_number();

-- ============================================================================
-- SECTION 4: UPDATE TRIP AVAILABLE SPOTS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_trip_available_spots()
RETURNS TRIGGER AS $$
DECLARE
    v_confirmed_count INT;
BEGIN
    -- Count confirmed registrations
    SELECT COUNT(*)
    INTO v_confirmed_count
    FROM public.trip_registrations
    WHERE trip_id = COALESCE(NEW.trip_id, OLD.trip_id)
    AND status IN ('pending', 'confirmed');

    -- Update available spots
    UPDATE public.trips
    SET available_spots = GREATEST(COALESCE(capacity, 0) - v_confirmed_count, 0)
    WHERE id = COALESCE(NEW.trip_id, OLD.trip_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_trip_spots ON public.trip_registrations;
CREATE TRIGGER update_trip_spots
    AFTER INSERT OR UPDATE OF status OR DELETE ON public.trip_registrations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_trip_available_spots();

-- ============================================================================
-- SECTION 5: ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_registrations ENABLE ROW LEVEL SECURITY;

-- Trips policies
CREATE POLICY "trips_select_org" ON public.trips
    FOR SELECT TO authenticated
    USING (public.user_belongs_to_organization(organization_id));

CREATE POLICY "trips_insert_org" ON public.trips
    FOR INSERT TO authenticated
    WITH CHECK (public.user_belongs_to_organization(organization_id));

CREATE POLICY "trips_update_org" ON public.trips
    FOR UPDATE TO authenticated
    USING (public.user_belongs_to_organization(organization_id))
    WITH CHECK (public.user_belongs_to_organization(organization_id));

CREATE POLICY "trips_delete_org" ON public.trips
    FOR DELETE TO authenticated
    USING (public.user_belongs_to_organization(organization_id));

CREATE POLICY "trips_platform_admin" ON public.trips
    FOR ALL TO authenticated
    USING (public.is_platform_admin())
    WITH CHECK (public.is_platform_admin());

-- Trip registrations policies
CREATE POLICY "trip_registrations_select_org" ON public.trip_registrations
    FOR SELECT TO authenticated
    USING (public.user_belongs_to_organization(organization_id));

CREATE POLICY "trip_registrations_insert_org" ON public.trip_registrations
    FOR INSERT TO authenticated
    WITH CHECK (public.user_belongs_to_organization(organization_id));

CREATE POLICY "trip_registrations_update_org" ON public.trip_registrations
    FOR UPDATE TO authenticated
    USING (public.user_belongs_to_organization(organization_id))
    WITH CHECK (public.user_belongs_to_organization(organization_id));

CREATE POLICY "trip_registrations_delete_org" ON public.trip_registrations
    FOR DELETE TO authenticated
    USING (public.user_belongs_to_organization(organization_id));

CREATE POLICY "trip_registrations_platform_admin" ON public.trip_registrations
    FOR ALL TO authenticated
    USING (public.is_platform_admin())
    WITH CHECK (public.is_platform_admin());

-- ============================================================================
-- SECTION 6: GRANTS
-- ============================================================================

GRANT ALL ON public.trips TO service_role;
GRANT ALL ON public.trip_registrations TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.trips TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trip_registrations TO authenticated;

-- ============================================================================
-- SECTION 7: AUDIT TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS audit_trigger_trips ON public.trips;
CREATE TRIGGER audit_trigger_trips
    AFTER INSERT OR UPDATE OR DELETE ON public.trips
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

DROP TRIGGER IF EXISTS audit_trigger_trip_registrations ON public.trip_registrations;
CREATE TRIGGER audit_trigger_trip_registrations
    AFTER INSERT OR UPDATE OR DELETE ON public.trip_registrations
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- ============================================================================
-- END OF MIGRATION 00030
-- ============================================================================
