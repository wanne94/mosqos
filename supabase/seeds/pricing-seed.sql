-- Production Pricing Plans Seed Data
-- Run this after initial migration to populate subscription plans and pricing
-- Must be run with service_role key or as superuser

-- ============================================================================
-- SUBSCRIPTION PLANS
-- ============================================================================

INSERT INTO subscription_plans (
  slug,
  name,
  description,
  tier,
  member_limit,
  admin_limit,
  storage_limit_gb,
  features,
  is_popular,
  sort_order,
  is_active
)
VALUES
  -- Free Plan
  (
    'free',
    'Free',
    'Perfect for small communities just getting started',
    0,
    50,
    2,
    1,
    '{
      "donations": true,
      "education": false,
      "islamic_services": false,
      "cases": false,
      "umrah": false,
      "qurbani": false,
      "advanced_reports": false,
      "bank_reconciliation": false,
      "api_access": false,
      "custom_domain": false,
      "white_label": false,
      "priority_support": false
    }'::jsonb,
    false,
    0,
    true
  ),
  -- Basic Plan
  (
    'basic',
    'Basic',
    'Essential features for growing communities',
    1,
    200,
    5,
    10,
    '{
      "donations": true,
      "education": true,
      "islamic_services": true,
      "cases": false,
      "umrah": false,
      "qurbani": false,
      "advanced_reports": false,
      "bank_reconciliation": false,
      "api_access": false,
      "custom_domain": false,
      "white_label": false,
      "priority_support": false
    }'::jsonb,
    false,
    1,
    true
  ),
  -- Pro Plan (Most Popular)
  (
    'pro',
    'Pro',
    'Advanced tools for established communities',
    2,
    500,
    10,
    50,
    '{
      "donations": true,
      "education": true,
      "islamic_services": true,
      "cases": true,
      "umrah": true,
      "qurbani": true,
      "advanced_reports": true,
      "bank_reconciliation": true,
      "api_access": false,
      "custom_domain": false,
      "white_label": false,
      "priority_support": false
    }'::jsonb,
    true,
    2,
    true
  ),
  -- Enterprise Plan
  (
    'enterprise',
    'Enterprise',
    'Complete solution for large organizations',
    3,
    NULL, -- Unlimited members
    999,
    500,
    '{
      "donations": true,
      "education": true,
      "islamic_services": true,
      "cases": true,
      "umrah": true,
      "qurbani": true,
      "advanced_reports": true,
      "bank_reconciliation": true,
      "api_access": true,
      "custom_domain": true,
      "white_label": true,
      "priority_support": true
    }'::jsonb,
    false,
    3,
    true
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  tier = EXCLUDED.tier,
  member_limit = EXCLUDED.member_limit,
  admin_limit = EXCLUDED.admin_limit,
  storage_limit_gb = EXCLUDED.storage_limit_gb,
  features = EXCLUDED.features,
  is_popular = EXCLUDED.is_popular,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- ============================================================================
-- PLAN PRICING (Multi-Country Support)
-- Note: Currency comes from the countries table (currency_code column)
-- ============================================================================

DO $$
DECLARE
  us_country_id uuid;
  tr_country_id uuid;
  de_country_id uuid;
  free_plan_id uuid;
  basic_plan_id uuid;
  pro_plan_id uuid;
  enterprise_plan_id uuid;
