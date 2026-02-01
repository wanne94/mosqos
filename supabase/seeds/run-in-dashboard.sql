-- ============================================================================
-- RUN THIS IN SUPABASE SQL EDITOR (Dashboard > SQL Editor)
-- This adds price columns and seeds real pricing data
-- ============================================================================

-- Step 1: Add price columns to subscription_plans if they don't exist
ALTER TABLE public.subscription_plans
ADD COLUMN IF NOT EXISTS price_monthly DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS price_yearly DECIMAL(10, 2) DEFAULT 0;

-- Step 2: Update existing plans with USD pricing
UPDATE public.subscription_plans SET
  price_monthly = 0,
  price_yearly = 0,
  updated_at = now()
WHERE slug = 'free';

UPDATE public.subscription_plans SET
  price_monthly = 49.00,
  price_yearly = 470.00,
  updated_at = now()
WHERE slug = 'basic';

UPDATE public.subscription_plans SET
  price_monthly = 99.00,
  price_yearly = 950.00,
  updated_at = now()
WHERE slug = 'pro';

UPDATE public.subscription_plans SET
  price_monthly = 199.00,
  price_yearly = 1910.00,
  updated_at = now()
WHERE slug = 'enterprise';

-- Step 3: Verify the update
SELECT slug, name, price_monthly, price_yearly FROM subscription_plans ORDER BY sort_order;
