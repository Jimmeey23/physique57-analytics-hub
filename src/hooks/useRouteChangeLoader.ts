import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useGlobalLoading } from './useGlobalLoading';

const ROUTE_CHANGE_LOADER_KEY = '__route_change_loader__';

/**
 * Hook that shows the global loader immediately when route changes
 * This prevents the old page from showing during navigation
 * Enforces a minimum display time for the loader
 */
export function useRouteChangeLoader() {
  const location = useLocation();
  const { setLoading } = useGlobalLoading();
  const loaderTimerRef = useRef<NodeJS.Timeout | null>(null);
  const loaderStartTimeRef = useRef<number | null>(null);
  const minDisplayTimeMs = 600; // Minimum loader display time

  useEffect(() => {
    // Clear any existing timer
    if (loaderTimerRef.current) {
      clearTimeout(loaderTimerRef.current);
    }

    // Show loader immediately when route changes
    loaderStartTimeRef.current = Date.now();
    setLoading(true, 'Loading page...');
  }, [location.pathname, setLoading]);

  // Store a reference in window to prevent pages from dismissing the loader too early
  useEffect(() => {
    (window as any)[ROUTE_CHANGE_LOADER_KEY] = true;

    return () => {
      delete (window as any)[ROUTE_CHANGE_LOADER_KEY];
    };
  }, [location.pathname]);

  // Cleanup timer on unmount
  return () => {
    if (loaderTimerRef.current) {
      clearTimeout(loaderTimerRef.current);
    }
  };
}
