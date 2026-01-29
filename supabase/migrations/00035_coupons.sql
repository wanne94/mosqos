-- ============================================================================
-- MOSQOS - MIGRATION 00035: COUPON SYSTEM
-- Description: Discount codes and coupon redemptions for SaaS platform
-- ============================================================================

-- ============================================================================
-- SECTION 1: COUPONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Coupon identity
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Discount configuration
    discount_type VARCHAR(50) NOT NULL CHECK (
        discount_type IN ('percentage', 'fixed', 'trial_extension', 'free_months')
    ),
    discount_value DECIMAL(10,2) NOT NULL,  -- 20 for 20%, 10 for $10, 14 for 14 days, 3 for 3 months
    duration_months INTEGER,  -- NULL = forever, 1 = one month, etc.

    -- Currency (for fixed amount discounts)
    currency VARCHAR(3) DEFAULT 'USD',

    -- Eligibility
    valid_plans TEXT[],  -- NULL = all plans, ['basic', 'pro'] = only those plans
    valid_countries TEXT[],  -- NULL = all countries, ['US', 'UK'] = only those countries
    min_billing_cycle VARCHAR(20),  -- 'monthly', 'yearly', or NULL = any

    -- Usage limits
    usage_limit INTEGER,  -- NULL = unlimited total redemptions
    usage_limit_per_org INTEGER DEFAULT 1,  -- Each org can use it once by default
    current_usage INTEGER DEFAULT 0,

    -- Restrictions
    first_time_only BOOLEAN DEFAULT TRUE,  -- Only for new customers?
    stackable BOOLEAN DEFAULT FALSE,  -- Can be combined with other coupons?
    minimum_amount DECIMAL(10,2),  -- Minimum subscription amount to apply

    -- Validity period
    starts_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Internal notes
    notes TEXT,

    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes for coupons
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON public.coupons(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_coupons_expires ON public.coupons(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_coupons_type ON public.coupons(discount_type);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_period ON public.coupons(starts_at, expires_at)
    WHERE is_active = TRUE;

-- Triggers for coupons
DROP TRIGGER IF EXISTS set_updated_at_coupons ON public.coupons;
CREATE TRIGGER set_updated_at_coupons
    BEFORE UPDATE ON public.coupons
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_created_by_coupons ON public.coupons;
CREATE TRIGGER set_created_by_coupons
    BEFORE INSERT ON public.coupons
    FOR EACH ROW
    EXECUTE FUNCTION public.set_created_by();

-- Comments
COMMENT ON TABLE public.coupons IS 'Discount coupons for SaaS subscription billing';
COMMENT ON COLUMN public.coupons.discount_type IS 'Type: percentage, fixed, trial_extension, free_months';
COMMENT ON COLUMN public.coupons.discount_value IS 'Value of discount (percentage, fixed amount, days, or months)';
COMMENT ON COLUMN public.coupons.duration_months IS 'How many months the discount applies (NULL = forever)';
COMMENT ON COLUMN public.coupons.valid_plans IS 'Array of plan slugs this coupon is valid for (NULL = all)';
COMMENT ON COLUMN public.coupons.valid_countries IS 'Array of country codes this coupon is valid for (NULL = all)';
COMMENT ON COLUMN public.coupons.first_time_only IS 'If true, only new customers can use this coupon';

-- ============================================================================
-- SECTION 2: COUPON REDEMPTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- References
    coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.organization_subscriptions(id) ON DELETE SET NULL,

    -- Redemption details
    discount_applied DECIMAL(10,2) NOT NULL,  -- Actual discount amount
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    original_amount DECIMAL(10,2),  -- Original price before discount
    final_amount DECIMAL(10,2),  -- Final price after discount

    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (
        status IN ('active', 'expired', 'cancelled', 'used')
    ),

    -- Validity tracking
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    months_remaining INTEGER,

    -- Metadata
    redeemed_at TIMESTAMPTZ DEFAULT NOW(),
    applied_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Prevent duplicate redemptions per org per coupon
    CONSTRAINT uq_redemption_coupon_org UNIQUE (coupon_id, organization_id)
);

-- Indexes for coupon_redemptions
CREATE INDEX IF NOT EXISTS idx_redemptions_coupon_id ON public.coupon_redemptions(coupon_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_organization_id ON public.coupon_redemptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_subscription_id ON public.coupon_redemptions(subscription_id)
    WHERE subscription_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_redemptions_status ON public.coupon_redemptions(status);
CREATE INDEX IF NOT EXISTS idx_redemptions_redeemed ON public.coupon_redemptions(redeemed_at DESC);
CREATE INDEX IF NOT EXISTS idx_redemptions_active ON public.coupon_redemptions(organization_id)
    WHERE status = 'active';

-- Comments
COMMENT ON TABLE public.coupon_redemptions IS 'Record of coupon redemptions by organizations';
COMMENT ON COLUMN public.coupon_redemptions.discount_applied IS 'Actual discount amount applied';
COMMENT ON COLUMN public.coupon_redemptions.months_remaining IS 'Remaining months for time-limited discounts';

-- ============================================================================
-- SECTION 3: COUPON VALIDATION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_coupon(
    p_code VARCHAR,
    p_organization_id UUID,
    p_plan_slug VARCHAR DEFAULT NULL,
    p_country_code VARCHAR DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_coupon public.coupons%ROWTYPE;
    v_redemption_count INTEGER;
    v_org_redemption_count INTEGER;
    v_is_first_time BOOLEAN;
    v_plan_name VARCHAR;
BEGIN
    -- Get coupon by code (case-insensitive)
    SELECT * INTO v_coupon
    FROM public.coupons
    WHERE UPPER(code) = UPPER(p_code);

    -- Check if coupon exists
    IF NOT FOUND THEN
        RETURN jsonb_build_object('valid', false, 'error', 'Invalid coupon code');
    END IF;

    -- Check if active
    IF NOT v_coupon.is_active THEN
        RETURN jsonb_build_object('valid', false, 'error', 'This coupon is no longer active');
    END IF;

    -- Check start date
    IF v_coupon.starts_at IS NOT NULL AND v_coupon.starts_at > NOW() THEN
        RETURN jsonb_build_object('valid', false, 'error', 'This coupon is not yet valid');
    END IF;

    -- Check expiration
    IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < NOW() THEN
        RETURN jsonb_build_object('valid', false, 'error', 'This coupon has expired');
    END IF;

    -- Check total usage limit
    IF v_coupon.usage_limit IS NOT NULL THEN
        SELECT COUNT(*) INTO v_redemption_count
        FROM public.coupon_redemptions
        WHERE coupon_id = v_coupon.id;

        IF v_redemption_count >= v_coupon.usage_limit THEN
            RETURN jsonb_build_object('valid', false, 'error', 'This coupon has reached its usage limit');
        END IF;
    END IF;

    -- Check usage limit per organization
    SELECT COUNT(*) INTO v_org_redemption_count
    FROM public.coupon_redemptions
    WHERE coupon_id = v_coupon.id
    AND organization_id = p_organization_id;

    IF v_org_redemption_count >= v_coupon.usage_limit_per_org THEN
        RETURN jsonb_build_object('valid', false, 'error', 'You have already used this coupon');
    END IF;

    -- Check if first-time only
    IF v_coupon.first_time_only THEN
        SELECT NOT EXISTS (
            SELECT 1 FROM public.organization_subscriptions
            WHERE organization_id = p_organization_id
            AND status IN ('active', 'cancelled', 'past_due')
        ) INTO v_is_first_time;

        IF NOT v_is_first_time THEN
            RETURN jsonb_build_object('valid', false, 'error', 'This coupon is only for new customers');
        END IF;
    END IF;

    -- Check plan eligibility
    IF v_coupon.valid_plans IS NOT NULL AND p_plan_slug IS NOT NULL THEN
        IF NOT p_plan_slug = ANY(v_coupon.valid_plans) THEN
            RETURN jsonb_build_object('valid', false, 'error', 'This coupon is not valid for your selected plan');
        END IF;
    END IF;

    -- Check country eligibility
    IF v_coupon.valid_countries IS NOT NULL AND p_country_code IS NOT NULL THEN
        IF NOT p_country_code = ANY(v_coupon.valid_countries) THEN
            RETURN jsonb_build_object('valid', false, 'error', 'This coupon is not available in your region');
        END IF;
    END IF;

    -- All checks passed - return coupon details
    RETURN jsonb_build_object(
        'valid', true,
        'coupon', jsonb_build_object(
            'id', v_coupon.id,
            'code', v_coupon.code,
            'name', v_coupon.name,
            'description', v_coupon.description,
            'discount_type', v_coupon.discount_type,
            'discount_value', v_coupon.discount_value,
            'duration_months', v_coupon.duration_months,
            'currency', v_coupon.currency
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.validate_coupon IS 'Validates a coupon code for an organization and returns coupon details if valid';

-- ============================================================================
-- SECTION 4: APPLY COUPON FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.apply_coupon(
    p_code VARCHAR,
    p_organization_id UUID,
    p_subscription_id UUID,
    p_original_amount DECIMAL(10,2)
)
RETURNS JSONB AS $$
DECLARE
    v_validation JSONB;
    v_coupon public.coupons%ROWTYPE;
    v_discount_amount DECIMAL(10,2);
    v_final_amount DECIMAL(10,2);
    v_valid_until TIMESTAMPTZ;
    v_redemption_id UUID;
BEGIN
    -- Validate the coupon first
    v_validation := public.validate_coupon(p_code, p_organization_id);

    IF NOT (v_validation->>'valid')::boolean THEN
        RETURN v_validation;
    END IF;

    -- Get coupon details
    SELECT * INTO v_coupon
    FROM public.coupons
    WHERE UPPER(code) = UPPER(p_code);

    -- Calculate discount
    CASE v_coupon.discount_type
        WHEN 'percentage' THEN
            v_discount_amount := ROUND(p_original_amount * (v_coupon.discount_value / 100), 2);
        WHEN 'fixed' THEN
            v_discount_amount := LEAST(v_coupon.discount_value, p_original_amount);
        WHEN 'trial_extension' THEN
            v_discount_amount := 0;  -- Trial extension doesn't reduce amount
        WHEN 'free_months' THEN
            v_discount_amount := p_original_amount;  -- Full discount for free months
    END CASE;

    v_final_amount := GREATEST(p_original_amount - v_discount_amount, 0);

    -- Calculate validity period
    IF v_coupon.duration_months IS NOT NULL THEN
        v_valid_until := NOW() + (v_coupon.duration_months || ' months')::INTERVAL;
    END IF;

    -- Create redemption record
    INSERT INTO public.coupon_redemptions (
        coupon_id,
        organization_id,
        subscription_id,
        discount_applied,
        currency,
        original_amount,
        final_amount,
        valid_until,
        months_remaining,
        applied_by
    ) VALUES (
        v_coupon.id,
        p_organization_id,
        p_subscription_id,
        v_discount_amount,
        v_coupon.currency,
        p_original_amount,
        v_final_amount,
        v_valid_until,
        v_coupon.duration_months,
        auth.uid()
    )
    RETURNING id INTO v_redemption_id;

    -- Update coupon usage count
    UPDATE public.coupons
    SET current_usage = current_usage + 1
    WHERE id = v_coupon.id;

    RETURN jsonb_build_object(
        'success', true,
        'redemption_id', v_redemption_id,
        'discount_amount', v_discount_amount,
        'final_amount', v_final_amount,
        'valid_until', v_valid_until,
        'coupon', v_validation->'coupon'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.apply_coupon IS 'Applies a coupon to a subscription and creates a redemption record';

-- ============================================================================
-- SECTION 5: ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

-- Coupons policies - Platform admins can manage
CREATE POLICY "coupons_platform_admin_all" ON public.coupons
    FOR ALL TO authenticated
    USING (public.is_platform_admin())
    WITH CHECK (public.is_platform_admin());

-- Anyone can view active coupons (for applying them)
CREATE POLICY "coupons_select_active" ON public.coupons
    FOR SELECT TO authenticated
    USING (
        is_active = TRUE
        AND (starts_at IS NULL OR starts_at <= NOW())
        AND (expires_at IS NULL OR expires_at > NOW())
    );

-- Coupon redemptions - Platform admins can view all
CREATE POLICY "redemptions_platform_admin_select" ON public.coupon_redemptions
    FOR SELECT TO authenticated
    USING (public.is_platform_admin());

-- Organization members can view their own redemptions
CREATE POLICY "redemptions_org_select" ON public.coupon_redemptions
    FOR SELECT TO authenticated
    USING (public.user_belongs_to_organization(organization_id));

-- Redemptions are created through the apply_coupon function (security definer)
-- No direct insert policy needed for regular users

-- ============================================================================
-- SECTION 6: GRANTS
-- ============================================================================

GRANT ALL ON public.coupons TO service_role;
GRANT ALL ON public.coupon_redemptions TO service_role;

-- Authenticated users can select coupons (for validation)
GRANT SELECT ON public.coupons TO authenticated;
GRANT SELECT ON public.coupon_redemptions TO authenticated;

-- ============================================================================
-- SECTION 7: AUDIT TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS audit_trigger_coupons ON public.coupons;
CREATE TRIGGER audit_trigger_coupons
    AFTER INSERT OR UPDATE OR DELETE ON public.coupons
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

DROP TRIGGER IF EXISTS audit_trigger_coupon_redemptions ON public.coupon_redemptions;
CREATE TRIGGER audit_trigger_coupon_redemptions
    AFTER INSERT OR UPDATE OR DELETE ON public.coupon_redemptions
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- ============================================================================
-- SECTION 8: SEED DEFAULT COUPONS (Optional)
-- ============================================================================

-- Uncomment to add sample coupons for testing
/*
INSERT INTO public.coupons (code, name, description, discount_type, discount_value, duration_months, is_active, notes)
VALUES
    ('WELCOME20', 'Welcome Discount', '20% off for first 3 months', 'percentage', 20, 3, true, 'New customer promotion'),
    ('RAMADAN25', 'Ramadan Special', '25% off for Ramadan month', 'percentage', 25, 1, true, 'Seasonal promotion'),
    ('BETA100', 'Beta Tester Reward', '3 months free', 'free_months', 3, NULL, true, 'For beta testers'),
    ('TRIALPLUS', 'Extended Trial', 'Extra 14 days trial', 'trial_extension', 14, NULL, true, 'Trial extension'),
    ('NONPROFIT30', 'Nonprofit Discount', '30% off forever', 'percentage', 30, NULL, true, 'Verified nonprofits only')
ON CONFLICT (code) DO NOTHING;
*/

-- ============================================================================
-- END OF MIGRATION 00035
-- ============================================================================
