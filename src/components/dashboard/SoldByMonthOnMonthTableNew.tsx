import React, { useMemo, useState, useCallback } from 'react';
import { SalesData, YearOnYearMetricType } from '@/types/dashboard';
import { ModernTableWrapper, ModernGroupBadge, ModernMetricTabs, STANDARD_METRICS } from './ModernTableWrapper';
import { PersistentTableFooter } from './PersistentTableFooter';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { ChevronDown, ChevronRight, Users, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getRankingDisplay } from '@/utils/rankingUtils';

interface SoldByMonthOnMonthTableNewProps {
  data: SalesData[];
  onRowClick?: (row: any) => void;
  selectedMetric?: YearOnYearMetricType;
  onReady?: () => void;
}

export const SoldByMonthOnMonthTableNew: React.FC<SoldByMonthOnMonthTableNewProps> = ({
  data,
  onRowClick,
  selectedMetric: initialMetric = 'revenue',
  onReady
}) => {
  const [selectedMetric, setSelectedMetric] = useState<YearOnYearMetricType>(initialMetric);
  const [displayMode, setDisplayMode] = useState<'values' | 'growth'>('values');

  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const ddmmyyyy = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (ddmmyyyy) {
      const [, day, month, year] = ddmmyyyy;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  };

  const getMetricValue = (items: SalesData[], metric: YearOnYearMetricType) => {
    if (!items.length) return 0;
    const totalRevenue = items.reduce((sum, item) => sum + (item.paymentValue || 0), 0);
    const totalTransactions = items.length;
    const uniqueMembers = new Set(items.map(item => item.memberId)).size;
    const totalUnits = items.length; // Each transaction is 1 unit
    
    // Use actual VAT from data, not calculated percentage
    const totalVat = items.reduce((sum, item) => sum + (item.paymentVAT || item.vat || 0), 0);
    
    // Use actual discount data from the items
    const totalDiscount = items.reduce((sum, item) => sum + (item.discountAmount || 0), 0);
    
    // Calculate average discount percentage from actual data
    const itemsWithDiscount = items.filter(item => (item.discountAmount || 0) > 0);
    const avgDiscountPercentage = itemsWithDiscount.length > 0 
      ? itemsWithDiscount.reduce((sum, item) => sum + (item.discountPercentage || 0), 0) / itemsWithDiscount.length
      : 0;

    switch (metric) {
      case 'revenue': return totalRevenue;
      case 'transactions': return totalTransactions;
      case 'members': return uniqueMembers;
      case 'units': return totalUnits;
      case 'atv': return totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
      case 'auv': return uniqueMembers > 0 ? totalRevenue / uniqueMembers : 0;
      case 'upt': return totalTransactions > 0 ? totalUnits / totalTransactions : 0;
      case 'asv': return totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
      case 'vat': return totalVat;
      case 'discountValue': return totalDiscount;
      case 'discountPercentage': return avgDiscountPercentage;
      default: return 0;
    }
  };

  const formatMetricValue = (value: number, metric: YearOnYearMetricType) => {
    switch (metric) {
      case 'revenue':
      case 'auv':
      case 'atv':
      case 'asv':
      case 'vat':
        return formatCurrency(value);
      case 'transactions':
      case 'members':
      case 'units':
        return formatNumber(value);
      case 'upt':
        return value.toFixed(2);
      case 'discountPercentage':
        return `${value.toFixed(1)}%`;
      default:
        return formatNumber(value);
    }
  };

  const monthlyData = useMemo(() => {
    const months = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Generate from October 2025 back to January 2024 (22 months total)
    const currentDate = new Date(2025, 9, 1); // October 2025 (0-indexed)
    const startDate = new Date(2024, 0, 1);   // January 2024 (0-indexed)
    
    let currentYear = currentDate.getFullYear();
    let currentMonth = currentDate.getMonth();
    
    while (currentYear > startDate.getFullYear() || 
           (currentYear === startDate.getFullYear() && currentMonth >= startDate.getMonth())) {
      
      const monthName = monthNames[currentMonth];
      months.push({
        key: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`,
        display: `${monthName} ${currentYear}`,
        year: currentYear,
        month: currentMonth + 1,
        quarter: Math.ceil((currentMonth + 1) / 3),
        sortOrder: currentYear * 100 + (currentMonth + 1)
      });
      
      // Move to previous month
      currentMonth--;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
    }
    
    return months;
  }, []);

  // monthlyData here is descending (current back). Use full range to Jan 2024.
  const visibleMonths = useMemo(() => monthlyData, [monthlyData]);

  // Notify parent when ready
  const [readySent, setReadySent] = React.useState(false);
  React.useEffect(() => {
    if (!readySent && processedData.length > 0 && visibleMonths.length > 0) {
      setReadySent(true);
      onReady?.();
    }
  }, [readySent, processedData, visibleMonths, onReady]);

  const processedData = useMemo(() => {
    // Group by soldBy
    const soldByGroups = data.reduce((acc: Record<string, SalesData[]>, item) => {
      const seller = item.soldBy || 'Unknown';
      if (!acc[seller]) {
        acc[seller] = [];
      }
      acc[seller].push(item);
      return acc;
    }, {});

    const sellerData = Object.entries(soldByGroups).map(([seller, items]) => {
      const monthlyValues: Record<string, number> = {};
      
      monthlyData.forEach(({ key, year, month }) => {
        const monthItems = items.filter(item => {
          const itemDate = parseDate(item.paymentDate);
          return itemDate && itemDate.getFullYear() === year && itemDate.getMonth() + 1 === month;
        });
        monthlyValues[key] = getMetricValue(monthItems, selectedMetric);
      });

      return {
        seller,
        monthlyValues,
        totalValue: getMetricValue(items, selectedMetric),
        totalRevenue: items.reduce((sum, item) => sum + (item.paymentValue || 0), 0),
        totalTransactions: items.length,
        uniqueMembers: new Set(items.map(item => item.memberId)).size,
        rawData: items
      };
    });

    return sellerData.sort((a, b) => b.totalValue - a.totalValue);
  }, [data, selectedMetric, monthlyData]);

  const getGrowthPercentage = (current: number, previous: number) => {
    if (previous === 0 && current === 0) return null;
    if (previous === 0) return '+100';
    return ((current - previous) / previous * 100).toFixed(1);
  };

  return (
    <div className="space-y-4">
      {/* Modern Metric Selector */}
      <ModernMetricTabs
        metrics={STANDARD_METRICS}
        selectedMetric={selectedMetric}
        onMetricChange={(metric) => setSelectedMetric(metric as YearOnYearMetricType)}
      />

      <ModernTableWrapper
        title="Sales Team Performance"
        description="Individual seller performance analysis across all metrics and timeframes"
        icon={<Users className="w-5 h-5 text-white" />}
        totalItems={processedData.length}
        showDisplayToggle={true}
        displayMode={displayMode}
        onDisplayModeChange={setDisplayMode}
        showCollapseControls={false}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="sticky top-0 z-30">
              <tr className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800">
                <th className="w-80 px-6 py-3 text-left text-white font-bold text-sm uppercase tracking-wide sticky left-0 bg-gradient-to-r from-slate-800 to-slate-900 z-40 border-r border-white/20">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-white" />
                    <span>Sales Representative</span>
                  </div>
                </th>
                
                {visibleMonths.map(({ key, display }) => (
                  <th key={key} className="px-3 py-3 text-center text-white font-bold text-xs uppercase tracking-wider border-l border-white/20 min-w-[90px]">
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-bold whitespace-nowrap">{display.split(' ')[0]}</span>
                      <span className="text-slate-300 text-xs">{display.split(' ')[1]}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {processedData.map((seller, sellerIndex) => (
                <tr 
                  key={seller.seller}
                  className="bg-white hover:bg-slate-50 border-b border-gray-200 transition-all duration-200 h-10 max-h-10"
                  onClick={() => onRowClick?.({
                    ...seller,
                    contextType: 'soldBy',
                    drillDownContext: 'soldby-analysis',
                    filterCriteria: {
                      soldBy: seller.seller
                    }
                  })}
                >
                  <td className="w-80 px-4 py-2 text-left sticky left-0 bg-white hover:bg-slate-50 border-r border-gray-200 z-20 cursor-pointer transition-all duration-200">
                    <div className="flex items-center space-x-2 min-h-6">
                      <div className="flex items-center space-x-2 flex-1">
                        <div className="shrink-0">{getRankingDisplay(sellerIndex + 1)}</div>
                        <span className="text-slate-700 font-medium text-sm truncate">{seller.seller}</span>
                      </div>
                      <div className="flex space-x-1.5">
                        <ModernGroupBadge 
                          count={seller.totalTransactions} 
                          label="sales"
                        />
                        <ModernGroupBadge 
                          count={seller.uniqueMembers} 
                          label="members"
                        />
                      </div>
                    </div>
                  </td>
                  
                  {visibleMonths.map(({ key }, monthIndex) => {
                    const current = seller.monthlyValues[key] || 0;
                    const previousMonthKey = visibleMonths[monthIndex + 1]?.key;
                    const previous = previousMonthKey ? (seller.monthlyValues[previousMonthKey] || 0) : 0;
                    const growthPercentage = monthIndex < visibleMonths.length - 1 ? getGrowthPercentage(current, previous) : null;
                    
                    return (
                      <td 
                        key={key} 
                        className="px-2 py-2 text-center text-sm font-mono text-slate-700 border-l border-gray-200 hover:bg-slate-100 cursor-pointer transition-all duration-200"
                        title={growthPercentage ? `${growthPercentage}% vs previous month` : ''}
                        onClick={(e) => {
                          e.stopPropagation();
                          onRowClick?.({
                            ...seller,
                            contextType: 'soldBy-month',
                            filterCriteria: {
                              soldBy: seller.seller,
                              month: key,
                              specificValue: current
                            },
                            drillDownContext: {
                              type: 'soldBy-month',
                              itemName: seller.seller,
                              month: key,
                              value: current,
                              metric: selectedMetric
                            },
                            clickedItemName: seller.seller,
                            contextDescription: `${seller.seller} performance in ${key}: ${formatMetricValue(current, selectedMetric)}`
                          });
                        }}
                      >
                        <div className="flex flex-col items-center space-y-0.5 min-h-6 justify-center">
                          {displayMode === 'values' ? (
                            <span className="text-xs whitespace-nowrap">{formatMetricValue(current, selectedMetric)}</span>
                          ) : (
                            growthPercentage && (
                              <div className={`flex items-center space-x-1 text-xs ${
                                parseFloat(growthPercentage) > 0 ? 'text-emerald-500' : 'text-red-400'
                              }`}>
                                {parseFloat(growthPercentage) > 0 ? 
                                  <TrendingUp className="w-2 h-2" /> : 
                                  <TrendingDown className="w-2 h-2" />
                                }
                                <span className="font-mono">{Math.abs(parseFloat(growthPercentage))}%</span>
                              </div>
                            )
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
              
              {/* Totals Row */}
              <tr 
                className="bg-slate-800 text-white font-bold border-t-2 border-slate-400 h-10 max-h-10 cursor-pointer hover:bg-slate-700"
                onClick={() => onRowClick?.({
                  drillDownContext: 'soldby-grand-total',
                  filterCriteria: {},
                  name: 'Grand Total (All Sellers)',
                  rawData: data,
                  isGroup: true,
                })}
              >
                <td className="w-80 px-4 py-2 text-left sticky left-0 bg-slate-800 group-hover:bg-slate-700 border-r border-slate-400 z-20">
                  <div className="flex items-center space-x-2 min-h-6">
                    <span className="font-bold text-sm text-white">TOTALS</span>
                  </div>
                </td>
                
                {visibleMonths.map(({ key }) => {
                  const totalValue = processedData.reduce((sum, seller) => 
                    sum + (seller.monthlyValues[key] || 0), 0
                  );
                  
                  return (
                    <td 
                      key={key} 
                      className="px-2 py-2 text-center text-sm font-bold text-white border-l border-slate-400 group-hover:bg-slate-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRowClick?.({
                          drillDownContext: 'soldby-total-month',
                          filterCriteria: { month: key },
                          name: `Grand Total (${key})`,
                          month: key,
                        })
                      }}
                    >
                      <div className="flex flex-col items-center space-y-0.5 min-h-6 justify-center">
                        <span className="font-mono text-xs whitespace-nowrap">{formatMetricValue(totalValue, selectedMetric)}</span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </ModernTableWrapper>
      
      {/* Persistent Footer */}
      <PersistentTableFooter
        tableId="sales-team-performance"
        initialText="• Sales team performance analysis by individual seller • Consistent performers identified for recognition • Training opportunities highlighted for underperformers"
      />
    </div>
  );
};