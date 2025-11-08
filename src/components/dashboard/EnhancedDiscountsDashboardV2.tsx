import React, { useState, useMemo, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DiscountsAnimatedMetricCards } from './DiscountsAnimatedMetricCards';
import { AutoCloseFilterSection } from './AutoCloseFilterSection';
import { DiscountInteractiveCharts } from './DiscountInteractiveCharts';
import { DiscountInteractiveTopBottomLists } from './DiscountInteractiveTopBottomLists';
import { EnhancedDiscountDataTable } from './EnhancedDiscountDataTable';
import { EnhancedDiscountBreakdownTables } from './EnhancedDiscountBreakdownTables';
import { DiscountDrillDownModal } from './DiscountDrillDownModal';
import { getActiveTabClasses } from '@/utils/colorThemes';
import { SalesData } from '@/types/dashboard';
import { cn } from '@/lib/utils';
import { InfoPopover } from '@/components/ui/InfoPopover';

interface EnhancedDiscountsDashboardV2Props {
  data: SalesData[];
}

const locations = [
  { id: 'all', name: 'All Locations' },
  { id: 'kwality', name: 'Kwality House, Kemps Corner' },
  { id: 'supreme', name: 'Supreme HQ, Bandra' },
  { id: 'kenkere', name: 'Kenkere House' }
];

const getPreviousMonthDateRange = () => {
  const now = new Date();
  
  // Use UTC to avoid timezone issues
  const year = now.getFullYear();
  const month = now.getMonth(); // Current month (0-indexed)
  
  // Get first day of previous month (in local time, formatted as YYYY-MM-DD)
  const firstDayPreviousMonth = new Date(year, month - 1, 1);
  const firstFormatted = `${firstDayPreviousMonth.getFullYear()}-${String(firstDayPreviousMonth.getMonth() + 1).padStart(2, '0')}-01`;
  
  // Get last day of previous month (in local time, formatted as YYYY-MM-DD)
  const lastDayPreviousMonth = new Date(year, month, 0);
  const lastFormatted = `${lastDayPreviousMonth.getFullYear()}-${String(lastDayPreviousMonth.getMonth() + 1).padStart(2, '0')}-${String(lastDayPreviousMonth.getDate()).padStart(2, '0')}`;
  
  console.log('Date range calculation:', {
    today: now.toLocaleDateString(),
    currentMonth: month,
    previousMonth: month - 1,
    firstDay: firstFormatted,
    lastDay: lastFormatted
  });
  
  return {
    start: firstFormatted,
    end: lastFormatted
  };
};

