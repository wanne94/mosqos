import { useEffect } from 'react'

/**
 * Hook to handle ESC key press with optional confirmation
 * @param onEscape - Callback when ESC is pressed
 * @param requireConfirmation - Whether to show confirmation dialog
 * @param confirmMessage - Custom confirmation message
 * @param enabled - Whether the handler is enabled
 */
export function useEscapeKey(
  onEscape: () => void,
  requireConfirmation: boolean = false,
  confirmMessage: string = 'You have unsaved changes. Are you sure you want to leave?',
  enabled: boolean = true
): void {
  useEffect(() => {
    if (!enabled || typeof onEscape !== 'function') return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (requireConfirmation) {
          if (window.confirm(confirmMessage)) {
            onEscape()
          }
        } else {
          onEscape()
        }
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onEscape, requireConfirmation, confirmMessage, enabled])
}
