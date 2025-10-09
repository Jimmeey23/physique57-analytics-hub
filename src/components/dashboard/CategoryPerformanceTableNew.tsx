import React, { useMemo, useState, useCallback } from 'react';
import { SalesData, YearOnYearMetricType } from '@/types/dashboard';
import { ModernTableWrapper, ModernGroupBadge, ModernMetricTabs, STANDARD_METRICS } from './ModernTableWrapper';
import { PersistentTableFooter } from './PersistentTableFooter';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { ChevronDown, ChevronRight, FolderOpen, TrendingUp, TrendingDown, BarChart3, DollarSign, Users, ShoppingCart, Target, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getRankingDisplay } from '@/utils/rankingUtils';

interface CategoryPerformanceTableNewProps {
  data: SalesData[];
  onRowClick: (row: any) => void;
  selectedMetric?: YearOnYearMetricType;
}

export const CategoryPerformanceTableNew: React.FC<CategoryPerformanceTableNewProps> = ({
  data,
  onRowClick,
  selectedMetric: initialMetric = 'revenue'
}) => {
  const [selectedMetric, setSelectedMetric] = useState<YearOnYearMetricType>(initialMetric);
  const [localCollapsedGroups, setLocalCollapsedGroups] = useState<Set<string>>(new Set());
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
    const totalUnits = items.length;

    switch (metric) {
      case 'revenue': return totalRevenue;
      case 'transactions': return totalTransactions;
      case 'members': return uniqueMembers;
      case 'units': return totalUnits;
      case 'atv': return totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
      case 'auv': return uniqueMembers > 0 ? totalRevenue / uniqueMembers : 0;
      case 'upt': return totalTransactions > 0 ? totalUnits / totalTransactions : 0;
      default: return 0;
    }
  };

  const formatMetricValue = (value: number, metric: YearOnYearMetricType) => {
    switch (metric) {
      case 'revenue':
      case 'auv':
      case 'atv':
        return formatCurrency(value);
      case 'transactions':
      case 'members':
      case 'units':
        return formatNumber(value);
      case 'upt':
        return value.toFixed(2);
      default:
        return formatNumber(value);
    }
  };

  const monthlyData = useMemo(() => {
    const months = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Generate last 22 months in descending order (October 2025 to January 2024)
    for (let i = 0; i < 22; i++) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const monthName = monthNames[date.getMonth()];
      months.push({
        key: `${year}-${String(month).padStart(2, '0')}`,
        display: `${monthName} ${year}`,
        year: year,
        month: month,
        quarter: Math.ceil(month / 3)
      });
    }
    return months;
  }, []);

  const processedData = useMemo(() => {
    // Group by category
    const categoryGroups = data.reduce((acc: Record<string, SalesData[]>, item) => {
      const category = item.cleanedCategory || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {});

    const categoryData = Object.entries(categoryGroups).map(([category, items]) => {
      const monthlyValues: Record<string, number> = {};
      
      monthlyData.forEach(({ key, year, month }) => {
        const monthItems = items.filter(item => {
          const itemDate = parseDate(item.paymentDate);
          return itemDate && itemDate.getFullYear() === year && itemDate.getMonth() + 1 === month;
        });
        monthlyValues[key] = getMetricValue(monthItems, selectedMetric);
      });

      // Get unique products in this category
      const uniqueProducts = new Set(items.map(item => item.cleanedProduct || 'Unknown')).size;

      return {
        category,
        monthlyValues,
        totalValue: getMetricValue(items, selectedMetric),
        totalRevenue: items.reduce((sum, item) => sum + (item.paymentValue || 0), 0),
        totalTransactions: items.length,
        uniqueMembers: new Set(items.map(item => item.memberId)).size,
        uniqueProducts,
        rawData: items
      };
    });

    return categoryData.sort((a, b) => b.totalValue - a.totalValue);
  }, [data, selectedMetric, monthlyData]);

  const getGrowthPercentage = (current: number, previous: number) => {
    if (previous === 0 && current === 0) return null;
    if (previous === 0) return '+100';
    return ((current - previous) / previous * 100).toFixed(1);
  };

  // Prepare data and columns for AI analysis
  const aiTableData = useMemo(() => {
    return processedData.map(category => ({
      category: category.category,
      totalRevenue: category.totalRevenue,
      totalTransactions: category.totalTransactions,
      uniqueMembers: category.uniqueMembers,
      uniqueProducts: category.uniqueProducts,
      avgTransactionValue: category.totalTransactions > 0 ? category.totalRevenue / category.totalTransactions : 0,
      avgRevenuePerMember: category.uniqueMembers > 0 ? category.totalRevenue / category.uniqueMembers : 0,
      ...Object.fromEntries(
        monthlyData.slice(-12).map(({ key }) => [
          `month_${key}`, category.monthlyValues[key] || 0
        ])
      )
    }));
  }, [processedData, monthlyData]);

  const aiTableColumns = useMemo(() => {
    const baseColumns = [
      { key: 'category', header: 'Category', type: 'text' as const },
      { key: 'totalRevenue', header: 'Total Revenue', type: 'currency' as const },
      { key: 'totalTransactions', header: 'Total Transactions', type: 'number' as const },
      { key: 'uniqueMembers', header: 'Unique Members', type: 'number' as const },
      { key: 'uniqueProducts', header: 'Unique Products', type: 'number' as const },
      { key: 'avgTransactionValue', header: 'Avg Transaction Value', type: 'currency' as const },
      { key: 'avgRevenuePerMember', header: 'Avg Revenue per Member', type: 'currency' as const }
    ];

    const monthColumns = monthlyData.slice(-12).map(({ key, display }) => ({
      key: `month_${key}`,
      header: `${display}`,
      type: selectedMetric === 'revenue' || selectedMetric === 'atv' || selectedMetric === 'auv' ? 'currency' as const : 'number' as const
    }));

    return [...baseColumns, ...monthColumns];
  }, [monthlyData, selectedMetric]);



  return (
    <div className="space-y-6">
      {/* Modern Metric Selector */}
      <ModernMetricTabs
        metrics={STANDARD_METRICS}
        selectedMetric={selectedMetric}
        onMetricChange={(metric) => setSelectedMetric(metric as YearOnYearMetricType)}
      />

      <ModernTableWrapper
        title="Category Performance Analysis"
        description="High-level category performance overview with comprehensive metrics and trends"
        icon={<Layers className="w-6 h-6 text-white" />}
        totalItems={processedData.length}
        showDisplayToggle={true}
        displayMode={displayMode}
        onDisplayModeChange={setDisplayMode}
        className="animate-in slide-in-from-bottom-8 fade-in duration-1000"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="sticky top-0 z-30">
              <tr className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800">
                <th className="w-80 px-6 py-3 text-left text-white font-bold text-sm uppercase tracking-wide sticky left-0 bg-gradient-to-r from-slate-800 to-slate-900 z-40 border-r border-white/20">
                  <div className="flex items-center space-x-2">
                    <FolderOpen className="w-4 h-4 text-white" />
                    <span>Category</span>
                  </div>
                </th>
                
                {monthlyData.slice(-12).map(({ key, display }) => (
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
              {processedData.map((category, categoryIndex) => (
                <tr 
                  key={category.category}
                  className="bg-white hover:bg-slate-50 border-b border-gray-200 transition-all duration-200 h-10 max-h-10"
                  onClick={() => onRowClick?.({
                    ...category,
                    contextType: 'category',
                    drillDownContext: 'category-performance',
                    filterCriteria: {
                      category: category.category
                    },
                    clickedItemName: category.category,
                    contextDescription: `Complete performance analysis for ${category.category} category`
                  })}
                >
                  <td className="w-80 px-4 py-2 text-left sticky left-0 bg-white hover:bg-slate-50 border-r border-gray-200 z-20 cursor-pointer transition-all duration-200">
                    <div className="flex items-center space-x-2 min-h-6">
                      <div className="flex items-center space-x-2 flex-1">
                        <div className="shrink-0">{getRankingDisplay(categoryIndex + 1)}</div>
                        <span className="text-slate-700 font-medium text-sm truncate">{category.category}</span>
                      </div>
                      <div className="flex space-x-1.5">
                        <ModernGroupBadge 
                          count={category.totalTransactions} 
                          label="transactions"
                        />
                        <ModernGroupBadge 
                          count={category.uniqueMembers} 
                          label="members"
                        />
                      </div>
                    </div>
                  </td>
                  
                  {monthlyData.slice(-12).map(({ key }, monthIndex) => {
                    const current = category.monthlyValues[key] || 0;
                    const previousMonthKey = monthlyData[monthIndex + 1]?.key;
                    const previous = previousMonthKey ? (category.monthlyValues[previousMonthKey] || 0) : 0;
                    const growthPercentage = monthIndex < monthlyData.length - 1 ? getGrowthPercentage(current, previous) : null;
                    
                    return (
                      <td 
                        key={key} 
                        className="px-2 py-2 text-center text-sm font-mono text-slate-700 border-l border-gray-200 hover:bg-slate-100 cursor-pointer transition-all duration-200"
                        title={growthPercentage ? `${growthPercentage}% vs previous month` : ''}
                        onClick={(e) => {
                          e.stopPropagation();
                          onRowClick?.({
                            ...category,
                            contextType: 'category-month',
                            filterCriteria: {
                              category: category.category,
                              month: key,
                              specificValue: current
                            },
                            drillDownContext: {
                              type: 'category-month',
                              itemName: category.category,
                              month: key,
                              value: current,
                              metric: selectedMetric
                            },
                            clickedItemName: category.category,
                            contextDescription: `${category.category} performance in ${key}: ${formatMetricValue(current, selectedMetric)}`
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
                  drillDownContext: 'category-grand-total',
                  filterCriteria: {},
                  name: 'Grand Total (All Categories)',
                  rawData: data,
                  isGroup: true,
                })}
              >
                <td className="w-80 px-4 py-2 text-left sticky left-0 bg-slate-800 group-hover:bg-slate-700 border-r border-slate-400 z-20">
                  <div className="flex items-center space-x-2 min-h-6">
                    <span className="font-bold text-sm text-white">TOTALS</span>
                  </div>
                </td>
                
                {monthlyData.slice(-12).map(({ key }) => {
                  const totalValue = processedData.reduce((sum, category) => {
                    return sum + (category.monthlyValues[key] || 0);
                  }, 0);
                  
                  return (
                    <td 
                      key={key} 
                      className="px-2 py-2 text-center text-sm font-bold text-white border-l border-slate-400 group-hover:bg-slate-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRowClick?.({
                          drillDownContext: 'category-total-month',
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
        tableId="category-performance-analysis"
        initialText="• Category-level performance insights across all product lines\n• Revenue distribution and market share analysis by category\n• Growth trends and seasonal patterns identification"
        className="animate-in slide-in-from-bottom-4 fade-in duration-1000 delay-300"
        tableData={aiTableData}
        tableColumns={aiTableColumns}
        tableName="Category Performance Analysis"
        tableContext={`Performance analysis by product category showing ${selectedMetric} trends across ${monthlyData.slice(-12).length} months`}
      />
    </div>
  );
};