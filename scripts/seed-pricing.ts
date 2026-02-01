/**
 * Script to seed pricing data into Supabase
 * Run with: VITE_SUPABASE_URL=xxx VITE_SUPABASE_ANON_KEY=xxx npx tsx scripts/seed-pricing.ts
 * Or source .env first: source <(cat .env | grep -v '^#' | sed 's/^/export /') && npx tsx scripts/seed-pricing.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('Usage: VITE_SUPABASE_URL=xxx VITE_SUPABASE_ANON_KEY=xxx npx tsx scripts/seed-pricing.ts')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface Country {
  id: string
  code: string
}

interface Plan {
  id: string
  slug: string
}

const plans = [
  {
    slug: 'free',
    name: 'Free',
    description: 'Perfect for small communities just getting started',
    tier: 0,
    member_limit: 50,
    admin_limit: 2,
    storage_limit_gb: 1,
    price_monthly: 0,
    price_yearly: 0,
    features: {
      donations: true,
      education: false,
      islamic_services: false,
      cases: false,
      umrah: false,
      qurbani: false,
      advanced_reports: false,
      bank_reconciliation: false,
      api_access: false,
      custom_domain: false,
      white_label: false,
      priority_support: false
    },
    is_popular: false,
    sort_order: 0,
    is_active: true
  },
  {
    slug: 'basic',
    name: 'Basic',
    description: 'Essential features for growing communities',
    tier: 1,
    member_limit: 200,
    admin_limit: 5,
    storage_limit_gb: 10,
    price_monthly: 49,
    price_yearly: 470,
    features: {
      donations: true,
      education: true,
      islamic_services: true,
      cases: false,
      umrah: false,
      qurbani: false,
      advanced_reports: false,
      bank_reconciliation: false,
      api_access: false,
      custom_domain: false,
      white_label: false,
      priority_support: false
    },
    is_popular: false,
    sort_order: 1,
    is_active: true
  },
  {
    slug: 'pro',
    name: 'Pro',
    description: 'Advanced tools for established communities',
    tier: 2,
    member_limit: 500,
    admin_limit: 10,
    storage_limit_gb: 50,
    price_monthly: 99,
    price_yearly: 950,
    features: {
      donations: true,
      education: true,
      islamic_services: true,
      cases: true,
      umrah: true,
      qurbani: true,
      advanced_reports: true,
      bank_reconciliation: true,
      api_access: false,
      custom_domain: false,
      white_label: false,
      priority_support: false
    },
    is_popular: true,
    sort_order: 2,
    is_active: true
  },
  {
    slug: 'enterprise',
    name: 'Enterprise',
    description: 'Complete solution for large organizations',
    tier: 3,
    member_limit: null,
    admin_limit: 999,
    storage_limit_gb: 500,
    price_monthly: 199,
    price_yearly: 1910,
    features: {
      donations: true,
      education: true,
      islamic_services: true,
      cases: true,
      umrah: true,
      qurbani: true,
      advanced_reports: true,
      bank_reconciliation: true,
      api_access: true,
      custom_domain: true,
      white_label: true,
      priority_support: true
    },
    is_popular: false,
    sort_order: 3,
    is_active: true
  }
]

const pricing = {
  free: {
    US: { monthly: 0, yearly: 0, trial: 0 },
    TR: { monthly: 0, yearly: 0, trial: 0 },
    DE: { monthly: 0, yearly: 0, trial: 0 },
  },
  basic: {
    US: { monthly: 49, yearly: 470, trial: 14 },
    TR: { monthly: 1500, yearly: 14400, trial: 14 },
    DE: { monthly: 45, yearly: 432, trial: 14 },
  },
  pro: {
    US: { monthly: 99, yearly: 950, trial: 14 },
    TR: { monthly: 3000, yearly: 28800, trial: 14 },
    DE: { monthly: 89, yearly: 854, trial: 14 },
  },
  enterprise: {
    US: { monthly: 199, yearly: 1910, trial: 30 },
    TR: { monthly: 6000, yearly: 57600, trial: 30 },
    DE: { monthly: 179, yearly: 1718, trial: 30 },
  },
}

async function seedPricing() {
  console.log('🌱 Starting pricing seed...\n')

  // 1. Fetch countries
  console.log('📍 Fetching countries...')
  const { data: countries, error: countriesError } = await supabase
    .from('countries')
    .select('id, code')
    .in('code', ['US', 'TR', 'DE'])

  if (countriesError) {
    console.error('❌ Error fetching countries:', countriesError)
    process.exit(1)
  }

  if (!countries || countries.length === 0) {
    console.error('❌ No countries found. Please ensure countries are seeded first.')
    process.exit(1)
  }

  console.log(`✅ Found ${countries.length} countries\n`)

  // 2. Upsert subscription plans
  console.log('📦 Upserting subscription plans...')

  for (const plan of plans) {
    const { data, error } = await supabase
      .from('subscription_plans')
      .upsert(plan, { onConflict: 'slug' })
      .select()
      .single()

    if (error) {
      console.error(`❌ Error upserting plan ${plan.slug}:`, error)
      continue
    }

    console.log(`✅ ${plan.name} plan upserted`)
  }

  console.log('')

  // 3. Fetch plan IDs
  console.log('🔍 Fetching plan IDs...')
  const { data: planRecords, error: plansError } = await supabase
    .from('subscription_plans')
    .select('id, slug')
    .in('slug', ['free', 'basic', 'pro', 'enterprise'])

  if (plansError || !planRecords) {
    console.error('❌ Error fetching plans:', plansError)
    process.exit(1)
  }

  console.log(`✅ Found ${planRecords.length} plans\n`)

  // 4. Insert pricing records
  console.log('💰 Inserting pricing records...')

  let inserted = 0
  let updated = 0

  for (const planRecord of planRecords) {
    const planPricing = pricing[planRecord.slug as keyof typeof pricing]

    for (const country of countries) {
      const countryPricing = planPricing[country.code as keyof typeof planPricing]

      const pricingRecord = {
        plan_id: planRecord.id,
        country_id: country.id,
        price_monthly: countryPricing.monthly,
        price_yearly: countryPricing.yearly,
        trial_days: countryPricing.trial,
        stripe_price_id_monthly: countryPricing.monthly > 0
          ? `stripe_price_${planRecord.slug}_${country.code.toLowerCase()}_monthly`
          : null,
        stripe_price_id_yearly: countryPricing.yearly > 0
          ? `stripe_price_${planRecord.slug}_${country.code.toLowerCase()}_yearly`
          : null,
      }

      const { error } = await supabase
        .from('plan_pricing')
        .upsert(pricingRecord, {
          onConflict: 'plan_id,country_id',
          ignoreDuplicates: false
        })

      if (error) {
        console.error(`❌ Error inserting pricing for ${planRecord.slug} in ${country.code}:`, error)
        continue
      }

      console.log(`✅ ${planRecord.slug.padEnd(10)} | ${country.code} | $${countryPricing.monthly}/${countryPricing.yearly}`)
      inserted++
    }
  }

  console.log(`\n✨ Pricing seed completed!`)
  console.log(`   📦 ${plans.length} plans`)
  console.log(`   💰 ${inserted} pricing records`)
  console.log('')
}

seedPricing()
  .then(() => {
    console.log('✅ Seed completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  })
