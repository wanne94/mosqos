import { useEffect, useCallback } from 'react'

export interface UseEscapeKeyOptions {
  /** Whether to show confirmation dialog before executing callback */
  requireConfirmation?: boolean
  /** Custom confirmation message */
  confirmMessage?: string
  /** Whether the handler is enabled */
  enabled?: boolean
}

const DEFAULT_CONFIRM_MESSAGE = 'You have unsaved changes. Are you sure you want to leave?'

/**
 * Hook to handle ESC key press with optional confirmation
 * Useful for closing modals, canceling forms, etc.
 *
 * @param onEscape - Callback when ESC is pressed
 * @param options - Configuration options
 *
 * @example
 * // Simple usage - close modal on ESC
 * useEscapeKey(() => setModalOpen(false))
 *
 * // With confirmation for unsaved changes
 * useEscapeKey(
 *   () => setModalOpen(false),
 *   { requireConfirmation: isDirty, confirmMessage: 'Discard changes?' }
 * )
 *
 * // Disabled when modal is not open
 * useEscapeKey(() => setModalOpen(false), { enabled: isModalOpen })
 */
export function useEscapeKey(
  onEscape: () => void,
  options: UseEscapeKeyOptions = {}
): void {
  const {
    requireConfirmation = false,
    confirmMessage = DEFAULT_CONFIRM_MESSAGE,
    enabled = true,
  } = options

  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (requireConfirmation) {
          if (window.confirm(confirmMessage)) {
            onEscape()
          }
        } else {
          onEscape()
        }
      }
    },
    [onEscape, requireConfirmation, confirmMessage]
  )

  useEffect(() => {
    if (!enabled || typeof onEscape !== 'function') return

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [handleEscape, enabled, onEscape])
}

/**
 * Hook to handle multiple keyboard shortcuts
 * More flexible than useEscapeKey for complex key handling
 *
 * @param shortcuts - Map of key codes to handlers
 * @param enabled - Whether handlers are enabled
 *
 * @example
 * useKeyboardShortcuts({
 *   Escape: () => setModalOpen(false),
 *   Enter: () => handleSubmit(),
 *   's': (e) => { if (e.ctrlKey || e.metaKey) handleSave() }
 * })
 */
export function useKeyboardShortcuts(
  shortcuts: Record<string, (event: KeyboardEvent) => void>,
  enabled: boolean = true
): void {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      const handler = shortcuts[event.key]
      if (handler) {
        handler(event)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts, enabled])
}
