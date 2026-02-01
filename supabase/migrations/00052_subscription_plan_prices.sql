-- Add default USD prices to subscription_plans table
-- These are convenience columns for default/USD pricing
-- Full multi-country pricing is in plan_pricing table

ALTER TABLE public.subscription_plans
ADD COLUMN IF NOT EXISTS price_monthly DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS price_yearly DECIMAL(10, 2) DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN public.subscription_plans.price_monthly IS 'Default monthly price in USD';
COMMENT ON COLUMN public.subscription_plans.price_yearly IS 'Default yearly price in USD';

-- Update existing plans with USD pricing
UPDATE public.subscription_plans SET
  price_monthly = 0,
  price_yearly = 0
WHERE slug = 'free';

UPDATE public.subscription_plans SET
  price_monthly = 49.00,
  price_yearly = 470.00
WHERE slug = 'basic';

UPDATE public.subscription_plans SET
  price_monthly = 99.00,
  price_yearly = 950.00
WHERE slug = 'pro';

UPDATE public.subscription_plans SET
  price_monthly = 199.00,
  price_yearly = 1910.00
WHERE slug = 'enterprise';
