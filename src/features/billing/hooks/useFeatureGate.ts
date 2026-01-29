import { useSubscription } from './useSubscription'
import type { PlanFeatures } from '../types/billing.types'

interface FeatureGateResult {
  /** Whether user has access to the feature */
  hasAccess: boolean
  /** Loading state */
  loading: boolean
  /** Current plan name */
  currentPlan: string
  /** Minimum plan required for this feature */
  requiredPlan: string
  /** Whether user needs to upgrade */
  needsUpgrade: boolean
  /** Feature being checked */
  feature: string
}

/**
 * Module to feature mapping
 * Maps user-facing module names to plan feature flags
 */
const MODULE_FEATURE_MAP: Record<string, keyof PlanFeatures | null> = {
  // Members module - always available
  members: null,
  people: null,
  households: null,

  // Finance modules
  donations: 'donations',
  finance: 'donations',
  expenses: 'donations',
  funds: 'donations',
  pledges: 'donations',
  reports: 'advanced_reports',

  // Education module
  education: 'education',
  courses: 'education',
  classes: 'education',
  enrollments: 'education',

  // Services modules
  cases: 'cases',
  services: 'islamic_services',
  islamic_services: 'islamic_services',

  // Travel modules
  umrah: 'umrah',
  hajj: 'umrah',
  trips: 'umrah',

  // Qurbani module
  qurbani: 'qurbani',

  // Premium features
  api: 'api_access',
  api_access: 'api_access',
  custom_domain: 'custom_domain',
  white_label: 'white_label',
  priority_support: 'priority_support',
  bank_reconciliation: 'bank_reconciliation',
}

/**
 * useFeatureGate Hook
 *
 * Check if a feature is available in the current plan.
 * Note: Current implementation makes all features available to all plans.
 * Plans differ only by member count limits, not features.
 *
 * @param featureName - Name of the feature to check
 * @param organizationId - Organization ID
 * @returns Feature access information
 *
 * @example
 * const { hasAccess, needsUpgrade, currentPlan } = useFeatureGate('education', orgId)
 *
 * if (!hasAccess) {
 *   return <UpgradePrompt plan={requiredPlan} />
 * }
 */
export function useFeatureGate(
  featureName: string,
  organizationId: string | null
): FeatureGateResult {
  const { plan, loading } = useSubscription({ organizationId })

  // Current implementation: ALL FEATURES ARE AVAILABLE TO ALL PLANS
  // Plans differ only by member count limits
  // To enable feature restrictions, uncomment the hasAccess logic below:
  //
  // const featureFlag = MODULE_FEATURE_MAP[featureName]
  // const hasAccess =
  //   featureFlag === null || // No restriction
  //   featureFlag === undefined || // Unknown feature - allow by default
  //   features?.[featureFlag] === true // Feature enabled in plan

  return {
    hasAccess: true, // Always true - no feature restrictions currently
    loading,
    currentPlan: plan?.name || 'Free',
    requiredPlan: 'Free', // All features available on Free plan
    needsUpgrade: false, // Never need to upgrade for features
    feature: featureName,
  }
}

/**
 * useModuleAccess Hook
 *
 * Check access to entire modules (combinations of features)
 * Alias for useFeatureGate with module-specific naming
 *
 * @param moduleName - Name of the module
 * @param organizationId - Organization ID
 * @returns Module access information
 *
 * @example
 * const { hasAccess } = useModuleAccess('education', orgId)
 *
 * if (!hasAccess) {
 *   return <Navigate to="/upgrade" />
 * }
 */
export function useModuleAccess(
  moduleName: string,
  organizationId: string | null
): FeatureGateResult {
  return useFeatureGate(moduleName, organizationId)
}

/**
 * Hook to check multiple features at once
 *
 * @param features - Array of feature names to check
 * @param organizationId - Organization ID
 * @returns Object with feature access states
 *
 * @example
 * const access = useMultipleFeatures(['education', 'umrah', 'cases'], orgId)
 *
 * if (access.education && access.umrah) {
 *   // Show combined education + umrah features
 * }
 */
export function useMultipleFeatures(
  features: string[],
  organizationId: string | null
): Record<string, boolean> & { loading: boolean } {
  const { features: planFeatures, loading } = useSubscription({ organizationId })

  const result: Record<string, boolean> & { loading: boolean } = { loading }

  for (const feature of features) {
    const featureFlag = MODULE_FEATURE_MAP[feature]

    // All features currently available
    result[feature] =
      featureFlag === null ||
      featureFlag === undefined ||
      planFeatures?.[featureFlag] === true ||
      true // Remove this line to enable feature restrictions
  }

  return result
}

export type { FeatureGateResult }
