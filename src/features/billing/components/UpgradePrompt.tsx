import { useNavigate } from 'react-router-dom'
import { Users, ArrowRight, Check, AlertCircle } from 'lucide-react'

interface UpgradePromptProps {
  /** User's current plan name */
  currentPlan: string
  /** Plan name required for more members */
  requiredPlan: string
  /** Current member count */
  currentMembers: number
  /** Current plan's member limit */
  memberLimit: number
}

/**
 * UpgradePrompt Component
 *
 * ALL FEATURES ARE NOW AVAILABLE TO ALL PLANS
 * This component now only shows for member limit restrictions
 */
export default function UpgradePrompt({
  currentPlan,
  requiredPlan,
  currentMembers,
  memberLimit,
}: UpgradePromptProps) {
  const navigate = useNavigate()

  // Plan details by tier (member-count based)
  const planDetails: Record<string, { limit: number | null; features: string[] }> = {
    Free: {
      limit: 10,
      features: [
        'Up to 10 members',
        'All features included',
        'Donations & Finance tracking',
        'Education Management',
        'Umrah/Hajj Management',
        'Service Case Management',
        'Email support',
      ],
    },
    Basic: {
      limit: 50,
      features: [
        'Up to 50 members',
        'All features included',
        'Everything from Free',
        'Priority email support',
        'Advanced reporting',
      ],
    },
    Pro: {
      limit: 500,
      features: [
        'Up to 500 members',
        'All features included',
        'Everything from Basic',
        'Priority support',
        'Dedicated account manager',
      ],
    },
    Enterprise: {
      limit: null,
      features: [
        'Unlimited members',
        'All features included',
        'Everything from Pro',
        'Custom integrations',
        'API access',
        'White-label options',
        '24/7 priority support',
      ],
    },
  }

  const details = planDetails[requiredPlan] || planDetails.Basic

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 dark:from-teal-600 dark:to-teal-700 p-8 text-white">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white/20 rounded-full p-4">
              <Users size={32} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center mb-2">
            Member Limit Reached
          </h2>
          <p className="text-teal-50 text-center">
            Your <span className="font-semibold">{currentPlan}</span> plan supports up to{' '}
            <span className="font-semibold">{memberLimit} members</span>
          </p>
        </div>

        {/* Body */}
        <div className="p-8">
          {/* Member Usage */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="font-medium text-amber-900 dark:text-amber-100 mb-1">
                You have {currentMembers} of {memberLimit} members
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Upgrade to add more members to your organization
              </p>
            </div>
          </div>

          {/* Plan Comparison */}
          <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-slate-400">Current Plan</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{currentPlan}</p>
                <p className="text-sm text-gray-500 dark:text-slate-400">Up to {memberLimit} members</p>
              </div>
              <ArrowRight className="text-gray-400 dark:text-slate-600" size={24} />
              <div>
                <p className="text-sm text-gray-600 dark:text-slate-400">Recommended Plan</p>
                <p className="text-lg font-semibold text-teal-600 dark:text-teal-400">{requiredPlan}</p>
                <p className="text-sm text-teal-600 dark:text-teal-400">
                  {details.limit ? `Up to ${details.limit} members` : 'Unlimited members'}
                </p>
              </div>
            </div>
          </div>

          {/* Features List */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              What's included in {requiredPlan}:
            </h3>
            <ul className="space-y-2">
              {details.features.map((feat, index) => (
                <li key={index} className="flex items-start">
                  <Check className="text-teal-500 dark:text-teal-400 mr-2 flex-shrink-0 mt-0.5" size={20} />
                  <span className="text-gray-700 dark:text-slate-300">{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Important Note */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Good news!</strong> All features are available on all plans.
              Plans differ only by the number of members you can add.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/admin/billing')}
              className="flex-1 bg-teal-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 transition-colors text-center"
            >
              Upgrade to {requiredPlan}
            </button>
            <button
              onClick={() => navigate('/pricing')}
              className="flex-1 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-center"
            >
              View All Plans
            </button>
          </div>

          {/* Help Text */}
          <p className="text-center text-sm text-gray-500 dark:text-slate-400 mt-4">
            Have questions?{' '}
            <a
              href="mailto:support@mosqos.com"
              className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300"
            >
              Contact our team
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