export const EnhancedDiscountsDashboardV2: React.FC<EnhancedDiscountsDashboardV2Props> = ({ data }) => {
  const [activeLocation, setActiveLocation] = useState('all');
  const [filters, setFilters] = useState<any>({
    dateRange: { start: null, end: null },
    category: [],
    product: [],
    soldBy: [],
    paymentMethod: []
  });
  
  const [drillDownData, setDrillDownData] = useState<{
    isOpen: boolean;
    title: string;
    data: any[];
    type: string;
  }>({ isOpen: false, title: '', data: [], type: '' });

  // Set default date range to previous month
  useEffect(() => {
    const previousMonth = getPreviousMonthDateRange();
    console.log('Setting default date range:', previousMonth);
    setFilters(prev => ({
      ...prev,
      dateRange: {
        start: previousMonth.start,
        end: previousMonth.end
      }
    }));
  }, []);

  // Apply filters similar to sales section
  const applyFilters = (rawData: SalesData[], includeHistoric: boolean = false) => {
    let filtered = rawData.slice();
    
    console.log('Starting filter with:', filtered.length, 'records');

    // Apply location filter
    if (activeLocation !== 'all') {
      filtered = filtered.filter(item => {
        const locationMatch = activeLocation === 'kwality' 
          ? item.calculatedLocation === 'Kwality House, Kemps Corner' 
          : activeLocation === 'supreme' 
          ? item.calculatedLocation === 'Supreme HQ, Bandra' 
          : item.calculatedLocation?.includes('Kenkere') || item.calculatedLocation === 'Kenkere House';
        return locationMatch;
      });
    }

    console.log('After location filter:', filtered.length, 'records');

    // Apply date range filter (skip if includeHistoric is true)
    if (!includeHistoric && (filters.dateRange.start || filters.dateRange.end)) {
      const startDate = filters.dateRange.start ? new Date(filters.dateRange.start) : null;
      const endDate = filters.dateRange.end ? (() => {
        const date = new Date(filters.dateRange.end);
        date.setHours(23, 59, 59, 999);
        return date;
      })() : null;

      console.log('Date filtering with range:', { 
        start: startDate?.toISOString(), 
        end: endDate?.toISOString() 
      });

      if (startDate || endDate) {
        filtered = filtered.filter(item => {
          if (!item.paymentDate) return false;
          
          let itemDate: Date;
          
          // Handle multiple date formats robustly
          const dateStr = item.paymentDate.toString().trim();
          
          if (dateStr.includes('/')) {
            // Remove time part if present
            const datePart = dateStr.split(' ')[0];
            const parts = datePart.split('/');
            
            // Determine format based on part values
            if (parts.length === 3) {
              const [p1, p2, p3] = parts.map(p => parseInt(p));
              
              // If first part > 31, it's YYYY/MM/DD
              if (p1 > 31) {
                itemDate = new Date(p1, p2 - 1, p3);
              }
              // If third part > 31, it's DD/MM/YYYY
              else if (p3 > 31) {
                itemDate = new Date(p3, p2 - 1, p1);
              }
              // If middle part > 12, it's DD/MM/YYYY (month can't be > 12)
              else if (p2 > 12) {
                itemDate = new Date(p3, p1 - 1, p2);
              }
              // Otherwise assume DD/MM/YYYY (most common format)
              else {
                itemDate = new Date(p3, p2 - 1, p1);
              }
            } else {
              itemDate = new Date(dateStr);
            }
          } else if (dateStr.includes('-')) {
            // ISO format YYYY-MM-DD
            itemDate = new Date(dateStr);
          } else {
            itemDate = new Date(dateStr);
          }
          
          if (!itemDate || isNaN(itemDate.getTime())) {
            console.log('Invalid date for item:', item.paymentDate);
            return false;
          }
          
          const itemInRange = (!startDate || itemDate >= startDate) && (!endDate || itemDate <= endDate);
          
          return itemInRange;
        });
        
        console.log('After date filter:', filtered.length, 'records');
      }
    }

    // Apply category filter
    if (filters.category && filters.category.length > 0) {
      filtered = filtered.filter(item => 
        filters.category.includes(item.cleanedCategory || 'Uncategorized')
      );
    }

    // Apply product filter
    if (filters.product && filters.product.length > 0) {
      filtered = filtered.filter(item => 
        filters.product.includes(item.cleanedProduct || item.paymentItem || 'Unknown')
      );
    }

    // Apply soldBy filter
    if (filters.soldBy && filters.soldBy.length > 0) {
      filtered = filtered.filter(item => 
        filters.soldBy.includes(item.soldBy || 'Unknown')
      );
    }

    // Apply payment method filter
    if (filters.paymentMethod && filters.paymentMethod.length > 0) {
      filtered = filtered.filter(item => 
        filters.paymentMethod.includes(item.paymentMethod || 'Unknown')
      );
    }

    console.log('Final filtered data:', filtered.length, 'records');
    return filtered;
  };

  const filteredData = useMemo(() => applyFilters(data), [data, filters, activeLocation]);
  const allHistoricData = useMemo(() => applyFilters(data, true), [data, activeLocation]);

  // For discount analysis, we need ALL sales data to calculate discount opportunities and performance
  // Show all filtered data (both discounted and non-discounted transactions)
  const discountAnalysisData = useMemo(() => {
    console.log('Discount Analysis Data:', filteredData.length, 'total transactions');
    console.log('Sample data:', filteredData.slice(0, 3));
    return filteredData;
  }, [filteredData]);

  // Separate data for components that specifically need only discounted transactions
  const onlyDiscountedData = useMemo(() => {
    const discounted = filteredData.filter(item => (item.discountAmount || 0) > 0);
    console.log('Only Discounted Data:', discounted.length, 'discounted transactions');
    return discounted;
  }, [filteredData]);

  const handleMetricClick = (metricData: any) => {
    setDrillDownData({
      isOpen: true,
      title: `${metricData.title} Analysis`,
      data: metricData.rawData || filteredData,
      type: 'metric'
    });
  };

  const handleDrillDown = (title: string, data: any[], type: string) => {
    setDrillDownData({
      isOpen: true,
      title,
      data,
      type
    });
  };

  const resetFilters = () => {
    const previousMonth = getPreviousMonthDateRange();
    
    setFilters({
      dateRange: {
        start: previousMonth.start,
        end: previousMonth.end
      },
      category: [],
      product: [],
      soldBy: [],
      paymentMethod: []
    });
  };

  // Calculate tab counts for location tabs using filtered data
  const tabCounts = useMemo(() => {
    const counts = { all: 0, kwality: 0, supreme: 0, kenkere: 0 };
    
    discountAnalysisData.forEach(item => {
      counts.all++;
      const loc = (item.calculatedLocation || '').toString().toLowerCase();
      if (loc.includes('kwality')) {
        counts.kwality++;
      } else if (loc.includes('supreme')) {
        counts.supreme++;
      } else if (loc.includes('kenkere') || loc.includes('bengaluru')) {
        counts.kenkere++;
      }
    });
    
    return counts;
  }, [discountAnalysisData]);

  return (
    <div className="space-y-8">
      {/* Note Taker Component */}
      <div className="container mx-auto px-6">
  {/* NoteTaker removed as per request */}
      </div>

      {/* Enhanced Location Tabs - unified styling (matching Client Retention) */}
      <div className="container mx-auto px-6 space-y-6">
        <div className="flex items-start justify-center mb-8" id="location-tabs">
          <div className="w-full max-w-4xl">
            <div className="grid grid-cols-4 location-tabs">
              {locations.map(location => {
                const parts = location.name.split(',').map(s => s.trim());
                const mainName = parts[0] || location.name;
                const subName = parts[1] || '';
                const count = tabCounts[location.id as keyof typeof tabCounts] || 0;
                
                return (
                  <button
                    key={location.id}
                    onClick={() => setActiveLocation(location.id)}
                    className={`location-tab-trigger group ${activeLocation === location.id ? 'data-[state=active]:[--tab-accent:var(--hero-accent)]' : ''}`}
                    data-state={activeLocation === location.id ? 'active' : 'inactive'}
                  >
                    <span className="relative z-10 flex flex-col items-center leading-tight">
                      <span className="flex items-center gap-2 font-extrabold text-base sm:text-lg">{mainName}</span>
                      <span className="text-xs sm:text-sm opacity-90">{subName} ({count})</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="ml-4 mt-1">
            <InfoPopover context="discounts-promotions-overview" locationId={activeLocation} />
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
        <div className="w-full">
          <AutoCloseFilterSection
            filters={filters} 
            onFiltersChange={setFilters} 
            onReset={resetFilters} 
          />
        </div>

        {/* Modern Animated Metric Cards */}
        <DiscountsAnimatedMetricCards 
          data={discountAnalysisData}
          historicalData={allHistoricData}
          dateRange={filters.dateRange}
          onMetricClick={handleMetricClick}
        />

        <DiscountInteractiveCharts data={allHistoricData} />

        <DiscountInteractiveTopBottomLists 
          data={discountAnalysisData} 
          onDrillDown={handleDrillDown}
        />

        {/* Main Content Tabs */}
        <Tabs defaultValue="detailed" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 p-1.5 rounded-xl shadow-md border border-orange-200">
            <TabsTrigger 
              value="detailed" 
              className="rounded-lg px-4 py-2.5 font-semibold transition-all duration-300 text-slate-700 hover:text-slate-900 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              Data Tables
            </TabsTrigger>
            <TabsTrigger 
              value="breakdown" 
              className="rounded-lg px-4 py-2.5 font-semibold transition-all duration-300 text-slate-700 hover:text-slate-900 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              Breakdowns
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="rounded-lg px-4 py-2.5 font-semibold transition-all duration-300 text-slate-700 hover:text-slate-900 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6">
            <DiscountInteractiveCharts data={discountAnalysisData} />
          </TabsContent>

          <TabsContent value="detailed" className="space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-orange-200/50">
              <EnhancedDiscountDataTable 
                data={discountAnalysisData}
                onRowClick={(title, data, type) => handleDrillDown(title, data, type)}
              />
            </div>
          </TabsContent>

          <TabsContent value="breakdown" className="space-y-6">
            <EnhancedDiscountBreakdownTables 
              data={discountAnalysisData}
              onDrillDown={handleDrillDown}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>      {/* Drill Down Modal */}
      <DiscountDrillDownModal
        isOpen={drillDownData.isOpen}
        onClose={() => setDrillDownData({ isOpen: false, title: '', data: [], type: '' })}
        title={drillDownData.title}
        data={drillDownData.data}
        type={drillDownData.type}
      />
    </div>
  );
};