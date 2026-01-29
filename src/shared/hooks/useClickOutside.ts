import { useEffect, useRef, useCallback, type RefObject } from 'react';

type Handler = (event: MouseEvent | TouchEvent) => void;

interface UseClickOutsideOptions {
  enabled?: boolean;
  detectIframe?: boolean;
}

/**
 * Hook for detecting clicks outside of an element
 * Useful for closing dropdowns, modals, and popovers
 *
 * @param handler - Callback function when click outside is detected
 * @param options - Configuration options
 * @returns Ref to attach to the element
 *
 * @example
 * const dropdownRef = useClickOutside<HTMLDivElement>(() => {
 *   setIsOpen(false);
 * });
 *
 * <div ref={dropdownRef}>
 *   <DropdownContent />
 * </div>
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  handler: Handler,
  options: UseClickOutsideOptions = {}
): RefObject<T | null> {
  const { enabled = true, detectIframe = false } = options;
  const ref = useRef<T>(null);
  const handlerRef = useRef<Handler>(handler);

  // Update handler ref to always have the latest handler
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled) return;

    const listener = (event: MouseEvent | TouchEvent) => {
      const el = ref.current;

      // Do nothing if clicking ref's element or its descendants
      if (!el || el.contains(event.target as Node)) {
        return;
      }

      handlerRef.current(event);
    };

    // Handle iframe focus (clicks inside iframes don't trigger mousedown/touchstart)
    const handleBlur = () => {
      if (!detectIframe) return;

      // Check if the active element is an iframe
      requestAnimationFrame(() => {
        const activeElement = document.activeElement;
        if (activeElement?.tagName === 'IFRAME') {
          const el = ref.current;
          if (!el || !el.contains(activeElement)) {
            handlerRef.current(new MouseEvent('click'));
          }
        }
      });
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    if (detectIframe) {
      window.addEventListener('blur', handleBlur);
    }

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);

      if (detectIframe) {
        window.removeEventListener('blur', handleBlur);
      }
    };
  }, [enabled, detectIframe]);

  return ref;
}

/**
 * Hook for detecting clicks outside of multiple elements
 * Useful when dropdown trigger and content are separate elements
 *
 * @param refs - Array of refs to check against
 * @param handler - Callback function when click outside is detected
 * @param options - Configuration options
 *
 * @example
 * const triggerRef = useRef<HTMLButtonElement>(null);
 * const contentRef = useRef<HTMLDivElement>(null);
 *
 * useClickOutsideMultiple([triggerRef, contentRef], () => {
 *   setIsOpen(false);
 * });
 */
export function useClickOutsideMultiple<T extends HTMLElement = HTMLElement>(
  refs: RefObject<T | null>[],
  handler: Handler,
  options: UseClickOutsideOptions = {}
): void {
  const { enabled = true } = options;
  const handlerRef = useRef<Handler>(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled) return;

    const listener = (event: MouseEvent | TouchEvent) => {
      // Check if click is inside any of the refs
      const isInside = refs.some((ref) => {
        const el = ref.current;
        return el && el.contains(event.target as Node);
      });

      if (!isInside) {
        handlerRef.current(event);
      }
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [refs, enabled]);
}

/**
 * Hook that provides the ref and a callback-based approach
 *
 * @param callback - Callback function when click outside is detected
 * @returns Object with ref and manually callable onClickOutside
 */
export function useClickOutsideCallback<T extends HTMLElement = HTMLElement>(
  callback: Handler
) {
  const ref = useRef<T>(null);

  const onClickOutside = useCallback(
    (event: MouseEvent | TouchEvent) => {
      const el = ref.current;
      if (!el || el.contains(event.target as Node)) {
        return;
      }
      callback(event);
    },
    [callback]
  );

  useEffect(() => {
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('touchstart', onClickOutside);

    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('touchstart', onClickOutside);
    };
  }, [onClickOutside]);

  return { ref, onClickOutside };
}
