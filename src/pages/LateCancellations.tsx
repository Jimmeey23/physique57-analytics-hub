import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLateCancellationsData } from '@/hooks/useLateCancellationsData';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';
import { LateCancellationsMetricCards } from '@/components/dashboard/LateCancellationsMetricCards';
import { LateCancellationsInteractiveCharts } from '@/components/dashboard/LateCancellationsInteractiveCharts';
import { EnhancedLateCancellationsTopBottomLists } from '@/components/dashboard/EnhancedLateCancellationsTopBottomLists';
import { EnhancedLateCancellationsDataTables } from '@/components/dashboard/EnhancedLateCancellationsDataTables';
import { EnhancedLateCancellationsFilterSection } from '@/components/dashboard/EnhancedLateCancellationsFilterSection';
import { LateCancellationsMonthOnMonthTable } from '@/components/dashboard/LateCancellationsMonthOnMonthTable';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Home, XCircle } from 'lucide-react';
import { Footer } from '@/components/ui/footer';
import { AdvancedExportButton } from '@/components/ui/AdvancedExportButton';
import { InfoPopover } from '@/components/ui/InfoPopover';
import { LateCancellationsDrillDownModal } from '@/components/dashboard/LateCancellationsDrillDownModal';
import DashboardMotionHero from '@/components/ui/DashboardMotionHero';
import { formatNumber } from '@/utils/formatters';

