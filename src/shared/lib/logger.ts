/**
 * Production-safe logger utility
 * Automatically disables console logs in production builds
 *
 * @module logger
 * @description Provides environment-aware logging for both client and server
 */

/**
 * Determines if the environment is production
 * Works in both browser and Node.js environments
 */
const IS_PRODUCTION = (() => {
  // Browser environment (Vite)
  try {
    if (typeof window !== 'undefined' && import.meta?.env?.MODE) {
      return import.meta.env.MODE === 'production'
    }
  } catch {
    // Fallback if import.meta is not available
  }

  // Node.js environment
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NODE_ENV === 'production'
  }

  return false
})()

/**
 * Logger configuration type
 */
export type LogLevel = 'log' | 'error' | 'warn' | 'info' | 'debug'

/**
 * Logger utility with production-safe methods
 */
export const logger = {
  /**
   * Log general messages (disabled in production)
   * @param args - Arguments to log
   */
  log: (...args: unknown[]): void => {
    if (!IS_PRODUCTION) {
      console.log(...args)
    }
  },

  /**
   * Log error messages (always enabled)
   * @param args - Error arguments to log
   */
  error: (...args: unknown[]): void => {
    // Always log errors, even in production (they're important)
    console.error(...args)
  },

  /**
   * Log warning messages (disabled in production)
   * @param args - Warning arguments to log
   */
  warn: (...args: unknown[]): void => {
    if (!IS_PRODUCTION) {
      console.warn(...args)
    }
  },

  /**
   * Log informational messages (disabled in production)
   * @param args - Info arguments to log
   */
  info: (...args: unknown[]): void => {
    if (!IS_PRODUCTION) {
      console.info(...args)
    }
  },

  /**
   * Log debug messages (disabled in production)
   * @param args - Debug arguments to log
   */
  debug: (...args: unknown[]): void => {
    if (!IS_PRODUCTION) {
      console.debug(...args)
    }
  },

  /**
   * Log data as a table (disabled in production)
   * @param args - Data to display as table
   */
  table: (...args: unknown[]): void => {
    if (!IS_PRODUCTION) {
      console.table(...args)
    }
  },
}

/**
 * Optional: Override global console in production
 * This prevents accidental logging in production
 */
if (IS_PRODUCTION && typeof console !== 'undefined') {
  // Preserve error logging in production
  const originalError = console.error

  // Disable non-critical console methods
  console.log = (): void => {}
  console.info = (): void => {}
  console.debug = (): void => {}
  console.warn = (): void => {}
  console.table = (): void => {}

  // Keep error for critical issues
  console.error = originalError
}

export default logger