BEGIN
  -- Get country IDs
  SELECT id INTO us_country_id FROM countries WHERE code = 'US';
  SELECT id INTO tr_country_id FROM countries WHERE code = 'TR';
  SELECT id INTO de_country_id FROM countries WHERE code = 'DE';

  -- Get plan IDs
  SELECT id INTO free_plan_id FROM subscription_plans WHERE slug = 'free';
  SELECT id INTO basic_plan_id FROM subscription_plans WHERE slug = 'basic';
  SELECT id INTO pro_plan_id FROM subscription_plans WHERE slug = 'pro';
  SELECT id INTO enterprise_plan_id FROM subscription_plans WHERE slug = 'enterprise';

  -- ============================================================================
  -- FREE PLAN PRICING (All Countries - $0)
  -- ============================================================================

  -- US
  INSERT INTO plan_pricing (plan_id, country_id, price_monthly, price_yearly, trial_days, stripe_price_id_monthly, stripe_price_id_yearly)
  VALUES (free_plan_id, us_country_id, 0, 0, 0, NULL, NULL)
  ON CONFLICT (plan_id, country_id) DO UPDATE SET
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    trial_days = EXCLUDED.trial_days,
    updated_at = now();

  -- Turkey
  INSERT INTO plan_pricing (plan_id, country_id, price_monthly, price_yearly, trial_days, stripe_price_id_monthly, stripe_price_id_yearly)
  VALUES (free_plan_id, tr_country_id, 0, 0, 0, NULL, NULL)
  ON CONFLICT (plan_id, country_id) DO UPDATE SET
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    trial_days = EXCLUDED.trial_days,
    updated_at = now();

  -- Germany
  INSERT INTO plan_pricing (plan_id, country_id, price_monthly, price_yearly, trial_days, stripe_price_id_monthly, stripe_price_id_yearly)
  VALUES (free_plan_id, de_country_id, 0, 0, 0, NULL, NULL)
  ON CONFLICT (plan_id, country_id) DO UPDATE SET
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    trial_days = EXCLUDED.trial_days,
    updated_at = now();

  -- ============================================================================
  -- BASIC PLAN PRICING
  -- ============================================================================

  -- US - $49/month, $470/year (20% discount)
  INSERT INTO plan_pricing (plan_id, country_id, price_monthly, price_yearly, trial_days, stripe_price_id_monthly, stripe_price_id_yearly)
  VALUES (basic_plan_id, us_country_id, 49.00, 470.00, 14, 'stripe_price_basic_us_monthly', 'stripe_price_basic_us_yearly')
  ON CONFLICT (plan_id, country_id) DO UPDATE SET
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    trial_days = EXCLUDED.trial_days,
    stripe_price_id_monthly = EXCLUDED.stripe_price_id_monthly,
    stripe_price_id_yearly = EXCLUDED.stripe_price_id_yearly,
    updated_at = now();

  -- Turkey - TRY 1,500/month, TRY 14,400/year
  INSERT INTO plan_pricing (plan_id, country_id, price_monthly, price_yearly, trial_days, stripe_price_id_monthly, stripe_price_id_yearly)
  VALUES (basic_plan_id, tr_country_id, 1500.00, 14400.00, 14, 'stripe_price_basic_tr_monthly', 'stripe_price_basic_tr_yearly')
  ON CONFLICT (plan_id, country_id) DO UPDATE SET
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    trial_days = EXCLUDED.trial_days,
    stripe_price_id_monthly = EXCLUDED.stripe_price_id_monthly,
    stripe_price_id_yearly = EXCLUDED.stripe_price_id_yearly,
    updated_at = now();

  -- Germany - EUR 45/month, EUR 432/year
  INSERT INTO plan_pricing (plan_id, country_id, price_monthly, price_yearly, trial_days, stripe_price_id_monthly, stripe_price_id_yearly)
  VALUES (basic_plan_id, de_country_id, 45.00, 432.00, 14, 'stripe_price_basic_de_monthly', 'stripe_price_basic_de_yearly')
  ON CONFLICT (plan_id, country_id) DO UPDATE SET
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    trial_days = EXCLUDED.trial_days,
    stripe_price_id_monthly = EXCLUDED.stripe_price_id_monthly,
    stripe_price_id_yearly = EXCLUDED.stripe_price_id_yearly,
    updated_at = now();

  -- ============================================================================
  -- PRO PLAN PRICING
  -- ============================================================================

  -- US - $99/month, $950/year
  INSERT INTO plan_pricing (plan_id, country_id, price_monthly, price_yearly, trial_days, stripe_price_id_monthly, stripe_price_id_yearly)
  VALUES (pro_plan_id, us_country_id, 99.00, 950.00, 14, 'stripe_price_pro_us_monthly', 'stripe_price_pro_us_yearly')
  ON CONFLICT (plan_id, country_id) DO UPDATE SET
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    trial_days = EXCLUDED.trial_days,
    stripe_price_id_monthly = EXCLUDED.stripe_price_id_monthly,
    stripe_price_id_yearly = EXCLUDED.stripe_price_id_yearly,
    updated_at = now();

  -- Turkey - TRY 3,000/month, TRY 28,800/year
  INSERT INTO plan_pricing (plan_id, country_id, price_monthly, price_yearly, trial_days, stripe_price_id_monthly, stripe_price_id_yearly)
  VALUES (pro_plan_id, tr_country_id, 3000.00, 28800.00, 14, 'stripe_price_pro_tr_monthly', 'stripe_price_pro_tr_yearly')
  ON CONFLICT (plan_id, country_id) DO UPDATE SET
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    trial_days = EXCLUDED.trial_days,
    stripe_price_id_monthly = EXCLUDED.stripe_price_id_monthly,
    stripe_price_id_yearly = EXCLUDED.stripe_price_id_yearly,
    updated_at = now();

  -- Germany - EUR 89/month, EUR 854/year
  INSERT INTO plan_pricing (plan_id, country_id, price_monthly, price_yearly, trial_days, stripe_price_id_monthly, stripe_price_id_yearly)
  VALUES (pro_plan_id, de_country_id, 89.00, 854.00, 14, 'stripe_price_pro_de_monthly', 'stripe_price_pro_de_yearly')
  ON CONFLICT (plan_id, country_id) DO UPDATE SET
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    trial_days = EXCLUDED.trial_days,
    stripe_price_id_monthly = EXCLUDED.stripe_price_id_monthly,
    stripe_price_id_yearly = EXCLUDED.stripe_price_id_yearly,
    updated_at = now();

  -- ============================================================================
  -- ENTERPRISE PLAN PRICING
  -- ============================================================================

  -- US - $199/month, $1,910/year
  INSERT INTO plan_pricing (plan_id, country_id, price_monthly, price_yearly, trial_days, stripe_price_id_monthly, stripe_price_id_yearly)
  VALUES (enterprise_plan_id, us_country_id, 199.00, 1910.00, 30, 'stripe_price_enterprise_us_monthly', 'stripe_price_enterprise_us_yearly')
  ON CONFLICT (plan_id, country_id) DO UPDATE SET
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    trial_days = EXCLUDED.trial_days,
    stripe_price_id_monthly = EXCLUDED.stripe_price_id_monthly,
    stripe_price_id_yearly = EXCLUDED.stripe_price_id_yearly,
    updated_at = now();

  -- Turkey - TRY 6,000/month, TRY 57,600/year
  INSERT INTO plan_pricing (plan_id, country_id, price_monthly, price_yearly, trial_days, stripe_price_id_monthly, stripe_price_id_yearly)
  VALUES (enterprise_plan_id, tr_country_id, 6000.00, 57600.00, 30, 'stripe_price_enterprise_tr_monthly', 'stripe_price_enterprise_tr_yearly')
  ON CONFLICT (plan_id, country_id) DO UPDATE SET
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    trial_days = EXCLUDED.trial_days,
    stripe_price_id_monthly = EXCLUDED.stripe_price_id_monthly,
    stripe_price_id_yearly = EXCLUDED.stripe_price_id_yearly,
    updated_at = now();

  -- Germany - EUR 179/month, EUR 1,718/year
  INSERT INTO plan_pricing (plan_id, country_id, price_monthly, price_yearly, trial_days, stripe_price_id_monthly, stripe_price_id_yearly)
  VALUES (enterprise_plan_id, de_country_id, 179.00, 1718.00, 30, 'stripe_price_enterprise_de_monthly', 'stripe_price_enterprise_de_yearly')
  ON CONFLICT (plan_id, country_id) DO UPDATE SET
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    trial_days = EXCLUDED.trial_days,
    stripe_price_id_monthly = EXCLUDED.stripe_price_id_monthly,
    stripe_price_id_yearly = EXCLUDED.stripe_price_id_yearly,
    updated_at = now();

END $$;
