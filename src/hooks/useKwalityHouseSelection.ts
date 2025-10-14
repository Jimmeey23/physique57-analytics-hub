import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook to determine if Kwality House is currently selected
 * This works across different page structures and location filter implementations
 */
export const useKwalityHouseSelection = (currentLocation?: string | string[]) => {
  const location = useLocation();
  
  const isKwalitySelected = useMemo(() => {
    // Check if current location parameter indicates Kwality House
    if (currentLocation) {
      if (typeof currentLocation === 'string') {
        return currentLocation === 'kwality' || 
               currentLocation.toLowerCase().includes('kwality') ||
               currentLocation.includes('Kwality House, Kemps Corner');
      }
      
      if (Array.isArray(currentLocation)) {
        return currentLocation.some(loc => 
          loc === 'kwality' || 
          loc.toLowerCase().includes('kwality') ||
          loc.includes('Kwality House, Kemps Corner')
        );
      }
    }
    
    // Check URL parameters for location selection
    const searchParams = new URLSearchParams(location.search);
    const locationParam = searchParams.get('location');
    if (locationParam === 'kwality' || locationParam?.toLowerCase().includes('kwality')) {
      return true;
    }
    
    // Check URL hash for location indicators
    if (location.hash.includes('kwality') || location.hash.includes('Kwality')) {
      return true;
    }
    
    return false;
  }, [currentLocation, location.search, location.hash]);
  
  return isKwalitySelected;
};