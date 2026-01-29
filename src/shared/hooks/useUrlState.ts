import { useSearchParams } from 'react-router-dom'
import { useCallback, useMemo } from 'react'

type UrlStateValue = string | number | boolean | null | undefined

/**
 * Custom hook to manage state in URL search params
 * This persists state across navigation and page refreshes
 *
 * @param defaults - Default values for each key
 * @returns [state, updateState] - Current state and update function
 *
 * @example
 * const [state, updateState] = useUrlState({
 *   sort: 'date',
 *   dir: 'desc',
 *   tab: 'donors',
 *   search: '',
 *   page: 1
 * })
 *
 * // Update single value
 * updateState('sort', 'amount')
 *
 * // Update multiple values
 * updateState({ sort: 'amount', dir: 'asc' })
 *
 * // Remove a param (reset to default)
 * updateState('search', null)
 */
export function useUrlState<T extends Record<string, UrlStateValue>>(
  defaults: T
): [T, (keyOrUpdates: keyof T | Partial<T>, value?: UrlStateValue) => void] {
  const [searchParams, setSearchParams] = useSearchParams()

  // Serialize defaults to JSON for stable comparison
  const defaultsJson = useMemo(() => JSON.stringify(defaults), [defaults])

  // Get current state from URL params, fallback to defaults
  const state = useMemo(() => {
    let parsedDefaults: T
    try {
      parsedDefaults = JSON.parse(defaultsJson) as T
    } catch {
      console.error('Failed to parse defaults JSON')
      return {} as T
    }

    const currentState = {} as T

    Object.keys(parsedDefaults).forEach((key) => {
      const value = searchParams.get(key)
      if (value !== null) {
        // Try to parse as number or boolean, otherwise use string
        if (value === 'true') {
          ;(currentState as Record<string, unknown>)[key] = true
        } else if (value === 'false') {
          ;(currentState as Record<string, unknown>)[key] = false
        } else if (!isNaN(Number(value)) && value !== '') {
          ;(currentState as Record<string, unknown>)[key] = Number(value)
        } else {
          ;(currentState as Record<string, unknown>)[key] = value
        }
      } else {
        ;(currentState as Record<string, unknown>)[key] = parsedDefaults[key]
      }
    })

    return currentState
  }, [searchParams, defaultsJson])

  // Update state function
  const updateState = useCallback(
    (keyOrUpdates: keyof T | Partial<T>, value?: UrlStateValue) => {
      setSearchParams(
        (prev) => {
          const newParams = new URLSearchParams(prev)

          // If first arg is an object, update multiple values
          if (typeof keyOrUpdates === 'object' && keyOrUpdates !== null) {
            Object.entries(keyOrUpdates).forEach(([key, val]) => {
              if (val === null || val === undefined || val === '') {
                newParams.delete(key)
              } else {
                newParams.set(key, String(val))
              }
            })
          } else {
            // Single key-value update
            const key = keyOrUpdates as string
            if (value === null || value === undefined || value === '') {
              newParams.delete(key)
            } else {
              newParams.set(key, String(value))
            }
          }

          return newParams
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  return [state, updateState]
}

/**
 * Hook to get a single URL param with a default value
 * Simpler alternative to useUrlState for single values
 *
 * @param key - The URL param key
 * @param defaultValue - Default value if not in URL
 * @returns [value, setValue] - Current value and setter
 *
 * @example
 * const [page, setPage] = useUrlParam('page', 1)
 * const [search, setSearch] = useUrlParam('search', '')
 */
export function useUrlParam<T extends UrlStateValue>(
  key: string,
  defaultValue: T
): [T, (value: T | null) => void] {
  const [searchParams, setSearchParams] = useSearchParams()

  const value = useMemo(() => {
    const param = searchParams.get(key)
    if (param === null) return defaultValue

    // Type coercion based on default value type
    if (typeof defaultValue === 'boolean') {
      return (param === 'true') as T
    }
    if (typeof defaultValue === 'number') {
      const num = Number(param)
      return (isNaN(num) ? defaultValue : num) as T
    }
    return param as T
  }, [searchParams, key, defaultValue])

  const setValue = useCallback(
    (newValue: T | null) => {
      setSearchParams(
        (prev) => {
          const newParams = new URLSearchParams(prev)
          if (newValue === null || newValue === undefined || newValue === '') {
            newParams.delete(key)
          } else {
            newParams.set(key, String(newValue))
          }
          return newParams
        },
        { replace: true }
      )
    },
    [key, setSearchParams]
  )

  return [value, setValue]
}
