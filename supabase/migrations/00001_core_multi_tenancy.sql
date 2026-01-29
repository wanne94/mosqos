-- ============================================================================
-- MOSQOS - MIGRATION 00001: CORE MULTI-TENANCY TABLES
-- Description: Foundation tables for multi-tenant SaaS architecture
-- Tables: countries, organizations, platform_admins, subscription_plans,
--         plan_pricing, organization_subscriptions
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- HELPER FUNCTIONS (used by RLS policies)
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.update_updated_at_column() IS 'Automatically sets updated_at to current timestamp';

-- Function to check if user is a platform admin
CREATE OR REPLACE FUNCTION public.is_platform_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.platform_admins
        WHERE user_id = check_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_platform_admin(UUID) IS 'Checks if a user is a platform administrator';

-- ============================================================================
-- TABLE: countries
-- Description: Country configurations for multi-country support
-- ============================================================================

CREATE TABLE public.countries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Core fields
    code VARCHAR(3) NOT NULL UNIQUE,              -- ISO 3166-1 alpha-2/3 (US, TR, DE)
    name VARCHAR(100) NOT NULL,
    name_native VARCHAR(100),                      -- Native language name

    -- Localization
    currency_code VARCHAR(3) NOT NULL,             -- ISO 4217 (USD, TRY, EUR)
    currency_symbol VARCHAR(10) NOT NULL,
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',   -- IANA timezone
    locale VARCHAR(10) NOT NULL DEFAULT 'en-US',   -- BCP 47 locale tag
    date_format VARCHAR(20) NOT NULL DEFAULT 'MM/DD/YYYY',

    -- Islamic features
    hijri_enabled BOOLEAN NOT NULL DEFAULT true,
    prayer_calculation_method VARCHAR(50) DEFAULT 'ISNA',

    -- Country-specific legal/tax requirements
    regulations JSONB DEFAULT '{}'::jsonb,

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_countries_code ON public.countries(code);
CREATE INDEX idx_countries_active ON public.countries(is_active) WHERE is_active = true;

-- Trigger for updated_at
CREATE TRIGGER trg_countries_updated_at
    BEFORE UPDATE ON public.countries
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Comments
COMMENT ON TABLE public.countries IS 'Country configurations for multi-country SaaS support';
COMMENT ON COLUMN public.countries.code IS 'ISO 3166-1 country code (e.g., US, TR, DE)';
COMMENT ON COLUMN public.countries.regulations IS 'Country-specific legal/tax requirements as JSON';
COMMENT ON COLUMN public.countries.prayer_calculation_method IS 'Default prayer time calculation method for this country';

-- ============================================================================
-- TABLE: organizations
-- Description: Main tenant table - represents mosques/communities
-- ============================================================================

CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Core identity
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,             -- URL-friendly identifier
    country_id UUID NOT NULL REFERENCES public.countries(id) ON DELETE RESTRICT,

    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),

    -- Contact
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    website VARCHAR(255),

    -- Timezone (overrides country default)
    timezone VARCHAR(50),

    -- Branding
    logo_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#10B981',    -- Hex color
    secondary_color VARCHAR(7) DEFAULT '#059669',

    -- Configuration
    settings JSONB DEFAULT '{
        "hijriPrimary": false,
        "ramadanMode": false,
        "defaultLanguage": "en",
        "enabledModules": ["members", "donations", "announcements"],
        "prayerSettings": {
            "showPrayerTimes": true,
            "calculationMethod": null
        }
    }'::jsonb,

    -- Payment configuration (Stripe Connect)
    stripe_account_id VARCHAR(255),
    payment_config JSONB DEFAULT '{}'::jsonb,

    -- Onboarding
    setup_progress JSONB DEFAULT '{
        "basicInfo": false,
        "branding": false,
        "payment": false,
        "firstMember": false,
        "complete": false
    }'::jsonb,
    onboarding_completed_at TIMESTAMPTZ,

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_organizations_slug ON public.organizations(slug);
CREATE INDEX idx_organizations_country_id ON public.organizations(country_id);
CREATE INDEX idx_organizations_active ON public.organizations(is_active) WHERE is_active = true;
CREATE INDEX idx_organizations_created_by ON public.organizations(created_by);
CREATE INDEX idx_organizations_created_at ON public.organizations(created_at DESC);
CREATE INDEX idx_organizations_stripe_account ON public.organizations(stripe_account_id) WHERE stripe_account_id IS NOT NULL;

