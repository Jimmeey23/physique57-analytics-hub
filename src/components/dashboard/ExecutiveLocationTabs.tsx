import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Globe } from 'lucide-react';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';

interface ExecutiveLocationTabsProps {
  availableLocations: string[];
}

export const ExecutiveLocationTabs: React.FC<ExecutiveLocationTabsProps> = ({ 
  availableLocations 
}) => {
  const { filters, updateFilters } = useGlobalFilters();
  
  const selectedLocation = Array.isArray(filters.location) 
    ? filters.location[0] 
    : filters.location;

  const handleLocationChange = (value: string) => {
    if (value === 'all') {
      updateFilters({ location: [] });
    } else {
      updateFilters({ location: [value] });
    }
  };

  return (
    <div className="mb-8">
      <Tabs 
        value={selectedLocation || 'all'} 
        onValueChange={handleLocationChange}
        className="w-full"
      >
        <TabsList className="bg-white/95 backdrop-blur-sm p-2 rounded-2xl shadow-xl border-0 inline-flex gap-2 h-auto">
          <TabsTrigger 
            value="all"
            className="px-6 py-3 rounded-xl text-base font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300 data-[state=active]:shadow-lg flex items-center gap-2"
          >
            <Globe className="w-4 h-4" />
            All Locations
          </TabsTrigger>
          
          {availableLocations.map(location => (
            <TabsTrigger 
              key={location}
              value={location}
              className="px-6 py-3 rounded-xl text-base font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300 data-[state=active]:shadow-lg flex items-center gap-2"
            >
              <MapPin className="w-4 h-4" />
              {location}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
};