const LateCancellations = () => {
  const { data: lateCancellationsData, allCheckins, loading } = useLateCancellationsData();
  const { isLoading, setLoading } = useGlobalLoading();
  const navigate = useNavigate();
  
  // Location tabs state
  const [activeLocation, setActiveLocation] = useState('all');
  
  // Enhanced filter states - Default to previous month
  const [selectedTimeframe, setSelectedTimeframe] = useState('prev-month');
  const [selectedTrainer, setSelectedTrainer] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  // Drill down modal state
  const [drillDownData, setDrillDownData] = useState<any>(null);
  const [isDrillDownOpen, setIsDrillDownOpen] = useState(false);
  
  // Get unique locations for tabs
  const locations = useMemo(() => {
    if (!Array.isArray(lateCancellationsData)) return [];
    const uniqueLocations = Array.from(new Set(lateCancellationsData.map(item => item?.location).filter(Boolean)));
    return [
      { id: 'all', name: 'All Locations' },
      { id: 'kwality', name: 'Kwality House' },
      { id: 'supreme', name: 'Supreme HQ' },
      { id: 'kenkere', name: 'Kenkere House' }
    ].filter(loc => loc.id === 'all' || uniqueLocations.some(ul => 
      loc.id === 'kwality' ? ul.includes('Kwality') :
      loc.id === 'supreme' ? ul.includes('Supreme') :
      loc.id === 'kenkere' ? ul.includes('Kenkere') : false
    ));
  }, [lateCancellationsData]);
  
  // Enhanced filter data based on all selected filters
  const filteredData = useMemo(() => {
    if (!Array.isArray(lateCancellationsData)) return [];
    
    let filtered = lateCancellationsData;
    
    // Location tab filter
    if (activeLocation !== 'all') {
      filtered = filtered.filter(item => {
        const location = item?.location || '';
        return activeLocation === 'kwality' ? location.includes('Kwality') :
               activeLocation === 'supreme' ? location.includes('Supreme') :
               activeLocation === 'kenkere' ? location.includes('Kenkere') : true;
      });
    }
    
    // Trainer filter
    if (selectedTrainer !== 'all') {
      filtered = filtered.filter(item => item?.teacherName === selectedTrainer);
    }
    
    // Class filter
    if (selectedClass !== 'all') {
      filtered = filtered.filter(item => item?.cleanedClass === selectedClass);
    }
    
    // Product filter
    if (selectedProduct !== 'all') {
      filtered = filtered.filter(item => item?.cleanedProduct === selectedProduct);
    }
    
    // Time slot filter
    if (selectedTimeSlot !== 'all') {
      filtered = filtered.filter(item => {
        if (!item?.time) return false;
        const hour = parseInt(item.time.split(':')[0]);
        switch (selectedTimeSlot) {
          case 'morning':
            return hour >= 6 && hour < 12;
          case 'afternoon':
            return hour >= 12 && hour < 17;
          case 'evening':
            return hour >= 17 && hour < 22;
          case 'late':
            return hour >= 22 || hour < 6;
          default:
            return true;
        }
      });
    }
    
    // Timeframe filter
    if (selectedTimeframe !== 'all') {
      const now = new Date();
      let startDate = new Date();
      let endDate = new Date();
      
      switch (selectedTimeframe) {
        case '1w':
          startDate.setDate(now.getDate() - 7);
          break;
        case '2w':
          startDate.setDate(now.getDate() - 14);
          break;
        case '1m':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'prev-month':
          // Previous complete month
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
          startDate = lastMonth;
          endDate = lastMonthEnd;
          filtered = filtered.filter(item => {
            if (!item?.dateIST) return false;
            const itemDate = new Date(item.dateIST);
            return itemDate >= startDate && itemDate <= endDate;
          });
          return filtered;
        case '3m':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case '6m':
          startDate.setMonth(now.getMonth() - 6);
          break;
        case '1y':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        case 'custom':
          if (dateRange.start || dateRange.end) {
            const customStart = dateRange.start ? new Date(dateRange.start) : new Date('2020-01-01');
            const customEnd = dateRange.end ? new Date(dateRange.end) : now;
            filtered = filtered.filter(item => {
              if (!item?.dateIST) return false;
              const itemDate = new Date(item.dateIST);
              return itemDate >= customStart && itemDate <= customEnd;
            });
          }
          return filtered;
        default:
          return filtered;
      }
      
      filtered = filtered.filter(item => {
        if (!item?.dateIST) return false;
        const itemDate = new Date(item.dateIST);
        return itemDate >= startDate && itemDate <= now;
      });
    }
    
    return filtered;
  }, [lateCancellationsData, activeLocation, selectedTimeframe, selectedTrainer, selectedClass, selectedProduct, selectedTimeSlot, dateRange]);

  // Clear all filters function
  const clearAllFilters = () => {
    setSelectedTimeframe('prev-month');
    setSelectedTrainer('all');
    setSelectedClass('all');
    setSelectedProduct('all');
    setSelectedTimeSlot('all');
    setDateRange({ start: '', end: '' });
  };

  // Handle drill down click
  const handleDrillDownClick = (data: any) => {
    setDrillDownData(data);
    setIsDrillDownOpen(true);
  };

  // Filter data for charts (exempt from date range)
  const chartData = useMemo(() => {
    if (!Array.isArray(lateCancellationsData)) return [];
    
    let filtered = lateCancellationsData;
    
    // Apply all filters except timeframe for charts
    if (activeLocation !== 'all') {
      filtered = filtered.filter(item => {
        const location = item?.location || '';
        return activeLocation === 'kwality' ? location.includes('Kwality') :
               activeLocation === 'supreme' ? location.includes('Supreme') :
               activeLocation === 'kenkere' ? location.includes('Kenkere') : true;
      });
    }
    
    if (selectedTrainer !== 'all') {
      filtered = filtered.filter(item => item?.teacherName === selectedTrainer);
    }
    
    if (selectedClass !== 'all') {
      filtered = filtered.filter(item => item?.cleanedClass === selectedClass);
    }
    
    if (selectedProduct !== 'all') {
      filtered = filtered.filter(item => item?.cleanedProduct === selectedProduct);
    }
    
    if (selectedTimeSlot !== 'all') {
      filtered = filtered.filter(item => {
        if (!item?.time) return false;
        const hour = parseInt(item.time.split(':')[0]);
        switch (selectedTimeSlot) {
          case 'morning':
            return hour >= 6 && hour < 12;
          case 'afternoon':
            return hour >= 12 && hour < 17;
          case 'evening':
            return hour >= 17 && hour < 22;
          case 'late':
            return hour >= 22 || hour < 6;
          default:
            return true;
        }
      });
    }
    
    return filtered;
  }, [lateCancellationsData, activeLocation, selectedTrainer, selectedClass, selectedProduct, selectedTimeSlot]);

  // Apply the same filters to allCheckins for global consistency, including timeframe
  const filteredCheckins = useMemo(() => {
    if (!Array.isArray(allCheckins)) return [] as any[];
    let filtered: any[] = allCheckins;

    // Location filter
    if (activeLocation !== 'all') {
      filtered = filtered.filter(item => {
        const location = item?.location || '';
        return activeLocation === 'kwality' ? location.includes('Kwality') :
               activeLocation === 'supreme' ? location.includes('Supreme') :
               activeLocation === 'kenkere' ? location.includes('Kenkere') : true;
      });
    }

    // Trainer filter
    if (selectedTrainer !== 'all') {
      filtered = filtered.filter(item => item?.teacherName === selectedTrainer);
    }

    // Class filter
    if (selectedClass !== 'all') {
      filtered = filtered.filter(item => item?.cleanedClass === selectedClass);
    }

    // Product filter
    if (selectedProduct !== 'all') {
      filtered = filtered.filter(item => item?.cleanedProduct === selectedProduct);
    }

    // Time slot filter
    if (selectedTimeSlot !== 'all') {
      filtered = filtered.filter(item => {
        if (!item?.time) return false;
        const hour = parseInt(item.time.split(':')[0]);
        switch (selectedTimeSlot) {
          case 'morning':
            return hour >= 6 && hour < 12;
          case 'afternoon':
            return hour >= 12 && hour < 17;
          case 'evening':
            return hour >= 17 && hour < 22;
          case 'late':
            return hour >= 22 || hour < 6;
          default:
            return true;
        }
      });
    }

    // Timeframe filter mirrors cancellations
    if (selectedTimeframe !== 'all') {
      const now = new Date();
      let startDate = new Date();
      let endDate = new Date();
      switch (selectedTimeframe) {
        case '1w':
          startDate.setDate(now.getDate() - 7);
          break;
        case '2w':
          startDate.setDate(now.getDate() - 14);
          break;
        case '1m':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'prev-month': {
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
          startDate = lastMonth;
          endDate = lastMonthEnd;
          filtered = filtered.filter(item => {
            if (!item?.dateIST) return false;
            const itemDate = new Date(item.dateIST);
            return itemDate >= startDate && itemDate <= endDate;
          });
          return filtered;
        }
        case '3m':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case '6m':
          startDate.setMonth(now.getMonth() - 6);
          break;
        case '1y':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        case 'custom': {
          if (dateRange.start || dateRange.end) {
            const customStart = dateRange.start ? new Date(dateRange.start) : new Date('2020-01-01');
            const customEnd = dateRange.end ? new Date(dateRange.end) : now;
            filtered = filtered.filter(item => {
              if (!item?.dateIST) return false;
              const itemDate = new Date(item.dateIST);
              return itemDate >= customStart && itemDate <= customEnd;
            });
          }
          return filtered;
        }
        default:
          break;
      }
      filtered = filtered.filter(item => {
        if (!item?.dateIST) return false;
        const itemDate = new Date(item.dateIST);
        return itemDate >= startDate && itemDate <= now;
      });
    }
    return filtered;
  }, [allCheckins, activeLocation, selectedTrainer, selectedClass, selectedProduct, selectedTimeSlot, selectedTimeframe, dateRange]);

  const heroMetrics = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];

    const locations = [
      { key: 'Kwality', name: 'Kwality' },
      { key: 'Supreme', name: 'Supreme' },
      { key: 'Kenkere', name: 'Kenkere' }
    ];

    return locations.map(location => {
      const locationData = filteredData.filter(item => 
        item.location?.includes(location.key)
      );
      
      const totalCancellations = locationData.length;
      
      return {
        location: location.name,
        label: 'Filtered Cancellations',
        value: formatNumber(totalCancellations)
      };
    });
  }, [filteredData]);

  useEffect(() => {
    setLoading(loading, 'Loading late cancellations data...');
  }, [loading, setLoading]);

  // Remove individual loader - rely on global loader only

  const exportButton = (
    <AdvancedExportButton 
      lateCancellationsData={filteredData}
      defaultFileName={`late-cancellations-${activeLocation}`}
      size="sm"
      variant="ghost"
      buttonClassName="rounded-xl border border-white/30 text-white hover:border-white/50"
    />
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/20">
      <DashboardMotionHero 
        title="Late Cancellations"
        subtitle="Comprehensive analysis of late cancellation patterns across locations, classes, trainers, and products"
        metrics={heroMetrics}
        extra={exportButton}
      />

      {/* Main Content */}
      <div className="relative">
        <div className="container mx-auto px-6 py-8">
          {/* Location Tabs */}
          <Tabs value={activeLocation} onValueChange={setActiveLocation} className="w-full mb-8">
            <div className="flex items-start justify-center mb-8">
              <TabsList className="location-tabs grid w-full max-w-4xl overflow-visible" style={{ gridTemplateColumns: `repeat(${locations.length}, 1fr)` }}>
                {locations.map(location => {
                  const parts = location.name.split(',').map(s => s.trim());
                  const mainName = parts[0] || location.name;
                  const subName = parts[1] || '';
                  return (
                    <TabsTrigger
                      key={location.id}
                      value={location.id}
                      className="location-tab-trigger group data-[state=active]:[--tab-accent:var(--hero-accent)]"
                    >
                      <span className="relative z-10 flex flex-col items-center leading-tight">
                        <span className="flex items-center gap-2 font-extrabold text-base sm:text-lg">
                          {mainName}
                        </span>
                        {subName && (
                          <span className="text-xs sm:text-sm opacity-90">{subName}</span>
                        )}
                      </span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
              <div className="ml-3 mt-1">
                <InfoPopover context="late-cancellations-overview" locationId={activeLocation} />
              </div>
            </div>

            {locations.map(location => (
              <TabsContent key={location.id} value={location.id} className="space-y-8">
                <div className="space-y-8">
                  {/* Enhanced Filter Section */}
                  <EnhancedLateCancellationsFilterSection
                    selectedLocation="all"
                    onLocationChange={() => {}}
                    selectedTimeframe={selectedTimeframe}
                    onTimeframeChange={setSelectedTimeframe}
                    selectedTrainer={selectedTrainer}
                    onTrainerChange={setSelectedTrainer}
                    selectedClass={selectedClass}
                    onClassChange={setSelectedClass}
                    selectedProduct={selectedProduct}
                    onProductChange={setSelectedProduct}
                    selectedTimeSlot={selectedTimeSlot}
                    onTimeSlotChange={setSelectedTimeSlot}
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                    data={lateCancellationsData}
                    onClearFilters={clearAllFilters}
                  />
                  
                  {/* Metric Cards */}
                  <LateCancellationsMetricCards data={filteredData} onMetricClick={handleDrillDownClick} />
                  
                  {/* Interactive Charts */}
                  <LateCancellationsInteractiveCharts data={chartData} />
                  
                  {/* Enhanced Top/Bottom Lists */}
                  <EnhancedLateCancellationsTopBottomLists data={filteredData} />
                  
                  {/* Month on Month Analysis Table */}
                  <LateCancellationsMonthOnMonthTable 
                    data={chartData} 
                    onRowClick={handleDrillDownClick} 
                  />
                  
                  {/* Enhanced Detailed Data Tables with Pagination */}
                  <EnhancedLateCancellationsDataTables data={filteredData} allCheckins={filteredCheckins} onDrillDown={handleDrillDownClick} />
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
      
      {/* Drill Down Modal */}
      <LateCancellationsDrillDownModal
        isOpen={isDrillDownOpen}
        onClose={() => setIsDrillDownOpen(false)}
        data={drillDownData}
      />
      
      <Footer />
    </div>
  );
};

export default LateCancellations;
