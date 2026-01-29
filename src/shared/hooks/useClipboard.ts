import { useState, useCallback } from 'react';

interface UseClipboardOptions {
  timeout?: number;
  onSuccess?: (text: string) => void;
  onError?: (error: Error) => void;
}

interface UseClipboardReturn {
  copy: (text: string) => Promise<boolean>;
  copied: boolean;
  error: Error | null;
  reset: () => void;
}

/**
 * Hook for copying text to clipboard
 *
 * @param options - Configuration options
 * @returns Object with copy function, copied state, and error
 *
 * @example
 * const { copy, copied, error } = useClipboard({ timeout: 2000 });
 *
 * <Button onClick={() => copy('Hello, World!')}>
 *   {copied ? 'Copied!' : 'Copy'}
 * </Button>
 */
export function useClipboard(options: UseClipboardOptions = {}): UseClipboardReturn {
  const { timeout = 2000, onSuccess, onError } = options;

  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const reset = useCallback(() => {
    setCopied(false);
    setError(null);
  }, []);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      // Reset previous state
      setError(null);

      // Check for Clipboard API support
      if (!navigator?.clipboard) {
        // Fallback to execCommand for older browsers
        try {
          const textArea = document.createElement('textarea');
          textArea.value = text;

          // Prevent scrolling to bottom of page
          textArea.style.position = 'fixed';
          textArea.style.top = '0';
          textArea.style.left = '0';
          textArea.style.width = '2em';
          textArea.style.height = '2em';
          textArea.style.padding = '0';
          textArea.style.border = 'none';
          textArea.style.outline = 'none';
          textArea.style.boxShadow = 'none';
          textArea.style.background = 'transparent';

          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();

          const successful = document.execCommand('copy');
          document.body.removeChild(textArea);

          if (successful) {
            setCopied(true);
            onSuccess?.(text);

            if (timeout > 0) {
              setTimeout(() => setCopied(false), timeout);
            }

            return true;
          }

          throw new Error('execCommand returned false');
        } catch (err) {
          const error = new Error('Clipboard API not supported and fallback failed');
          setError(error);
          onError?.(error);
          return false;
        }
      }

      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        onSuccess?.(text);

        if (timeout > 0) {
          setTimeout(() => setCopied(false), timeout);
        }

        return true;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to copy to clipboard');
        setError(error);
        onError?.(error);
        return false;
      }
    },
    [timeout, onSuccess, onError]
  );

  return { copy, copied, error, reset };
}

/**
 * Simple copy function without React state
 * Useful for one-off copy operations
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator?.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    const result = document.execCommand('copy');
    document.body.removeChild(textArea);
    return result;
  } catch {
    return false;
  }
}
