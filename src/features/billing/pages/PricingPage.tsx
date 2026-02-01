import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Check, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import type { SubscriptionPlan, PlanPricing, Country } from '../types/billing.types'

interface PlanWithPricing extends SubscriptionPlan {
  pricing: PlanPricing
}

const PricingPage = () => {
  const { t, i18n } = useTranslation('pricing')
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [selectedCountry, setSelectedCountry] = useState<string>('US')

  // Fetch countries
  const { data: countries } = useQuery({
    queryKey: ['countries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .in('code', ['US', 'TR', 'DE'])
        .order('code')

      if (error) throw error
      return data as Country[]
    },
  })

  // Fetch plans with pricing
  const { data: plans, isLoading } = useQuery({
    queryKey: ['pricing', selectedCountry],
    queryFn: async () => {
      const country = countries?.find(c => c.code === selectedCountry)
      if (!country) return []

      const { data, error } = await supabase
        .from('subscription_plans')
        .select(`
          *,
          pricing:plan_pricing!inner(*)
        `)
        .eq('is_active', true)
        .eq('pricing.country_id', country.id)
        .order('sort_order')

      if (error) throw error

      return (data as any[]).map(plan => ({
        ...plan,
        pricing: plan.pricing[0],
      })) as PlanWithPricing[]
    },
    enabled: !!countries && countries.length > 0,
  })

  // Get current country's currency
  const currentCountry = countries?.find(c => c.code === selectedCountry)
  const currency = currentCountry?.currency_code || 'USD'

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat(i18n.language, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getPrice = (plan: PlanWithPricing) => {
    return billingCycle === 'monthly'
      ? plan.pricing.price_monthly
      : plan.pricing.price_yearly
  }

  const featureKeys = [
    'members',
    'donations',
    'education',
    'islamic_services',
    'cases',
    'umrah',
    'qurbani',
    'advanced_reports',
    'bank_reconciliation',
    'api_access',
    'custom_domain',
    'white_label',
    'priority_support',
  ] as const

  if (isLoading || !plans || !countries) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
          {t('title')}
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
          {t('subtitle')}
        </p>

        {/* Controls */}
        <div className="mx-auto mb-12 flex max-w-md flex-col gap-4 sm:flex-row sm:items-center sm:justify-center">
          {/* Billing Cycle Toggle */}
          <div className="inline-flex items-center gap-2 rounded-lg border bg-muted p-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('billingCycle.monthly')}
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                billingCycle === 'yearly'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('billingCycle.yearly')}
            </button>
          </div>

          {billingCycle === 'yearly' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-sm font-medium text-primary-foreground">
              {t('billingCycle.save')}
            </span>
          )}

          {/* Country Selector */}
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="rounded-lg border bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
          >
            {countries.map((country) => (
              <option key={country.id} value={country.code}>
                {t(`country.${country.code.toLowerCase()}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="container mx-auto px-4 pb-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => {
            const price = getPrice(plan)
            const isFree = plan.slug === 'free'
            const isEnterprise = plan.slug === 'enterprise'

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border bg-card p-8 shadow-sm transition-all hover:shadow-lg ${
                  plan.is_popular
                    ? 'border-primary shadow-md ring-2 ring-primary ring-opacity-50'
                    : ''
                }`}
              >
                {/* Most Popular Badge */}
                {plan.is_popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-primary px-4 py-1 text-sm font-semibold text-primary-foreground">
                      {t('cta.mostPopular')}
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className="mb-6">
                  <h3 className="mb-2 text-xl font-bold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">
                      {formatPrice(price)}
                    </span>
                    {!isFree && (
                      <span className="text-muted-foreground">
                        /{billingCycle === 'monthly' ? t('billingCycle.monthly').toLowerCase() : t('billingCycle.yearly').toLowerCase()}
                      </span>
                    )}
                  </div>
                  {!isFree && billingCycle === 'yearly' && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatPrice(plan.pricing.price_yearly / 12)} / {t('billingCycle.monthly').toLowerCase()}
                    </p>
                  )}
                  {!isFree && plan.pricing.trial_days > 0 && (
                    <p className="mt-2 text-sm text-primary">
                      {plan.pricing.trial_days}-day free trial
                    </p>
                  )}
                </div>

                {/* Limits */}
                <div className="mb-6 space-y-2 border-t pt-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    <span>
                      {plan.member_limit
                        ? t('limits.members', { count: plan.member_limit })
                        : t('limits.members_unlimited')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    <span>
                      {t('limits.storage', { amount: plan.storage_limit_gb })}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <div className="mb-8 flex-1 space-y-3">
                  {featureKeys.map((key) => {
                    const hasFeature = plan.features[key] === true
                    if (!hasFeature) return null

                    return (
                      <div key={key} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span className="text-sm">{t(`features.${key}`)}</span>
                      </div>
                    )
                  })}
                </div>

                {/* CTA Button */}
                <Link
                  to={isFree ? '/signup' : isEnterprise ? '/contact' : '/signup'}
                  className={`block rounded-lg px-6 py-3 text-center font-semibold transition-colors ${
                    plan.is_popular
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'border-2 border-primary bg-background text-primary hover:bg-primary hover:text-primary-foreground'
                  }`}
                >
                  {isEnterprise ? t('cta.contactSales') : t('cta.getStarted')}
                </Link>
              </div>
            )
          })}
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="container mx-auto px-4 pb-16">
        <h2 className="mb-8 text-center text-3xl font-bold">
          {t('comparisonTable.title')}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="p-4 text-start font-semibold">
                  {t('comparisonTable.allFeatures')}
                </th>
                {plans.map((plan) => (
                  <th key={plan.id} className="p-4 text-center font-semibold">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {featureKeys.map((key) => (
                <tr key={key} className="border-b hover:bg-muted/50">
                  <td className="p-4">{t(`features.${key}`)}</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="p-4 text-center">
                      {plan.features[key] ? (
                        <Check className="mx-auto h-5 w-5 text-primary" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="container mx-auto px-4 pb-24">
        <h2 className="mb-8 text-center text-3xl font-bold">
          {t('faq.title')}
        </h2>
        <div className="mx-auto max-w-3xl space-y-6">
          {(t('faq.questions', { returnObjects: true }) as any[]).map(
            (faq, index) => (
              <details
                key={index}
                className="group rounded-lg border bg-card p-6 shadow-sm"
              >
                <summary className="cursor-pointer font-semibold marker:text-primary">
                  {faq.question}
                </summary>
                <p className="mt-4 text-muted-foreground">{faq.answer}</p>
              </details>
            )
          )}
        </div>
      </div>
    </div>
  )
}

export default PricingPage
