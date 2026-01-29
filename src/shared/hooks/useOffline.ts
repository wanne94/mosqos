import { useState, useEffect, useCallback } from 'react';

interface NetworkStatus {
  online: boolean;
  since: Date | null;
  downlink?: number;
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
  rtt?: number;
  saveData?: boolean;
}

interface NetworkInformation extends EventTarget {
  downlink?: number;
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
  rtt?: number;
  saveData?: boolean;
  addEventListener(type: 'change', listener: EventListener): void;
  removeEventListener(type: 'change', listener: EventListener): void;
}

declare global {
  interface Navigator {
    connection?: NetworkInformation;
    mozConnection?: NetworkInformation;
    webkitConnection?: NetworkInformation;
  }
}

/**
 * Hook for detecting online/offline status
 *
 * @returns Object with online status and timestamp
 *
 * @example
 * const { online, since } = useOffline();
 *
 * if (!online) {
 *   return <OfflineBanner />;
 * }
 */
export function useOffline(): NetworkStatus {
  const getNetworkInfo = useCallback((): Partial<NetworkStatus> => {
    const connection =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;

    if (connection) {
      return {
        downlink: connection.downlink,
        effectiveType: connection.effectiveType,
        rtt: connection.rtt,
        saveData: connection.saveData,
      };
    }

    return {};
  }, []);

  const [status, setStatus] = useState<NetworkStatus>(() => ({
    online: typeof navigator !== 'undefined' ? navigator.onLine : true,
    since: null,
    ...getNetworkInfo(),
  }));

  useEffect(() => {
    const handleOnline = () => {
      setStatus((prev) => ({
        ...prev,
        online: true,
        since: new Date(),
        ...getNetworkInfo(),
      }));
    };

    const handleOffline = () => {
      setStatus((prev) => ({
        ...prev,
        online: false,
        since: new Date(),
        ...getNetworkInfo(),
      }));
    };

    const handleConnectionChange = () => {
      setStatus((prev) => ({
        ...prev,
        ...getNetworkInfo(),
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for connection quality changes
    const connection =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;

    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);

      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, [getNetworkInfo]);

  return status;
}

/**
 * Simple hook that returns only the online boolean
 *
 * @returns Boolean indicating if the browser is online
 */
export function useOnlineStatus(): boolean {
  const { online } = useOffline();
  return online;
}

/**
 * Hook that checks if the connection is slow
 *
 * @returns Boolean indicating if the connection is slow (2g or slow-2g)
 */
export function useSlowConnection(): boolean {
  const { effectiveType, saveData } = useOffline();

  if (saveData) return true;
  if (!effectiveType) return false;

  return effectiveType === '2g' || effectiveType === 'slow-2g';
}
