import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSubscription } from '../hooks/useSubscription'

interface TrialBannerProps {
  organizationId: string | null
}

/**
 * TrialBanner Component
 *
 * Shows a banner at the top of the app when subscription is in trial period
 * Displays countdown and encourages adding payment method
 */
export default function TrialBanner({ organizationId }: TrialBannerProps) {
  const navigate = useNavigate()
  const {
    isTrialing,
    trialDaysLeft,
    plan,
    loading,
  } = useSubscription({ organizationId })

  const [dismissed, setDismissed] = useState(false)

  // Don't show if not trialing, loading, or dismissed
  if (!isTrialing || loading || dismissed) {
    return null
  }

  const handleAddPayment = () => {
    navigate('/admin/billing')
  }

  const handleDismiss = () => {
    setDismissed(true)
    // Store dismissal in sessionStorage so it persists during session
    sessionStorage.setItem('trial-banner-dismissed', 'true')
  }

  // Check if was dismissed this session
  useEffect(() => {
    const wasDismissed = sessionStorage.getItem('trial-banner-dismissed')
    if (wasDismissed) {
      setDismissed(true)
    }
  }, [])

  // Determine banner color based on days left
  const getBannerColor = () => {
    if (trialDaysLeft === 0) return 'bg-red-600 dark:bg-red-700'
    if (trialDaysLeft && trialDaysLeft <= 3) return 'bg-orange-600 dark:bg-orange-700'
    return 'bg-blue-600 dark:bg-blue-700'
  }

  // Get message based on days left
  const getMessage = () => {
    if (trialDaysLeft === 0) {
      return 'Your trial ends today!'
    }
    if (trialDaysLeft === 1) {
      return 'Your trial ends tomorrow'
    }
    return `${trialDaysLeft} days left in your trial`
  }

  return (
    <div className={`${getBannerColor()} text-white`}>
      <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between flex-wrap">
          <div className="w-0 flex-1 flex items-center">
            <span className="flex p-2 rounded-lg bg-white bg-opacity-20">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </span>
            <p className="ml-3 font-medium">
              <span className="md:hidden">{getMessage()}</span>
              <span className="hidden md:inline">
                <span className="font-bold">{getMessage()}</span>
                {' on your '}
                <span className="font-semibold">{plan?.name || 'trial'}</span>
                {' plan. '}
                Add a payment method to continue after your trial.
              </span>
            </p>
          </div>
          <div className="order-3 mt-2 flex-shrink-0 w-full sm:order-2 sm:mt-0 sm:w-auto">
            <button
              onClick={handleAddPayment}
              className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-blue-600 dark:text-blue-700 bg-white hover:bg-blue-50 dark:hover:bg-blue-100 transition-colors duration-200"
            >
              Add Payment Method
            </button>
          </div>
          <div className="order-2 flex-shrink-0 sm:order-3 sm:ml-3">
            <button
              type="button"
              onClick={handleDismiss}
              className="-mr-1 flex p-2 rounded-md hover:bg-white hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-white transition-colors duration-200"
            >
              <span className="sr-only">Dismiss</span>
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * PastDueBanner Component
 *
 * Shows when subscription is past due (payment failed or trial expired without payment)
 */
export function PastDueBanner({ organizationId }: TrialBannerProps) {
  const navigate = useNavigate()
  const { isPastDue, loading } = useSubscription({ organizationId })

  const [dismissed, setDismissed] = useState(false)

  if (!isPastDue || loading || dismissed) {
    return null
  }

  const handleUpdatePayment = () => {
    navigate('/admin/billing')
  }

  const handleDismiss = () => {
    setDismissed(true)
    sessionStorage.setItem('past-due-banner-dismissed', 'true')
  }

  useEffect(() => {
    const wasDismissed = sessionStorage.getItem('past-due-banner-dismissed')
    if (wasDismissed) {
      setDismissed(true)
    }
  }, [])

  return (
    <div className="bg-red-600 dark:bg-red-700 text-white">
      <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between flex-wrap">
          <div className="w-0 flex-1 flex items-center">
            <span className="flex p-2 rounded-lg bg-white bg-opacity-20">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </span>
            <p className="ml-3 font-medium">
              <span className="font-bold">Payment Required</span>
              {' - Your subscription is past due. '}
              Update your payment method to restore full access.
            </p>
          </div>
          <div className="order-3 mt-2 flex-shrink-0 w-full sm:order-2 sm:mt-0 sm:w-auto">
            <button
              onClick={handleUpdatePayment}
              className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-red-600 dark:text-red-700 bg-white hover:bg-red-50 dark:hover:bg-red-100 transition-colors duration-200"
            >
              Update Payment Method
            </button>
          </div>
          <div className="order-2 flex-shrink-0 sm:order-3 sm:ml-3">
            <button
              type="button"
              onClick={handleDismiss}
              className="-mr-1 flex p-2 rounded-md hover:bg-white hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-white transition-colors duration-200"
            >
              <span className="sr-only">Dismiss</span>
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * SubscriptionBanner Component
 *
 * Combines trial and past-due banners
 * Shows appropriate banner based on subscription status
 */
export function SubscriptionBanner({ organizationId }: TrialBannerProps) {
  const { isTrialing, isPastDue, loading } = useSubscription({ organizationId })

  if (loading) return null

  if (isPastDue) {
    return <PastDueBanner organizationId={organizationId} />
  }

  if (isTrialing) {
    return <TrialBanner organizationId={organizationId} />
  }

  return null
}
