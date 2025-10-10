import React, { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Building2, Globe, Users } from 'lucide-react';
import { SessionData } from '@/hooks/useSessionsData';
import { cn } from '@/lib/utils';

interface LocationTabsProps {
  data: SessionData[];
  selectedLocation: string;
  onLocationChange: (location: string) => void;
  children: (filteredData: SessionData[]) => React.ReactNode;
}

export const LocationTabs: React.FC<LocationTabsProps> = ({
  data,
  selectedLocation,
  onLocationChange,
  children
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

        <Tabs value={selectedLocation} onValueChange={onLocationChange} className="w-full">
          <TabsList className="premium-tabs grid w-full gap-2" style={{
            gridTemplateColumns: `repeat(${Math.min(locationStats.length + 1, 6)}, 1fr)`
          }}>
            {/* All Locations Tab */}
            <TabsTrigger 
              value="all"
              className={cn("premium-tab-trigger")}
            >
              <div className="flex flex-col items-center leading-tight">
                <span className="font-extrabold text-base sm:text-lg">All Locations</span>
                <div className="flex items-center gap-2 text-xs opacity-90 mt-0.5">
                  <Badge variant="secondary" className="text-[10px] px-1 py-0">{totalSessions}</Badge>
                  <Users className="w-3 h-3" />
                  <span>{totalAttendance}</span>
                </div>
              </div>
            </TabsTrigger>

            {/* Individual Location Tabs */}
            {locationStats.slice(0, 5).map((stat) => (
              <TabsTrigger
                key={stat.location}
                value={stat.location}
                className={cn("premium-tab-trigger")}
              >
                <div className="flex flex-col items-center leading-tight">
                  <span className="font-extrabold text-base sm:text-lg truncate max-w-[160px]">{stat.location.split(',')[0]}</span>
                  <span className="text-xs sm:text-sm opacity-90 truncate max-w-[160px]">{stat.location.split(',')[1]?.trim() || ''}</span>
                  <div className="flex items-center gap-2 text-[10px] opacity-90 mt-1">
                    <Badge variant="secondary" className="text-[10px] px-1 py-0">{stat.count}</Badge>
                    <Users className="w-3 h-3" />
                    <span>{stat.attendance}</span>
                  </div>
                </div>
              </TabsTrigger>
            ))}

            {/* Show More Locations if needed */}
            {locationStats.length > 5 && (
              <TabsTrigger 
                value="more"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md"
                disabled
              >
                <span>+{locationStats.length - 5} more</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Tab Content - All Locations */}
          <TabsContent value="all" className="mt-6">
            {children(filteredData)}
          </TabsContent>

          {/* Tab Content - Individual Locations */}
          {locationStats.map((stat) => (
            <TabsContent key={stat.location} value={stat.location} className="mt-6">
              {children(filteredData)}
            </TabsContent>
          ))}
        </Tabs>
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