import { useEffect } from 'react';

export const dispatchDateSync = (dateRange: { start: string; end: string }) => {
  const event = new CustomEvent('p57-sync-date-range', { detail: dateRange });
  window.dispatchEvent(event);
};

export const useGlobalDateSync = (onSync: (dateRange: { start: string; end: string }) => void) => {
  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{ start: string; end: string }>;
      onSync(customEvent.detail);
    };

    window.addEventListener('p57-sync-date-range', handler);
    return () => window.removeEventListener('p57-sync-date-range', handler);
  }, [onSync]);
};
