// Debounce hooks
export { useDebounce, useDebouncedCallback } from './useDebounce';

// Local storage hook
export { useLocalStorage } from './useLocalStorage';

// Media query hooks
export {
  useMediaQuery,
  useBreakpoints,
  usePreferredColorScheme,
  usePrefersReducedMotion,
  breakpoints,
} from './useMediaQuery';

// Offline detection hooks
export { useOffline, useOnlineStatus, useSlowConnection } from './useOffline';

// Pagination hook
export {
  usePagination,
  getPaginationParams,
  type PaginationConfig,
  type PaginationState,
  type PaginationHandlers,
  type PaginationMeta,
  type UsePaginationReturn,
} from './usePagination';

// Clipboard hooks
export { useClipboard, copyToClipboard } from './useClipboard';

// Click outside hooks
export {
  useClickOutside,
  useClickOutsideMultiple,
  useClickOutsideCallback,
} from './useClickOutside';

// Form dirty tracking hooks
export { useFormDirty, useFormDirtyWithReset } from './useFormDirty';

// Keyboard hooks
export { useEscapeKey, useKeyboardShortcuts, type UseEscapeKeyOptions } from './useEscapeKey';

// URL state hooks
export { useUrlState, useUrlParam } from './useUrlState';
