/**
 * Centralized error handling utility
 * Provides consistent error handling across the application
 *
 * @module errorHandler
 * @description Error handling utilities for both client and server
 *
 * @example
 * ```typescript
 * import { handleError, withErrorHandling } from '@/shared/lib/errorHandler'
 *
 * try {
 *   await supabase.from('table').insert(data)
 * } catch (error) {
 *   handleError(error, 'Failed to save data')
 * }
 *
 * // Or use withErrorHandling wrapper
 * const { data, error } = await withErrorHandling(
 *   supabase.from('table').insert(data),
 *   'Failed to save data'
 * )
 * ```
 */

/**
 * Supabase error type
 */
interface SupabaseError {
  message?: string
  code?: string
  hint?: string
  details?: string
}

/**
 * Error handling options
 */
export interface ErrorHandlerOptions {
  /** Show toast notification (default: true) */
  showToast?: boolean
  /** Log to console (default: true) */
  logToConsole?: boolean
  /** Custom error callback */
  onError?: (error: unknown, message: string) => void
}

/**
 * Result object from withErrorHandling
 */
export interface ErrorHandlingResult<T> {
  data: T | null
  error: string | null
}

/**
 * Toast interface for window
 */
declare global {
  interface Window {
    __toast?: {
      error: (message: string) => void
      success: (message: string) => void
      info: (message: string) => void
    }
  }
}

/**
 * Extract user-friendly error message from various error types
 *
 * @param error - The error object
 * @returns User-friendly error message
 */
function extractErrorMessage(error: unknown): string {
  // Supabase error
  if (error && typeof error === 'object' && 'message' in error) {
    const supabaseError = error as SupabaseError
    // Don't expose database error details in production
    if (supabaseError.code && supabaseError.hint) {
      return 'A database error occurred. Please try again.'
    }
    return supabaseError.message || 'An unexpected error occurred'
  }

  // Error instance
  if (error instanceof Error) {
    return error.message
  }

  // String error
  if (typeof error === 'string') {
    return error
  }

  // Unknown error
  return 'An unexpected error occurred'
}

/**
 * Handle errors consistently across the application
 *
 * @param error - The error object or message
 * @param customMessage - Optional custom user-facing message
 * @param options - Optional configuration
 * @returns The user-facing error message
 *
 * @example
 * ```typescript
 * try {
 *   await someAsyncOperation()
 * } catch (error) {
 *   handleError(error, 'Operation failed', {
 *     showToast: true,
 *     logToConsole: true,
 *     onError: (err, msg) => {
 *       // Custom handling
 *     }
 *   })
 * }
 * ```
 */
export function handleError(
  error: unknown,
  customMessage?: string,
  options: ErrorHandlerOptions = {}
): string {
  const { showToast = true, logToConsole = true, onError } = options

  // Log to console for debugging
  if (logToConsole) {
    console.error('Error:', error)
  }

  // Get user-friendly message
  const userMessage = customMessage || extractErrorMessage(error)

  // Show toast notification (requires toast context to be available)
  if (showToast && typeof window !== 'undefined') {
    // Check if toast is available in window (set by ToastContext)
    if (window.__toast?.error) {
      window.__toast.error(userMessage)
    } else {
      // Fallback to alert if toast is not available
      alert(userMessage)
    }
  }

  // Call custom error handler if provided
  if (onError) {
    onError(error, userMessage)
  }

  return userMessage
}

/**
 * Handle async operations with automatic error handling
 *
 * @param promise - The async operation
 * @param errorMessage - Error message to show if operation fails
 * @param options - Optional configuration
 * @returns Result object with data or error
 *
 * @example
 * ```typescript
 * const { data, error } = await withErrorHandling(
 *   fetchUserData(userId),
 *   'Failed to load user data'
 * )
 *
 * if (error) {
 *   // Handle error
 *   return
 * }
 *
 * // Use data
 * console.log(data)
 * ```
 */
export async function withErrorHandling<T>(
  promise: Promise<T>,
  errorMessage?: string,
  options: ErrorHandlerOptions = {}
): Promise<ErrorHandlingResult<T>> {
  try {
    const data = await promise
    return { data, error: null }
  } catch (error) {
    const message = handleError(error, errorMessage, options)
    return { data: null, error: message }
  }
}

/**
 * Validation error helper
 *
 * @param errors - Validation errors object
 * @param message - Optional message
 *
 * @example
 * ```typescript
 * const errors = {
 *   email: 'Invalid email format',
 *   password: 'Password too short'
 * }
 *
 * handleValidationErrors(errors, 'Please fix the following errors')
 * ```
 */
export function handleValidationErrors(
  errors: Record<string, string | undefined | null>,
  message = 'Please fix the validation errors'
): void {
  const errorMessages = Object.values(errors).filter(Boolean) as string[]
  if (errorMessages.length > 0) {
    handleError(errorMessages.join(', '), message)
  }
}

/**
 * Type guard to check if error is a Supabase error
 *
 * @param error - The error to check
 * @returns True if error is a Supabase error
 */
export function isSupabaseError(error: unknown): error is SupabaseError {
  return (
    error !== null &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as SupabaseError).message === 'string'
  )
}
