import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';

/**
 * NavigationLoader
 * 
 * Automatically shows the GlobalLoader when navigating to a new route.
 * This prevents the flash of content before the page's useEffect runs.
 * 
 * The loader will be hidden by the individual page's setLoading(false) call
 * once its data is ready.
 */
export const NavigationLoader = () => {
  const location = useLocation();
  const { setLoading } = useGlobalLoading();

  useEffect(() => {
    // Show loader immediately on route change
    // Each page will hide it when ready via their own setLoading(false)
    setLoading(true, 'Loading page...');
  }, [location.pathname, setLoading]);

  return null;
};
