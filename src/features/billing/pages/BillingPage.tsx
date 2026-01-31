import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useOrganization } from '@/app/providers/OrganizationProvider'
import { supabase } from '@/lib/supabase/client'
import { SubscriptionPlan, PlanPricing } from '../types'

export default function BillingPage() {
  const { currentOrganizationId, currentOrganization } = useOrganization()
  const [showChangePlanModal, setShowChangePlanModal] = useState(false)
  const [selectedNewPlan, setSelectedNewPlan] = useState<SubscriptionPlan | null>(null)
  const [loading, setLoading] = useState(false)

  const currencySymbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    CAD: 'CA$',
    AUD: 'AU$',
    TRY: '₺',
  }

  // Fetch subscription
  const { data: subscription } = useQuery({
    queryKey: ['subscription', currentOrganizationId],
    queryFn: async () => {
      if (!currentOrganizationId) return null

      const { data, error } = await supabase
        .from('organization_subscriptions')
        .select('*, plan:subscription_plans(*)')
        .eq('organization_id', currentOrganizationId)
        .maybeSingle()

      if (error) throw error
      return data
    },
    enabled: !!currentOrganizationId,
  })

  // Fetch available plans
  const { data: plans = [] } = useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      if (error) throw error
      return data as SubscriptionPlan[]
    },
  })

  // Fetch pricing for current country
  const { data: pricing = [] } = useQuery({
    queryKey: ['pricing', currentOrganization?.country_id],
    queryFn: async () => {
      if (!currentOrganization?.country_id) return []

      const { data, error } = await supabase
        .from('plan_pricing')
        .select('*, plan:subscription_plans(*), country:countries(*)')
        .eq('country_id', currentOrganization.country_id)

      if (error) throw error
      return data as PlanPricing[]
    },
    enabled: !!currentOrganization?.country_id,
  })

  const plan = subscription?.plan
  const isTrialing = subscription?.status === 'trialing'
  const isPastDue = subscription?.status === 'past_due'
  const isActive = subscription?.status === 'active'

  const trialDaysLeft = isTrialing && subscription?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0

  const getPriceForPlan = (planId: string, cycle: 'monthly' | 'yearly') => {
    const planPricing = pricing.find((p) => p.plan_id === planId)
    if (!planPricing) return 0
    return cycle === 'monthly' ? planPricing.price_monthly : planPricing.price_yearly
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      active: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300', label: 'Active' },
      trialing: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-300', label: 'Trial' },
      past_due: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-300', label: 'Past Due' },
      cancelled: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-800 dark:text-gray-300', label: 'Cancelled' },
      paused: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-300', label: 'Paused' },
    }

    const config = statusConfig[status] || statusConfig.active

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    )
  }

  const currencySymbol =
    currencySymbols[currentOrganization?.country?.currency_code || 'USD'] || '$'
  const currentPrice = getPriceForPlan(plan?.id || '', subscription?.billing_cycle || 'monthly')

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Billing & Subscription</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your plan, billing, and usage</p>
      </div>

      {/* Trial banner */}
      {isTrialing && (
        <div
          className={`mb-6 rounded-lg p-4 ${
            trialDaysLeft <= 3
              ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800'
              : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
          }`}
        >
          <div className="flex items-start">
            <svg
              className={`w-5 h-5 mr-2 mt-0.5 ${
                trialDaysLeft <= 3 ? 'text-orange-600 dark:text-orange-400' : 'text-blue-600 dark:text-blue-400'
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <p
                className={`text-sm font-medium ${
                  trialDaysLeft <= 3 ? 'text-orange-900 dark:text-orange-300' : 'text-blue-900 dark:text-blue-300'
                }`}
              >
                {trialDaysLeft} days left in your trial
              </p>
              <p
                className={`text-sm mt-1 ${
                  trialDaysLeft <= 3 ? 'text-orange-700 dark:text-orange-400' : 'text-blue-700 dark:text-blue-400'
                }`}
              >
                Your trial ends on {new Date(subscription.trial_ends_at).toLocaleDateString()}.
                {subscription.external_customer_id
                  ? ' You will be charged automatically.'
                  : ' Please add a payment method to continue.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Past due banner */}
      {isPastDue && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900 dark:text-red-300">Payment Required</p>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                Your payment failed. Please update your payment method to restore access to paid features.
              </p>
            </div>
            <button className="ml-4 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700">
              Update Payment
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Current Plan */}
        <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg shadow-sm p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Current Plan</h2>

          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{plan?.name || 'Free'}</h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">{plan?.description}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {plan?.name === 'Free' ? 'Free' : `${currencySymbol}${currentPrice}`}
              </div>
              {plan?.name !== 'Free' && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  per {subscription?.billing_cycle === 'monthly' ? 'month' : 'year'}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
            <div>{getStatusBadge(subscription?.status || 'active')}</div>
          </div>

          {subscription?.billing_cycle && (
            <div className="flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">Billing Cycle</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                {subscription.billing_cycle}
              </span>
            </div>
          )}

          {subscription?.current_period_end && (
            <div className="flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {subscription.status === 'cancelled' ? 'Access Until' : 'Next Billing Date'}
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {new Date(subscription.current_period_end).toLocaleDateString()}
              </span>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setShowChangePlanModal(true)}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Change Plan
            </button>
            {plan?.name !== 'Free' && subscription?.status !== 'cancelled' && (
              <button
                disabled={loading}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Cancel Subscription
              </button>
            )}
          </div>
        </div>

        {/* Usage Summary */}
        <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Usage</h2>

          <div className="space-y-4">
            {/* Members */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Members</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  0 / {plan?.member_limit === -1 || !plan?.member_limit ? 'Unlimited' : plan.member_limit}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '0%' }}></div>
              </div>
            </div>

            {/* Storage */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Storage</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  0 GB / {plan?.storage_limit_gb || 1} GB
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '0%' }}></div>
              </div>
            </div>

            {/* Features */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Features</p>
              <div className="space-y-2">
                {plan?.features?.donations && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <svg
                      className="w-4 h-4 text-green-600 dark:text-green-400 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Donations & Finance
                  </div>
                )}
                {plan?.features?.education && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <svg
                      className="w-4 h-4 text-green-600 dark:text-green-400 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Education & Classes
                  </div>
                )}
                {plan?.features?.umrah && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <svg
                      className="w-4 h-4 text-green-600 dark:text-green-400 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Umrah/Hajj
                  </div>
                )}
                {plan?.features?.cases && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <svg
                      className="w-4 h-4 text-green-600 dark:text-green-400 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Service Cases
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method */}
      {subscription?.external_customer_id && (
        <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment Method</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-8 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center mr-3">
                <svg className="w-8 h-6 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M0 4a2 2 0 012-2h20a2 2 0 012 2v4H0V4zm0 6h24v10a2 2 0 01-2 2H2a2 2 0 01-2-2V10zm8 6a1 1 0 011-1h6a1 1 0 110 2H9a1 1 0 01-1-1z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">•••• •••• •••• ••••</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Managed by Stripe</p>
              </div>
            </div>
            <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm">
              Update
            </button>
          </div>
        </div>
      )}

      {/* Change Plan Modal */}
      {showChangePlanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Change Plan</h2>
                <button
                  onClick={() => setShowChangePlanModal(false)}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plans.map((planOption) => {
                  const price = getPriceForPlan(planOption.id, subscription?.billing_cycle || 'monthly')
                  const isCurrent = planOption.id === plan?.id

                  return (
                    <div
                      key={planOption.id}
                      onClick={() => !isCurrent && setSelectedNewPlan(planOption)}
                      className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                        selectedNewPlan?.id === planOption.id
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                          : isCurrent
                          ? 'border-gray-400 bg-gray-50 dark:bg-gray-800 opacity-75'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                      }`}
                    >
                      {isCurrent && (
                        <span className="inline-block px-2 py-1 bg-gray-600 text-white text-xs font-semibold rounded mb-2">
                          Current Plan
                        </span>
                      )}
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{planOption.name}</h3>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white my-2">
                        {planOption.name === 'Free' ? 'Free' : `${currencySymbol}${price}`}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{planOption.description}</p>
                    </div>
                  )
                })}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowChangePlanModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  disabled={!selectedNewPlan || loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Continue to Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