-- Trigger for updated_at
CREATE TRIGGER trg_organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Comments
COMMENT ON TABLE public.organizations IS 'Main tenant table representing mosques/communities';
COMMENT ON COLUMN public.organizations.slug IS 'URL-friendly unique identifier used in routing (e.g., /masjid-al-noor/admin)';
COMMENT ON COLUMN public.organizations.settings IS 'Organization-specific settings and enabled features';
COMMENT ON COLUMN public.organizations.payment_config IS 'Stripe Connect account configuration';
COMMENT ON COLUMN public.organizations.setup_progress IS 'Onboarding wizard progress tracking';

-- ============================================================================
-- TABLE: platform_admins
-- Description: SaaS platform owners with full system access
-- ============================================================================

CREATE TABLE public.platform_admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Admin metadata
    notes TEXT,

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_platform_admins_user_id ON public.platform_admins(user_id);

-- Comments
COMMENT ON TABLE public.platform_admins IS 'SaaS platform owners with superadmin access to all organizations';
COMMENT ON COLUMN public.platform_admins.user_id IS 'Reference to auth.users - must be unique';

-- ============================================================================
-- TABLE: subscription_plans
-- Description: SaaS pricing tiers (Free, Basic, Pro, Enterprise)
-- ============================================================================

CREATE TABLE public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Core identity
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) NOT NULL UNIQUE,              -- free, basic, pro, enterprise
    description TEXT,
    tier INTEGER NOT NULL DEFAULT 0,               -- For ordering (0=free, 1=basic, etc.)

    -- Limits
    member_limit INTEGER,                          -- NULL = unlimited
    admin_limit INTEGER DEFAULT 2,                 -- Max organization admins
    storage_limit_gb DECIMAL(10, 2),              -- NULL = unlimited

    -- Feature flags
    features JSONB DEFAULT '{
        "donations": true,
        "education": false,
        "cases": false,
        "umrah": false,
        "qurbani": false,
        "islamic_services": false,
        "api_access": false,
        "custom_domain": false,
        "white_label": false,
        "priority_support": false,
        "advanced_reports": false,
        "bank_reconciliation": false
    }'::jsonb,

    -- Display
    is_popular BOOLEAN DEFAULT false,              -- Highlight this plan
    sort_order INTEGER DEFAULT 0,

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_subscription_plans_slug ON public.subscription_plans(slug);
CREATE INDEX idx_subscription_plans_tier ON public.subscription_plans(tier);
CREATE INDEX idx_subscription_plans_active ON public.subscription_plans(is_active) WHERE is_active = true;
CREATE INDEX idx_subscription_plans_sort ON public.subscription_plans(sort_order, tier);

-- Trigger for updated_at
CREATE TRIGGER trg_subscription_plans_updated_at
    BEFORE UPDATE ON public.subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Comments
COMMENT ON TABLE public.subscription_plans IS 'SaaS subscription tiers with feature limits';
COMMENT ON COLUMN public.subscription_plans.tier IS 'Numeric tier for comparison (higher = more features)';
COMMENT ON COLUMN public.subscription_plans.member_limit IS 'Maximum members allowed (NULL = unlimited)';
COMMENT ON COLUMN public.subscription_plans.features IS 'Feature flags and module access';

-- ============================================================================
-- TABLE: plan_pricing
-- Description: Per-country pricing for subscription plans
-- ============================================================================

CREATE TABLE public.plan_pricing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
    country_id UUID NOT NULL REFERENCES public.countries(id) ON DELETE CASCADE,

    -- Pricing
    price_monthly DECIMAL(10, 2) NOT NULL,
    price_yearly DECIMAL(10, 2) NOT NULL,

    -- Stripe price IDs for this country
    stripe_price_id_monthly VARCHAR(255),
    stripe_price_id_yearly VARCHAR(255),

    -- Trial period in days (can vary by country)
    trial_days INTEGER DEFAULT 14,

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ensure unique pricing per plan per country
    CONSTRAINT uq_plan_pricing_plan_country UNIQUE (plan_id, country_id)
);

-- Indexes
CREATE INDEX idx_plan_pricing_plan_id ON public.plan_pricing(plan_id);
CREATE INDEX idx_plan_pricing_country_id ON public.plan_pricing(country_id);

