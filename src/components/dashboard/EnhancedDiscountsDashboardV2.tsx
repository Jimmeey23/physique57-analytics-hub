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
  // Get the first day of the previous month
  const firstDayPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  // Get the last day of the previous month  
  const lastDayPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };
  
  return {
    start: formatDate(firstDayPreviousMonth),
    end: formatDate(lastDayPreviousMonth)
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
          
          // Handle multiple date formats
          if (item.paymentDate.includes('/')) {
            // Handle YYYY/MM/DD HH:MM:SS format
            if (item.paymentDate.includes(' ')) {
              const [datePart] = item.paymentDate.split(' ');
              const [year, month, day] = datePart.split('/');
              itemDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            } else {
              // Handle DD/MM/YYYY format
              const [day, month, year] = item.paymentDate.split('/');
              itemDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            }
          } else {
            itemDate = new Date(item.paymentDate);
          }
          
          if (!itemDate || isNaN(itemDate.getTime())) {
            console.log('Invalid date for item:', item.paymentDate);
            return false;
          }
          
          const itemInRange = (!startDate || itemDate >= startDate) && (!endDate || itemDate <= endDate);
          if (!itemInRange && console.log) {
            console.log('Date out of range:', { 
              paymentDate: item.paymentDate, 
              parsed: itemDate.toISOString(),
              inRange: itemInRange 
            });
          }
          
          return itemInRange;
        });
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

  return (
    <div className="space-y-8">
      {/* Note Taker Component */}
      <div className="container mx-auto px-6">
  {/* NoteTaker removed as per request */}
      </div>

      {/* Filter and Location Tabs */}
      <div className="container mx-auto px-6 space-y-6">
        <Tabs value={activeLocation} onValueChange={setActiveLocation} className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="bg-white/90 backdrop-blur-sm p-2 rounded-2xl shadow-xl border-0 grid grid-cols-4 w-full max-w-7xl min-h-24 overflow-hidden">
              {locations.map(location => (
                <TabsTrigger 
                  key={location.id} 
                  value={location.id} 
                  className="relative px-6 py-4 font-semibold text-gray-800 transition-all duration-300 ease-out hover:scale-105 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-50 text-2xl rounded-2xl"
                >
                  <div className="relative z-10 text-center">
                    <div className="font-bold">{location.name.split(',')[0]}</div>
                    <div className="text-xs opacity-80">{location.name.split(',')[1]?.trim()}</div>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {locations.map(location => (
            <TabsContent key={location.id} value={location.id} className="space-y-8">
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
                <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-orange-100 via-amber-100 to-yellow-100 p-1 rounded-xl shadow-lg border border-orange-200/50">
                  <TabsTrigger value="detailed" className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-orange-800 font-semibold transition-all duration-300">
                    Data Tables
                  </TabsTrigger>
                  <TabsTrigger value="breakdown" className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-orange-800 font-semibold transition-all duration-300">
                    Breakdowns
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-orange-800 font-semibold transition-all duration-300">
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
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Drill Down Modal */}
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