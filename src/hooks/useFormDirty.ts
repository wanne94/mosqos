import { useState, useEffect } from 'react'

/**
 * Hook to track if a form has unsaved changes
 * @param formData - Current form data
 * @param initialData - Initial form data
 * @returns isDirty - Whether form has unsaved changes
 */
export function useFormDirty<T>(formData: T, initialData: T | null): boolean {
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    // Deep comparison of form data vs initial data
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialData)
    setIsDirty(hasChanges)
  }, [formData, initialData])

  return isDirty
}