-- Trigger for updated_at
CREATE TRIGGER trg_plan_pricing_updated_at
    BEFORE UPDATE ON public.plan_pricing
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Comments
COMMENT ON TABLE public.plan_pricing IS 'Country-specific pricing for subscription plans';
COMMENT ON COLUMN public.plan_pricing.stripe_price_id_monthly IS 'Stripe Price ID for monthly billing';
COMMENT ON COLUMN public.plan_pricing.stripe_price_id_yearly IS 'Stripe Price ID for yearly billing';

-- ============================================================================
-- TABLE: organization_subscriptions
-- Description: Active subscriptions linking organizations to plans
-- ============================================================================

CREATE TABLE public.organization_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,

    -- Subscription status
    status VARCHAR(50) NOT NULL DEFAULT 'trialing' CHECK (
        status IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete', 'paused')
    ),
    billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly' CHECK (
        billing_cycle IN ('monthly', 'yearly')
    ),

    -- Stripe integration
    stripe_subscription_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),

    -- Billing periods
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,

    -- Trial and cancellation
    trial_start TIMESTAMPTZ,
    trial_ends_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,

    -- Usage tracking
    current_member_count INTEGER DEFAULT 0,
    current_storage_used_mb DECIMAL(10, 2) DEFAULT 0,

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_org_subscriptions_org_id ON public.organization_subscriptions(organization_id);
CREATE INDEX idx_org_subscriptions_plan_id ON public.organization_subscriptions(plan_id);
CREATE INDEX idx_org_subscriptions_status ON public.organization_subscriptions(status);
CREATE INDEX idx_org_subscriptions_stripe_sub ON public.organization_subscriptions(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
CREATE INDEX idx_org_subscriptions_stripe_cust ON public.organization_subscriptions(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX idx_org_subscriptions_period_end ON public.organization_subscriptions(current_period_end);
CREATE INDEX idx_org_subscriptions_trial_end ON public.organization_subscriptions(trial_ends_at) WHERE trial_ends_at IS NOT NULL;

-- Trigger for updated_at
CREATE TRIGGER trg_organization_subscriptions_updated_at
    BEFORE UPDATE ON public.organization_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Comments
COMMENT ON TABLE public.organization_subscriptions IS 'Active subscriptions linking organizations to subscription plans';
COMMENT ON COLUMN public.organization_subscriptions.status IS 'Subscription status: trialing, active, past_due, canceled, unpaid, incomplete, paused';
COMMENT ON COLUMN public.organization_subscriptions.billing_cycle IS 'Billing frequency: monthly or yearly';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS: countries
-- ============================================================================

-- Anyone can view active countries (public pricing page)
CREATE POLICY "countries_select_public" ON public.countries
    FOR SELECT
    USING (is_active = true);

-- Platform admins can view all countries
CREATE POLICY "countries_select_platform_admin" ON public.countries
    FOR SELECT
    TO authenticated
    USING (public.is_platform_admin());

-- Platform admins can manage countries
CREATE POLICY "countries_insert_platform_admin" ON public.countries
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_platform_admin());

CREATE POLICY "countries_update_platform_admin" ON public.countries
    FOR UPDATE
    TO authenticated
    USING (public.is_platform_admin())
    WITH CHECK (public.is_platform_admin());

CREATE POLICY "countries_delete_platform_admin" ON public.countries
    FOR DELETE
    TO authenticated
    USING (public.is_platform_admin());

-- ============================================================================
-- RLS: organizations
-- ============================================================================

-- Public can view basic org info by slug (for join pages)
CREATE POLICY "organizations_select_public" ON public.organizations
    FOR SELECT
    USING (is_active = true);

-- Platform admins can view all organizations
CREATE POLICY "organizations_select_platform_admin" ON public.organizations
    FOR SELECT
    TO authenticated
    USING (public.is_platform_admin());

-- Platform admins can insert organizations
CREATE POLICY "organizations_insert_platform_admin" ON public.organizations
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_platform_admin());

-- Authenticated users can create their own organizations (self-signup)
CREATE POLICY "organizations_insert_self" ON public.organizations
    FOR INSERT
    TO authenticated
    WITH CHECK (created_by = auth.uid());

-- Organization creator and platform admins can update
CREATE POLICY "organizations_update_owner_or_admin" ON public.organizations
    FOR UPDATE
    TO authenticated
    USING (created_by = auth.uid() OR public.is_platform_admin())
    WITH CHECK (created_by = auth.uid() OR public.is_platform_admin());

-- Only platform admins can delete organizations
CREATE POLICY "organizations_delete_platform_admin" ON public.organizations
    FOR DELETE
    TO authenticated
    USING (public.is_platform_admin());

