import type { PostgrestError } from '@supabase/supabase-js'

/**
 * Custom error class for Supabase query errors with enhanced context
 */
export class SupabaseQueryError extends Error {
  constructor(
    message: string,
    public readonly originalError: PostgrestError,
    public readonly context: string
  ) {
    super(message)
    this.name = 'SupabaseQueryError'
  }
}

/**
 * Wrapper for Supabase queries with improved error handling
 * Throws an error if the query fails or returns null
 *
 * @param queryFn - Function that executes the Supabase query
 * @param context - Descriptive context for debugging (e.g., "Fetching platform stats")
 * @returns The query data
 * @throws {SupabaseQueryError} If query fails or returns null
 *
 * @example
 * const organizations = await executeQuery(
 *   () => supabase.from('organizations').select('id'),
 *   'Fetching total organizations'
 * )
 */
export async function executeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: PostgrestError | null }>,
  context: string
): Promise<T> {
  const { data, error } = await queryFn()

  if (error) {
    // Detailed console log for development
    if (import.meta.env.DEV) {
      console.group(`❌ Supabase Query Error: ${context}`)
      console.error('Message:', error.message)
      console.error('Details:', error.details)
      console.error('Hint:', error.hint)
      console.error('Code:', error.code)
      console.groupEnd()
    }

    throw new SupabaseQueryError(
      `${context}: ${error.message}`,
      error,
      context
    )
  }

  if (data === null) {
    throw new Error(`${context}: No data returned`)
  }

  return data
}

/**
 * Wrapper for queries that can legitimately return null or empty results
 * Does not throw if data is null, only if there's an actual error
 *
 * @param queryFn - Function that executes the Supabase query
 * @param context - Descriptive context for debugging
 * @returns The query data or null
 * @throws {SupabaseQueryError} If query fails (but not if data is null)
 *
 * @example
 * const user = await executeQueryNullable(
 *   () => supabase.from('users').select('*').eq('id', userId).single(),
 *   'Fetching user profile'
 * )
 */
export async function executeQueryNullable<T>(
  queryFn: () => Promise<{ data: T | null; error: PostgrestError | null }>,
  context: string
): Promise<T | null> {
  const { data, error } = await queryFn()

  if (error) {
    if (import.meta.env.DEV) {
      console.group(`❌ Supabase Query Error: ${context}`)
      console.error('Message:', error.message)
      console.error('Details:', error.details)
      console.error('Hint:', error.hint)
      console.error('Code:', error.code)
      console.groupEnd()
    }

    throw new SupabaseQueryError(
      `${context}: ${error.message}`,
      error,
      context
    )
  }

  return data
}
