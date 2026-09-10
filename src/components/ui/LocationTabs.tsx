import React from 'react';
import { Building2, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Location {
  id: string;
  name: string;
  fullName: string;
  count?: number;
}

interface LocationTabsProps {
  locations: Location[];
  selectedLocation: string;
  onLocationChange: (locationId: string) => void;
  variant?: 'buttons' | 'tabs' | 'pills';
  showCounts?: boolean;
  className?: string;
}

/**
 * Canonical location selector — unified pill row.
 */
export const LocationTabs: React.FC<LocationTabsProps> = ({
  locations,
  selectedLocation,
  onLocationChange,
  showCounts = true,
  className,
}) => {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)} role="tablist" aria-label="Locations">
      {locations.map((location) => {
        const active = selectedLocation === location.id;
        const isAll = location.id === 'all' || location.id === 'All Locations';
        return (
          <button
            key={location.id}
            role="tab"
            aria-selected={active}
            data-state={active ? 'active' : 'inactive'}
            onClick={() => onLocationChange(location.id)}
            className="p57-loc"
            title={location.fullName}
          >
            {isAll ? <Building2 className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
            <span>{location.name}</span>
            {showCounts && location.count !== undefined && (
              <span className="p57-loc-count">{location.count.toLocaleString()}</span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default LocationTabs;
