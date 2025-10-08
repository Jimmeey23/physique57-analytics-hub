import React, { useMemo, useState, useCallback } from 'react';
import { SalesData, FilterOptions, YearOnYearMetricType } from '@/types/dashboard';
import { ModernTableWrapper, ModernGroupBadge, ModernMetricTabs, STANDARD_METRICS } from './ModernTableWrapper';
import { PersistentTableFooter } from './PersistentTableFooter';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { generateStandardMonthRange } from '@/utils/dateUtils';
import { ChevronDown, ChevronRight, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getRankingDisplay } from '@/utils/rankingUtils';

interface MonthOnMonthTableNewProps {
  data: SalesData[];
  onRowClick?: (row: any) => void;
  filters?: FilterOptions;
  collapsedGroups?: Set<string>;
  onGroupToggle?: (groups: Set<string>) => void;
  selectedMetric?: YearOnYearMetricType;
}

const groupDataByCategory = (data: SalesData[]) => {
  return data.reduce((acc: Record<string, any>, item) => {
    const category = item.cleanedCategory || 'Uncategorized';
    const product = item.cleanedProduct || 'Unspecified';
    if (!acc[category]) {
      acc[category] = {};
    }
    if (!acc[category][product]) {
      acc[category][product] = [];
    }
    acc[category][product].push(item);
    return acc;
  }, {});
};

