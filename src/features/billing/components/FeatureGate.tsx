import { useFeatureGate } from '../hooks/useFeatureGate'
import UpgradePrompt from './UpgradePrompt'

interface FeatureGateProps {
  /** Name of required feature */
  feature: string
  /** Organization ID */
  organizationId: string | null
  /** Content to show if access granted */
  children: React.ReactNode
  /** Optional custom fallback (default: UpgradePrompt) */
  fallback?: React.ReactNode
}

/**
 * FeatureGate Component
 *
 * Wraps content that requires a specific feature/plan
 * Shows UpgradePrompt if user doesn't have access
 *
 * Note: Current implementation makes all features available to all plans.
 * Plans differ only by member count limits, not features.
 *
 * @example
 * <FeatureGate feature="education" organizationId={orgId}>
 *   <EducationModule />
 * </FeatureGate>
 */
export default function FeatureGate({
  feature,
  organizationId,
  children,
  fallback,
}: FeatureGateProps) {
  const { hasAccess, loading, currentPlan, requiredPlan } = useFeatureGate(feature, organizationId)

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 dark:border-teal-400"></div>
      </div>
    )
  }

  // If has access, show children
  if (hasAccess) {
    return <>{children}</>
  }

  // If custom fallback provided, use it
  if (fallback) {
    return <>{fallback}</>
  }

  // Default: show upgrade prompt
  return (
    <UpgradePrompt
      currentPlan={currentPlan}
      requiredPlan={requiredPlan}
      currentMembers={0}
      memberLimit={10}
    />
  )
}
