import { useState, useEffect, useMemo } from 'react'

/**
 * Hook to track if a form has unsaved changes
 * Uses deep comparison of form data vs initial data
 *
 * @param formData - Current form data
 * @param initialData - Initial form data
 * @returns isDirty - Whether form has unsaved changes
 *
 * @example
 * const [formData, setFormData] = useState(initialMember)
 * const isDirty = useFormDirty(formData, initialMember)
 *
 * // Use with confirmation before closing
 * const handleClose = () => {
 *   if (isDirty && !confirm('You have unsaved changes. Discard?')) return
 *   onClose()
 * }
 */
export function useFormDirty<T>(formData: T, initialData: T): boolean {
  const [isDirty, setIsDirty] = useState(false)

  // Memoize JSON strings to avoid recalculation on each render
  const formDataJson = useMemo(() => {
    try {
      return JSON.stringify(formData)
    } catch {
      return ''
    }
  }, [formData])

  const initialDataJson = useMemo(() => {
    try {
      return JSON.stringify(initialData)
    } catch {
      return ''
    }
  }, [initialData])

  useEffect(() => {
    // Deep comparison of form data vs initial data
    const hasChanges = formDataJson !== initialDataJson
    setIsDirty(hasChanges)
  }, [formDataJson, initialDataJson])

  return isDirty
}

/**
 * Hook to track form dirty state with reset capability
 * Useful when you need to programmatically reset the dirty state
 *
 * @param formData - Current form data
 * @param initialData - Initial form data
 * @returns Object with isDirty state and reset function
 */
export function useFormDirtyWithReset<T>(
  formData: T,
  initialData: T
): {
  isDirty: boolean
  resetDirty: () => void
  markClean: () => void
} {
  const [baselineData, setBaselineData] = useState<T>(initialData)

  const isDirty = useMemo(() => {
    try {
      return JSON.stringify(formData) !== JSON.stringify(baselineData)
    } catch {
      return false
    }
  }, [formData, baselineData])

  const resetDirty = () => {
    setBaselineData(initialData)
  }

  const markClean = () => {
    setBaselineData(formData)
  }

  return { isDirty, resetDirty, markClean }
}