export const MonthOnMonthTableNew: React.FC<MonthOnMonthTableNewProps> = ({
  data,
  onRowClick,
  filters = {
    dateRange: { start: '', end: '' },
    location: [],
    category: [],
    product: [],
    soldBy: [],
    paymentMethod: []
  },
  collapsedGroups = new Set(),
  onGroupToggle = () => {},
  selectedMetric: initialMetric = 'revenue'
}) => {
  const [selectedMetric, setSelectedMetric] = useState<YearOnYearMetricType>(initialMetric);
  const [localCollapsedGroups, setLocalCollapsedGroups] = useState<Set<string>>(new Set());
  const [displayMode, setDisplayMode] = useState<'values' | 'growth'>('values');

  React.useEffect(() => {
    if (onGroupToggle) {
      onGroupToggle(localCollapsedGroups);
    }
  }, [localCollapsedGroups, onGroupToggle]);

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
    const totalUnits = items.length; // Each transaction represents 1 unit
    const totalDiscountAmount = items.reduce((sum, item) => sum + (item.discountAmount || 0), 0);
    const totalVat = items.reduce((sum, item) => sum + (item.paymentVAT || item.vat || 0), 0);
    const avgDiscountPercentage = items.length > 0 ? 
      items.reduce((sum, item) => sum + (item.discountPercentage || 0), 0) / items.length : 0;

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
      case 'discountValue': return totalDiscountAmount;
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
      case 'discountValue':
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

  // Use standard 22-month range (October 2025 to January 2024)
  const monthlyData = useMemo(() => generateStandardMonthRange(), []);

  const processedData = useMemo(() => {
    const grouped = groupDataByCategory(data);
    const categories = Object.entries(grouped).map(([category, products]) => {
      const categoryData = {
        category,
        products: Object.entries(products).map(([product, items]) => {
          const monthlyValues: Record<string, number> = {};

          monthlyData.forEach(({ key, year, month }) => {
            const monthItems = (items as SalesData[]).filter(item => {
              const itemDate = parseDate(item.paymentDate);
              return itemDate && itemDate.getFullYear() === year && itemDate.getMonth() + 1 === month;
            });
            monthlyValues[key] = getMetricValue(monthItems, selectedMetric);
          });

          return {
            product,
            monthlyValues,
            rawData: items,
            totalValue: getMetricValue(items as SalesData[], selectedMetric)
          };
        })
      };

      const categoryMonthlyValues: Record<string, number> = {};
      monthlyData.forEach(({ key }) => {
        categoryMonthlyValues[key] = categoryData.products.reduce((sum, p) => sum + (p.monthlyValues[key] || 0), 0);
      });
      
      return {
        ...categoryData,
        monthlyValues: categoryMonthlyValues,
        products: categoryData.products.sort((a, b) => b.totalValue - a.totalValue)
      };
    });
    
    return categories.sort((a, b) => {
      const aTotalValue = Object.values(a.monthlyValues).reduce((sum, val) => sum + val, 0);
      const bTotalValue = Object.values(b.monthlyValues).reduce((sum, val) => sum + val, 0);
      return bTotalValue - aTotalValue;
    });
  }, [data, selectedMetric, monthlyData]);

  const toggleGroup = useCallback((groupKey: string) => {
    setLocalCollapsedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  }, []);

  const handleCollapseAll = useCallback(() => {
    const allGroups = new Set(processedData.map(item => item.category));
    setLocalCollapsedGroups(allGroups);
  }, [processedData]);

  // Prepare data for AI analysis
  const aiTableData = useMemo(() => {
    const flatData: any[] = [];
    processedData.forEach(categoryGroup => {
      categoryGroup.products.forEach(product => {
        const monthlyEntries = Object.fromEntries(
          monthlyData.slice(0, 12).map(({ key }) => [
            `month_${key}`, product.monthlyValues[key] || 0
          ])
        );
        
        flatData.push({
          category: categoryGroup.category,
          product: product.product,
          totalValue: product.totalValue,
          totalItems: (product.rawData as SalesData[]).length,
          totalRevenue: (product.rawData as SalesData[]).reduce((sum, item) => sum + (item.paymentValue || 0), 0),
          uniqueMembers: new Set((product.rawData as SalesData[]).map(item => item.memberId)).size,
          ...monthlyEntries
        });
      });
    });
    return flatData;
  }, [processedData, monthlyData]);

  const aiTableColumns = useMemo(() => {
    const baseColumns = [
      { key: 'category', header: 'Category', type: 'text' as const },
      { key: 'product', header: 'Product', type: 'text' as const },
      { key: 'totalValue', header: `Total ${selectedMetric}`, type: selectedMetric === 'revenue' || selectedMetric === 'atv' || selectedMetric === 'auv' ? 'currency' as const : 'number' as const },
      { key: 'totalItems', header: 'Total Items', type: 'number' as const },
      { key: 'totalRevenue', header: 'Total Revenue', type: 'currency' as const },
      { key: 'uniqueMembers', header: 'Unique Members', type: 'number' as const }
    ];

    const monthColumns = monthlyData.slice(0, 12).map(({ key, display }) => ({
      key: `month_${key}`,
      header: display,
      type: selectedMetric === 'revenue' || selectedMetric === 'atv' || selectedMetric === 'auv' ? 'currency' as const : 'number' as const
    }));

    return [...baseColumns, ...monthColumns];
  }, [monthlyData, selectedMetric]);

  const handleExpandAll = useCallback(() => {
    setLocalCollapsedGroups(new Set());
  }, []);

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
        className="mb-4"
      />

      <ModernTableWrapper
        title="Month-on-Month Analysis"
        description="Comprehensive monthly performance comparison across categories and products"
        icon={<Calendar className="w-5 h-5 text-white" />}
        totalItems={processedData.reduce((sum, cat) => sum + cat.products.length, 0)}
        collapsedGroups={localCollapsedGroups}
        onCollapseAll={handleCollapseAll}
        onExpandAll={handleExpandAll}
        showDisplayToggle={true}
        displayMode={displayMode}
        onDisplayModeChange={setDisplayMode}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="sticky top-0 z-30">
              <tr className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800">
                <th className="w-80 px-6 py-3 text-left text-white font-bold text-sm uppercase tracking-wide sticky left-0 bg-gradient-to-r from-slate-800 to-slate-900 z-40 border-r border-white/20">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-white" />
                    <span>Category / Product</span>
                  </div>
                </th>
                
                {monthlyData.slice(0, 12).map(({ key, display }) => (
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
              {processedData.map((categoryGroup, categoryIndex) => {
                const categoryTotalValue = Object.values(categoryGroup.monthlyValues).reduce((sum, val) => sum + val, 0);
                
                return (
                  <React.Fragment key={categoryGroup.category}>
                    {/* Category Row */}
                    <tr className="group bg-slate-100 border-b border-slate-300 font-semibold hover:bg-slate-200 transition-all duration-200 h-10 max-h-10">
                      <td 
                        className="w-80 px-4 py-2 text-left sticky left-0 bg-slate-100 group-hover:bg-slate-200 border-r border-slate-300 z-20 cursor-pointer transition-all duration-200"
                        onClick={(e) => {
                          const target = e.target as HTMLElement;
                          if (target.closest('button')) return;
                          
                          onRowClick?.({
                            type: 'category',
                            category: categoryGroup.category,
                            data: categoryGroup.products,
                            metric: selectedMetric,
                            value: categoryTotalValue
                          });
                        }}
                      >
                        <div className="flex items-center space-x-2 min-h-6">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleGroup(categoryGroup.category);
                            }} 
                            className="p-1 h-5 w-5 rounded text-slate-600 hover:text-slate-800 hover:bg-white/50 transition-all duration-200 shrink-0"
                          >
                            {localCollapsedGroups.has(categoryGroup.category) ? 
                              <ChevronRight className="w-3 h-3" /> : 
                              <ChevronDown className="w-3 h-3" />
                            }
                          </Button>
                          <div className="flex items-center space-x-2 flex-1">
                            {getRankingDisplay(categoryIndex + 1)}
                            <span className="font-bold text-sm text-slate-800 truncate">{categoryGroup.category}</span>
                          </div>
                          <ModernGroupBadge 
                            count={categoryGroup.products.length} 
                            label="items"
                          />
                        </div>
                      </td>
                      
                      {monthlyData.slice(0, 12).map(({ key }, monthIndex) => {
                        const current = categoryGroup.monthlyValues[key] || 0;
                        const previousMonthKey = monthlyData[monthIndex + 1]?.key;
                        const previous = previousMonthKey ? (categoryGroup.monthlyValues[previousMonthKey] || 0) : 0;
                        const growthPercentage = monthIndex < monthlyData.length - 1 ? getGrowthPercentage(current, previous) : null;
                        
                        return (
                          <td 
                            key={key} 
                            className="px-2 py-2 text-center text-sm font-bold text-slate-800 border-l border-slate-300 hover:bg-orange-100/50 cursor-pointer transition-all duration-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRowClick?.({
                                drillDownContext: 'mom-category-month',
                                filterCriteria: { category: categoryGroup.category, month: key },
                                name: `${categoryGroup.category} (${key})`,
                                category: categoryGroup.category,
                                month: key,
                              });
                            }}
                            title={growthPercentage ? `${growthPercentage}% vs previous month` : ''}
                          >
                            <div className="flex flex-col items-center space-y-0.5 min-h-6 justify-center">
                              {displayMode === 'values' ? (
                                <span className="font-mono text-xs whitespace-nowrap">{formatMetricValue(current, selectedMetric)}</span>
                              ) : (
                                growthPercentage && (
                                  <div className={`flex items-center space-x-1 text-xs ${
                                    parseFloat(growthPercentage) > 0 ? 'text-emerald-600' : 'text-red-500'
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

                    {/* Product Rows */}
                    {!localCollapsedGroups.has(categoryGroup.category) && 
                      categoryGroup.products.map((product, productIndex) => (
                        <tr 
                          key={`${categoryGroup.category}-${product.product}`}
                          className="bg-white hover:bg-slate-50 border-b border-gray-200 transition-all duration-200 h-10 max-h-10"
                        >
                          <td className="w-80 px-8 py-2 text-left sticky left-0 bg-white hover:bg-slate-50 border-r border-gray-200 z-10 cursor-pointer transition-all duration-200"
                            onClick={() => {
                              onRowClick?.({
                                drillDownContext: 'mom-product-all',
                                filterCriteria: { product: product.product, category: categoryGroup.category },
                                name: product.product,
                                product: product.product,
                                category: categoryGroup.category,
                              });
                            }}
                          >
                            <div className="flex items-center space-x-2 min-h-6">
                              <div className="shrink-0">{getRankingDisplay(productIndex + 1)}</div>
                              <span className="text-slate-700 font-medium text-sm truncate">{product.product}</span>
                            </div>
                          </td>
                          
                          {monthlyData.slice(0, 12).map(({ key }, monthIndex) => {
                            const current = product.monthlyValues[key] || 0;
                            const previousMonthKey = monthlyData[monthIndex + 1]?.key;
                            const previous = previousMonthKey ? (product.monthlyValues[previousMonthKey] || 0) : 0;
                            const growthPercentage = monthIndex < monthlyData.length - 1 ? getGrowthPercentage(current, previous) : null;
                            
                            return (
                              <td 
                                key={key} 
                                className="px-2 py-2 text-center text-sm font-mono text-slate-700 border-l border-gray-200 hover:bg-orange-100 cursor-pointer transition-all duration-200"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRowClick?.({
                                    drillDownContext: 'mom-product-month',
                                    filterCriteria: { product: product.product, category: categoryGroup.category, month: key },
                                    name: `${product.product} (${key})`,
                                    product: product.product,
                                    category: categoryGroup.category,
                                    month: key,
                                  });
                                }}
                                title={growthPercentage ? `${growthPercentage}% vs previous month` : ''}
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
                      ))
                    }
                  </React.Fragment>
                );
              })}
              
              {/* Totals Row */}
              <tr className="bg-slate-800 text-white font-bold border-t-2 border-slate-400 h-10 max-h-10">
                <td className="w-80 px-4 py-2 text-left sticky left-0 bg-slate-800 border-r border-slate-400 z-20">
                  <div className="flex items-center space-x-2 min-h-6">
                    <span className="font-bold text-sm text-white">TOTALS</span>
                  </div>
                </td>
                
                {monthlyData.slice(0, 12).map(({ key }) => {
                  const totalValue = processedData.reduce((sum, categoryGroup) => 
                    sum + (categoryGroup.monthlyValues[key] || 0), 0
                  );
                  
                  return (
                    <td 
                      key={key} 
                      className="px-2 py-2 text-center text-sm font-bold text-white border-l border-slate-400 hover:bg-slate-700 cursor-pointer transition-all duration-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRowClick?.({
                          drillDownContext: 'mom-total-month',
                          filterCriteria: { month: key },
                          name: `All Products (${key})`,
                          month: key,
                        });
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
        tableId="month-on-month-analysis"
        initialText="• Monthly performance trends across all product categories • Growth patterns and seasonal variations • Key performance indicators by category and product"
        tableData={aiTableData}
        tableColumns={aiTableColumns}
        tableName="Month-on-Month Performance Analysis"
        tableContext={`Detailed monthly performance tracking by category and product showing ${selectedMetric} trends over ${monthlyData.slice(0, 12).length} months`}
      />
    </div>
  );
};