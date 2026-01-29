import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import {
  SubscriptionStatus,
  BillingCycle,
} from '../types/billing.types'
import type {
  OrganizationSubscription,
  SubscriptionPlan,
  PlanFeatures,
} from '../types/billing.types'

interface SubscriptionWithPlan extends OrganizationSubscription {
  plan: SubscriptionPlan
}

interface UseSubscriptionOptions {
  /** Organization ID to fetch subscription for */
  organizationId: string | null
  /** Enable realtime updates */
  enableRealtime?: boolean
}

interface UseSubscriptionReturn {
  // Core data
  subscription: SubscriptionWithPlan | null
  plan: SubscriptionPlan | null
  loading: boolean
  error: string | null

  // Status checks
  isActive: boolean
  isTrialing: boolean
  isPastDue: boolean
  isCancelled: boolean
  isPaused: boolean
  isUnpaid: boolean

  // Trial information
  trialEndsAt: string | null
  trialDaysLeft: number | null
  isTrialEndingSoon: boolean

  // Billing information
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  billingCycle: BillingCycle
  cancelAtPeriodEnd: boolean

  // Plan limits and features
  memberLimit: number | null
  storageLimit: number | null
  features: PlanFeatures
  currentMemberCount: number
  currentStorageUsedMb: number

  // Usage checks
  isAtMemberLimit: boolean
  membersRemaining: number | null
  memberUsagePercentage: number

  // Actions
  refresh: () => void
}

/**
 * Hook to manage subscription state for an organization
 * Fetches subscription details, plan information, and trial status
 *
 * @param options - Configuration options
 * @returns Subscription state and helpers
 *
 * @example
 * const { isTrialing, trialDaysLeft, plan, features } = useSubscription({ organizationId })
 *
 * if (isTrialing && trialDaysLeft <= 3) {
 *   // Show trial ending banner
 * }
 */
export function useSubscription(options: UseSubscriptionOptions): UseSubscriptionReturn {
  const { organizationId, enableRealtime = true } = options
  const queryClient = useQueryClient()

  const queryKey = ['subscription', organizationId]

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!organizationId) return null

      const { data, error } = await supabase
        .from('organization_subscriptions')
        .select(
          `
          *,
          plan:subscription_plans(
            id,
            name,
            slug,
            description,
            tier,
            member_limit,
            admin_limit,
            storage_limit_gb,
            features,
            is_popular,
            sort_order,
            is_active,
            created_at,
            updated_at
          )
        `
        )
        .eq('organization_id', organizationId)
        .single()

      if (error) {
        // No subscription found is not an error - organization might be on free plan
        if (error.code === 'PGRST116') {
          return null
        }
        throw error
      }

      return data as SubscriptionWithPlan
    },
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  // Set up realtime subscription updates
  useEffect(() => {
    if (!organizationId || !enableRealtime) return

    const channel = supabase
      .channel(`subscription-${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'organization_subscriptions',
          filter: `organization_id=eq.${organizationId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey })
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [organizationId, enableRealtime, queryClient, queryKey])

  const subscription = query.data || null
  const plan = subscription?.plan || null

  // Calculate trial days remaining
  const calculateTrialDaysLeft = (): number | null => {
    if (!subscription?.trial_ends_at) return null

    const trialEndsAt = new Date(subscription.trial_ends_at)
    const now = new Date()
    const diffTime = trialEndsAt.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return Math.max(0, diffDays)
  }

  const trialDaysLeft = calculateTrialDaysLeft()

  // Calculate member usage
  const memberLimit = plan?.member_limit ?? null
  const currentMemberCount = subscription?.current_member_count ?? 0
  const isAtMemberLimit = memberLimit !== null && currentMemberCount >= memberLimit
  const membersRemaining =
    memberLimit !== null ? Math.max(0, memberLimit - currentMemberCount) : null
  const memberUsagePercentage =
    memberLimit !== null && memberLimit > 0
      ? Math.round((currentMemberCount / memberLimit) * 100)
      : 0

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey })
  }

  const defaultFeatures: PlanFeatures = {
    donations: false,
    education: false,
    cases: false,
    umrah: false,
    qurbani: false,
    islamic_services: false,
    api_access: false,
    custom_domain: false,
    white_label: false,
    priority_support: false,
    advanced_reports: false,
    bank_reconciliation: false,
  }

  return {
    // Core data
    subscription,
    plan,
    loading: query.isLoading,
    error: query.error?.message || null,

    // Status checks
    isActive: subscription?.status === SubscriptionStatus.ACTIVE,
    isTrialing: subscription?.status === SubscriptionStatus.TRIALING,
    isPastDue: subscription?.status === SubscriptionStatus.PAST_DUE,
    isCancelled: subscription?.status === SubscriptionStatus.CANCELED,
    isPaused: subscription?.status === SubscriptionStatus.PAUSED,
    isUnpaid: subscription?.status === SubscriptionStatus.UNPAID,

    // Trial information
    trialEndsAt: subscription?.trial_ends_at || null,
    trialDaysLeft,
    isTrialEndingSoon: trialDaysLeft !== null && trialDaysLeft <= 3 && trialDaysLeft > 0,

    // Billing information
    currentPeriodStart: subscription?.current_period_start || null,
    currentPeriodEnd: subscription?.current_period_end || null,
    billingCycle: subscription?.billing_cycle || BillingCycle.MONTHLY,
    cancelAtPeriodEnd: subscription?.cancel_at_period_end ?? false,

    // Plan limits and features
    memberLimit,
    storageLimit: plan?.storage_limit_gb ?? null,
    features: plan?.features || defaultFeatures,
    currentMemberCount,
    currentStorageUsedMb: subscription?.current_storage_used_mb ?? 0,

    // Usage checks
    isAtMemberLimit,
    membersRemaining,
    memberUsagePercentage,

    // Actions
    refresh,
  }
}

