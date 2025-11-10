import React, { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Building2, Globe, Users } from 'lucide-react';
import { SessionData } from '@/hooks/useSessionsData';
import { cn } from '@/lib/utils';
import { InfoPopover } from '@/components/ui/InfoPopover';

type SalesContextKey =
  | 'sales-metrics'
  | 'sales-top-bottom'
  | 'sales-mom'
  | 'sales-yoy'
  | 'sales-product'
  | 'sales-category'
  | 'sales-soldby'
  | 'sales-payment'
  | 'sales-customer'
  | 'sales-deep-insights'
  | 'sales-overview'
  | 'patterns-trends-overview'
  | 'client-retention-overview'
  | 'class-formats-overview'
  | 'funnel-leads-overview'
  | 'late-cancellations-overview'
  | 'class-attendance-overview'
  | 'discounts-promotions-overview'
  | 'expiration-analytics-overview'
  | 'sessions-overview';

interface LocationTabsProps {
  data: SessionData[];
  selectedLocation: string;
  onLocationChange: (location: string) => void;
  children: (filteredData: SessionData[]) => React.ReactNode;
  showInfoPopover?: boolean;
  infoPopoverContext?: SalesContextKey;
}

export const LocationTabs: React.FC<LocationTabsProps> = ({
  data,
  selectedLocation,
  onLocationChange,
  children,
  showInfoPopover = false,
  infoPopoverContext = 'class-attendance-overview'
}) => {
  // Get all unique locations with their session counts
  const locationStats = useMemo(() => {
    const stats = new Map<string, { count: number; attendance: number }>();
    
    data.forEach(session => {
      const location = session.location || 'Unknown';
      const current = stats.get(location) || { count: 0, attendance: 0 };
      stats.set(location, {
        count: current.count + 1,
        attendance: current.attendance + (session.checkedInCount || 0)
      });
    });

    const allStats = Array.from(stats.entries()).map(([location, stat]) => ({
      location,
      ...stat
    }));

    // Sort by session count (descending)
    allStats.sort((a, b) => b.count - a.count);

    return allStats;
  }, [data]);

  const totalSessions = data.length;
  const totalAttendance = data.reduce((sum, session) => sum + (session.checkedInCount || 0), 0);

  // Filter data based on selected location
  const filteredData = useMemo(() => {
    if (selectedLocation === 'all') {
      return data;
    }
    return data.filter(session => session.location === selectedLocation);
  }, [data, selectedLocation]);

  const getLocationIcon = (location: string) => {
    if (location === 'all') return <Globe className="w-4 h-4" />;
    if (location.toLowerCase().includes('studio')) return <Building2 className="w-4 h-4" />;
    return <MapPin className="w-4 h-4" />;
  };

  const getLocationShortName = (location: string) => {
    if (location.toLowerCase().includes('kwality')) return 'Kwality House';
    if (location.toLowerCase().includes('supreme')) return 'Supreme HQ';
    if (location.toLowerCase().includes('kenkere')) return 'Kenkere House';
    return location.split(',')[0] || location; // Take first part before comma
  };

  return (
    <div className="space-y-6">
      {/* Location Tabs */}
      <div className="rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-md p-8 shadow-lg">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Location Filter</h3>
            <p className="text-base text-slate-600">
              Select a location to filter all analytics and tables below
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-slate-900">{locationStats.length}</div>
            <div className="text-sm text-slate-500 font-medium">Active Locations</div>
          </div>
        </div>

        {/* Enhanced Location Tabs - unified styling (matching Client Retention) */}
        <div className="flex justify-center mb-8" id="location-tabs">
          <div className="w-full max-w-4xl">
            {/* InfoPopover - positioned next to location tabs */}
            {showInfoPopover && (
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1"></div>
                <InfoPopover context={infoPopoverContext} locationId={selectedLocation} />
              </div>
            )}
            <div className="grid grid-cols-4 location-tabs">
              {/* All Locations Tab */}
              <button
                onClick={() => onLocationChange('all')}
                className={`location-tab-trigger group ${selectedLocation === 'all' ? 'data-[state=active]:[--tab-accent:var(--hero-accent)]' : ''}`}
                data-state={selectedLocation === 'all' ? 'active' : 'inactive'}
              >
                <span className="relative z-10 flex flex-col items-center leading-tight">
                  <span className="flex items-center gap-2 font-extrabold text-base sm:text-lg">All Locations</span>
                  <span className="text-xs sm:text-sm opacity-90">({totalSessions} sessions)</span>
                </span>
              </button>

              {/* Individual Location Tabs - Top 3 */}
              {locationStats.slice(0, 3).map((stat) => (
                <button
                  key={stat.location}
                  onClick={() => onLocationChange(stat.location)}
                  className={`location-tab-trigger group ${selectedLocation === stat.location ? 'data-[state=active]:[--tab-accent:var(--hero-accent)]' : ''}`}
                  data-state={selectedLocation === stat.location ? 'active' : 'inactive'}
                >
                  <span className="relative z-10 flex flex-col items-center leading-tight">
                    <span className="flex items-center gap-2 font-extrabold text-base sm:text-lg">{getLocationShortName(stat.location)}</span>
                    <span className="text-xs sm:text-sm opacity-90">({stat.count} sessions)</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="mt-6">
          {children(filteredData)}
        </div>
      </div>

      {/* Additional Location Stats Summary */}
      {selectedLocation !== 'all' && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 shadow-sm">
          <div className="flex items-center gap-3">
            {getLocationIcon(selectedLocation)}
            <div>
              <h4 className="font-semibold text-slate-900">{selectedLocation}</h4>
              <p className="text-sm text-slate-600">
                Showing {filteredData.length} sessions with {filteredData.reduce((sum, s) => sum + (s.checkedInCount || 0), 0)} total attendees
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onLocationChange('all')}
              className="ml-auto"
            >
              View All Locations
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};