-- ============================================================================
-- RLS: platform_admins
-- ============================================================================

-- Platform admins can view all platform admins
CREATE POLICY "platform_admins_select" ON public.platform_admins
    FOR SELECT
    TO authenticated
    USING (public.is_platform_admin());

-- Platform admins can manage platform admins
CREATE POLICY "platform_admins_insert" ON public.platform_admins
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_platform_admin());

-- Platform admins can delete (except self)
CREATE POLICY "platform_admins_delete" ON public.platform_admins
    FOR DELETE
    TO authenticated
    USING (public.is_platform_admin() AND user_id != auth.uid());

-- ============================================================================
-- RLS: subscription_plans
-- ============================================================================

-- Anyone can view active plans (public pricing page)
CREATE POLICY "subscription_plans_select_public" ON public.subscription_plans
    FOR SELECT
    USING (is_active = true);

-- Platform admins can view all plans
CREATE POLICY "subscription_plans_select_platform_admin" ON public.subscription_plans
    FOR SELECT
    TO authenticated
    USING (public.is_platform_admin());

-- Platform admins can manage plans
CREATE POLICY "subscription_plans_insert_platform_admin" ON public.subscription_plans
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_platform_admin());

CREATE POLICY "subscription_plans_update_platform_admin" ON public.subscription_plans
    FOR UPDATE
    TO authenticated
    USING (public.is_platform_admin())
    WITH CHECK (public.is_platform_admin());

CREATE POLICY "subscription_plans_delete_platform_admin" ON public.subscription_plans
    FOR DELETE
    TO authenticated
    USING (public.is_platform_admin());

-- ============================================================================
-- RLS: plan_pricing
-- ============================================================================

-- Anyone can view pricing (public pricing page)
CREATE POLICY "plan_pricing_select_public" ON public.plan_pricing
    FOR SELECT
    USING (true);

-- Platform admins can manage pricing
CREATE POLICY "plan_pricing_insert_platform_admin" ON public.plan_pricing
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_platform_admin());

CREATE POLICY "plan_pricing_update_platform_admin" ON public.plan_pricing
    FOR UPDATE
    TO authenticated
    USING (public.is_platform_admin())
    WITH CHECK (public.is_platform_admin());

CREATE POLICY "plan_pricing_delete_platform_admin" ON public.plan_pricing
    FOR DELETE
    TO authenticated
    USING (public.is_platform_admin());

-- ============================================================================
-- RLS: organization_subscriptions
-- ============================================================================

-- Organization creator and platform admins can view subscriptions
CREATE POLICY "org_subscriptions_select" ON public.organization_subscriptions
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.organizations o
            WHERE o.id = organization_id
            AND (o.created_by = auth.uid() OR public.is_platform_admin())
        )
    );

-- Platform admins can manage subscriptions
CREATE POLICY "org_subscriptions_insert_platform_admin" ON public.organization_subscriptions
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_platform_admin());

CREATE POLICY "org_subscriptions_update_platform_admin" ON public.organization_subscriptions
    FOR UPDATE
    TO authenticated
    USING (public.is_platform_admin())
    WITH CHECK (public.is_platform_admin());

CREATE POLICY "org_subscriptions_delete_platform_admin" ON public.organization_subscriptions
    FOR DELETE
    TO authenticated
    USING (public.is_platform_admin());

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Service role full access (for Edge Functions)
GRANT ALL ON public.countries TO service_role;
GRANT ALL ON public.organizations TO service_role;
GRANT ALL ON public.platform_admins TO service_role;
GRANT ALL ON public.subscription_plans TO service_role;
GRANT ALL ON public.plan_pricing TO service_role;
GRANT ALL ON public.organization_subscriptions TO service_role;

-- Anon role for public data
GRANT SELECT ON public.countries TO anon;
GRANT SELECT ON public.organizations TO anon;
GRANT SELECT ON public.subscription_plans TO anon;
GRANT SELECT ON public.plan_pricing TO anon;

-- Authenticated users
GRANT SELECT, INSERT, UPDATE ON public.organizations TO authenticated;
GRANT SELECT ON public.countries TO authenticated;
GRANT SELECT ON public.subscription_plans TO authenticated;
GRANT SELECT ON public.plan_pricing TO authenticated;
GRANT SELECT ON public.organization_subscriptions TO authenticated;
GRANT SELECT ON public.platform_admins TO authenticated;

-- ============================================================================
-- END OF MIGRATION 00001
-- ============================================================================