/**
 * Hook to check if a specific feature is available in the current plan
 *
 * @param featureName - Name of the feature to check
 * @param organizationId - Organization ID
 * @returns Whether the feature is available
 */
export function useHasFeature(
  featureName: keyof PlanFeatures,
  organizationId: string | null
): boolean {
  const { plan, loading } = useSubscription({ organizationId })

  if (loading) return false
  if (!plan) return false

  return plan.features?.[featureName] === true
}

interface LimitCheckResult {
  hasReachedLimit: boolean
  limit: number | null
  remaining: number | null
  loading: boolean
  percentage: number
}

type LimitType = 'members' | 'storage' | 'admins'

/**
 * Hook to check if organization has reached a specific limit
 *
 * @param limitType - Type of limit ('members', 'storage', 'admins')
 * @param currentValue - Current value to compare against limit
 * @param organizationId - Organization ID
 * @returns Limit status
 */
export function useCheckLimit(
  limitType: LimitType,
  currentValue: number,
  organizationId: string | null
): LimitCheckResult {
  const { plan, loading } = useSubscription({ organizationId })

  if (loading) {
    return { hasReachedLimit: false, limit: null, remaining: null, loading: true, percentage: 0 }
  }

  let limit: number | null = null

  switch (limitType) {
    case 'members':
      limit = plan?.member_limit ?? null
      break
    case 'storage':
      limit = plan?.storage_limit_gb ?? null
      break
    case 'admins':
      limit = plan?.admin_limit ?? null
      break
    default:
      limit = null
  }

  // No limit means unlimited
  if (limit === null) {
    return { hasReachedLimit: false, limit: null, remaining: null, loading: false, percentage: 0 }
  }

  const hasReachedLimit = currentValue >= limit
  const remaining = Math.max(0, limit - currentValue)
  const percentage = limit > 0 ? (currentValue / limit) * 100 : 0

  return {
    hasReachedLimit,
    limit,
    remaining,
    loading: false,
    percentage,
  }
}
