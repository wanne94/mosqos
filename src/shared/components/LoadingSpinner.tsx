import { Loader2 } from 'lucide-react'

export interface LoadingSpinnerProps {
  /** Custom loading message */
  message?: string
  /** Size of the spinner: 'sm' | 'md' | 'lg' */
  size?: 'sm' | 'md' | 'lg'
  /** Whether to show full screen or inline */
  fullScreen?: boolean
  /** Custom class name */
  className?: string
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-16 w-16',
  lg: 'h-24 w-24',
}

/**
 * LoadingSpinner Component
 *
 * Used as fallback for React.lazy() Suspense boundaries
 * or as inline loading indicator
 *
 * @example
 * // Full screen loader
 * <LoadingSpinner message="Loading data..." />
 *
 * // Inline loader
 * <LoadingSpinner size="sm" fullScreen={false} />
 */
export function LoadingSpinner({
  message = 'Loading...',
  size = 'md',
  fullScreen = true,
  className = '',
}: LoadingSpinnerProps) {
  const spinnerClass = sizeClasses[size]

  if (fullScreen) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <Loader2
            className={`${spinnerClass} text-emerald-600 dark:text-emerald-400 animate-spin mx-auto mb-4`}
          />
          <p className="text-slate-700 dark:text-slate-300 text-lg font-medium">
            {message}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex items-center justify-center p-4 ${className}`}>
      <Loader2
        className={`${spinnerClass} text-emerald-600 dark:text-emerald-400 animate-spin`}
      />
      {message && (
        <span className="ml-3 text-slate-700 dark:text-slate-300">{message}</span>
      )}
    </div>
  )
}

/**
 * Inline loading spinner without message
 * Useful for button loading states
 */
export function InlineSpinner({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  const spinnerClass = sizeClasses[size]
  return (
    <Loader2
      className={`${spinnerClass} text-current animate-spin inline-block`}
    />
  )
}

export default LoadingSpinner
