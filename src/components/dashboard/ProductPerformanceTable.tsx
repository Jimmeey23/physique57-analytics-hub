import React, { useMemo, useState } from 'react';
import { SalesData, YearOnYearMetricType } from '@/types/dashboard';
import { YearOnYearMetricTabs } from './YearOnYearMetricTabs';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { ShoppingCart, TrendingUp, TrendingDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { generateStandardMonthRange } from '@/utils/dateUtils';
interface ProductPerformanceTableProps {
  data: SalesData[];
  onRowClick: (row: any) => void;
  selectedMetric?: YearOnYearMetricType;
}
export const ProductPerformanceTable: React.FC<ProductPerformanceTableProps> = ({
  data,
  onRowClick,
  selectedMetric: initialMetric = 'revenue'
}) => {
  const [selectedMetric, setSelectedMetric] = useState<YearOnYearMetricType>(initialMetric);
  // Use standard 22-month range (October 2025 to January 2024)
  const monthlyData = useMemo(() => generateStandardMonthRange(), []);
  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;

    // Handle DD/MM/YYYY format
    const ddmmyyyy = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (ddmmyyyy) {
      const [, day, month, year] = ddmmyyyy;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    // Handle other common date formats
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  };
  const getMetricValue = (items: SalesData[], metric: YearOnYearMetricType) => {
    if (!items.length) return 0;
    const totalRevenue = items.reduce((sum, item) => sum + (item.paymentValue || 0), 0);
    const totalTransactions = items.length;
    const uniqueMembers = new Set(items.map(item => item.memberId)).size;
    const totalUnits = items.length;
    const totalDiscount = items.reduce((sum, item) => sum + (item.discountAmount || 0), 0);
    const avgDiscountPercentage = items.length > 0 ? 
      items.reduce((sum, item) => sum + (item.discountPercentage || 0), 0) / items.length : 0;

    switch (metric) {
      case 'revenue':
        return totalRevenue;
      case 'transactions':
        return totalTransactions;
      case 'members':
        return uniqueMembers;
      case 'units':
        return totalUnits;
      case 'atv':
        return totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
      case 'auv':
        return totalUnits > 0 ? totalRevenue / totalUnits : 0;
      case 'asv':
        return uniqueMembers > 0 ? totalRevenue / uniqueMembers : 0;
      case 'upt':
        return totalTransactions > 0 ? totalUnits / totalTransactions : 0;
      case 'vat':
        return items.reduce((sum, item) => sum + (item.paymentVAT || 0), 0);
      case 'discountValue':
        return totalDiscount;
      case 'discountPercentage':
        return avgDiscountPercentage;
      default:
        return 0;
    }
  };
  const formatMetricValue = (value: number, metric: YearOnYearMetricType) => {
    switch (metric) {
      case 'revenue':
      case 'vat':
      case 'discountValue':
        return formatCurrency(value);
      case 'atv':
      case 'auv':
      case 'asv':
        return formatCurrency(Math.round(value));
      // No decimals
      case 'transactions':
      case 'members':
      case 'units':
        return formatNumber(value);
      case 'upt':
        return value.toFixed(1);
      case 'discountPercentage':
        return `${value.toFixed(1)}%`;
      // 1 decimal
      default:
        return formatNumber(value);
    }
  };
  const processedData = useMemo(() => {
    console.log('Processing product data:', data.length, 'records');
    const productGroups = data.reduce((acc: Record<string, SalesData[]>, item) => {
      const product = item.cleanedProduct || 'Unknown';
      if (!acc[product]) {
        acc[product] = [];
      }
      acc[product].push(item);
      return acc;
    }, {});
    console.log('Product groups:', Object.keys(productGroups));
    const productData = Object.entries(productGroups).map(([product, items]) => {
      const monthlyValues: Record<string, number> = {};
      monthlyData.forEach(({
        key,
        year,
        month
      }) => {
        const monthItems = items.filter(item => {
          const itemDate = parseDate(item.paymentDate);
          if (!itemDate) return false;
          return itemDate.getFullYear() === year && itemDate.getMonth() + 1 === month;
        });
        monthlyValues[key] = getMetricValue(monthItems, selectedMetric);
      });
      const metricValue = getMetricValue(items, selectedMetric);
      const totalRevenue = items.reduce((sum, item) => sum + (item.paymentValue || 0), 0);
      const totalTransactions = items.length;
      const uniqueMembers = new Set(items.map(item => item.memberId)).size;
      return {
        product,
        metricValue,
        monthlyValues,
        rawData: items,
        // Add comprehensive data for drill-down
        name: product,
        grossRevenue: totalRevenue,
        netRevenue: totalRevenue,
        totalValue: totalRevenue,
        totalCurrent: totalRevenue,
        totalTransactions,
        totalCustomers: uniqueMembers,
        uniqueMembers,
        transactions: totalTransactions,
        totalChange: monthlyData.length >= 2 ? ((monthlyValues[monthlyData[monthlyData.length - 1].key] || 0) - (monthlyValues[monthlyData[monthlyData.length - 2].key] || 0)) / (monthlyValues[monthlyData[monthlyData.length - 2].key] || 1) * 100 : 0,
        months: monthlyData.reduce((acc, {
          key,
          display
        }) => {
          acc[display] = {
            current: monthlyValues[key] || 0,
            change: 0
          };
          return acc;
        }, {} as Record<string, any>)
      };
    });
    console.log('Processed product data:', productData.length, 'products');
    console.log('Sample product data:', productData[0]);
    return productData.sort((a, b) => b.metricValue - a.metricValue);
  }, [data, selectedMetric, monthlyData]);
  const getGrowthIndicator = (current: number, previous: number) => {
    if (previous === 0 && current === 0) return null;
    if (previous === 0) return <TrendingUp className="w-3 h-3 text-green-500 inline ml-1" />;
    const growth = (current - previous) / previous * 100;
    if (growth > 5) {
      return <TrendingUp className="w-3 h-3 text-green-500 inline ml-1" />;
    } else if (growth < -5) {
      return <TrendingDown className="w-3 h-3 text-red-500 inline ml-1" />;
    }
    return null;
  };
  const totalsRow = useMemo(() => {
    const monthlyTotals: Record<string, number> = {};
    monthlyData.forEach(({
      key
    }) => {
      monthlyTotals[key] = processedData.reduce((sum, item) => sum + (item.monthlyValues[key] || 0), 0);
    });
    return {
      product: 'TOTAL',
      metricValue: getMetricValue(data, selectedMetric),
      monthlyValues: monthlyTotals
    };
  }, [processedData, monthlyData, data, selectedMetric]);
  return <Card className="bg-gradient-to-br from-white via-slate-50/30 to-white border-0 shadow-xl rounded-xl">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-orange-600" />
                Product Performance Month-on-Month Analysis
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Monthly performance metrics by product category ({data.length} total records)
              </p>
            </div>
          </div>
          
          <YearOnYearMetricTabs value={selectedMetric} onValueChange={setSelectedMetric} className="w-full" />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto rounded-lg">
          <table className="min-w-full bg-white border-t border-gray-200 rounded-lg">
            <thead className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white font-semibold text-sm uppercase tracking-wider sticky top-0 z-20">
              <tr>
                <th className="text-white font-semibold uppercase tracking-wider px-6 py-3 text-left rounded-tl-lg sticky left-0 z-30 bg-slate-800 border-r border-white/20">Product</th>
                <th className="text-white font-semibold text-xs uppercase tracking-wider px-3 py-2 min-w-24">Contribution %</th>
                {monthlyData.map(({
                key,
                display
              }) => <th key={key} className="text-white font-semibold text-xs uppercase tracking-wider px-3 py-2 border-l border-white/20 min-w-32">
                    <div className="flex flex-col">
                      <span className="text-sm">{display.split(' ')[0]}</span>
                      <span className="text-slate-300 text-xs">{display.split(' ')[1]}</span>
                    </div>
                  </th>)}
              </tr>
            </thead>
            <tbody>
              {processedData.map((item, index) => <tr key={item.product} onClick={() => {
                // Calculate dynamic metrics for drill-down
                const specificData = item.rawData || [];
                const dynamicRevenue = specificData.reduce((sum: any, transaction: any) => sum + (transaction.paymentValue || 0), 0);
                const dynamicTransactions = specificData.length;
                const dynamicCustomers = new Set(specificData.map((transaction: any) => transaction.memberId || transaction.customerEmail)).size;
                
                const enhancedItem = {
                  ...item,
                  // Override with dynamic calculations
                  totalRevenue: dynamicRevenue,
                  grossRevenue: dynamicRevenue,
                  netRevenue: dynamicRevenue,
                  totalValue: dynamicRevenue,
                  totalCurrent: dynamicRevenue,
                  metricValue: dynamicRevenue,
                  transactions: dynamicTransactions,
                  totalTransactions: dynamicTransactions,
                  uniqueMembers: dynamicCustomers,
                  totalCustomers: dynamicCustomers,
                  rawData: specificData,
                  filteredTransactionData: specificData,
                  // Add dynamic flags
                  isDynamic: true,
                  calculatedFromFiltered: true
                };
                
                console.log(`Product ${item.product} drill-down: ${dynamicTransactions} transactions, ${dynamicRevenue} revenue`);
                onRowClick(enhancedItem);
              }} className="hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition-colors duration-200">
                  <td className="px-6 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-white border-r border-gray-200 min-w-60">
                    <div className="flex items-center gap-4 min-w-60">
                      <span className="font-bold text-slate-700">#{index + 1}</span>
                      <span className="text-zinc-950 font-bold">{item.product}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center text-sm text-gray-900 font-mono">
                    {(item.metricValue / totalsRow.metricValue * 100).toFixed(1)}%
                  </td>
                  {monthlyData.map(({
                key,
                year,
                month,
                display
              }, monthIndex) => {
                const current = item.monthlyValues[key] || 0;
                const previous = monthIndex > 0 ? item.monthlyValues[monthlyData[monthIndex - 1].key] || 0 : 0;
                const monthTotal = totalsRow.monthlyValues[key] || 0;
                const contribution = monthTotal > 0 ? (current / monthTotal * 100) : 0;
                
                return <td 
                  key={key} 
                  className="px-3 py-3 text-center text-sm text-gray-900 font-mono border-l border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors"
                  title={`Contribution: ${contribution.toFixed(1)}% of month total`}
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent row click
                    
                    // Filter data for this specific month and product
                    const monthSpecificData = (item.rawData || []).filter((transaction: any) => {
                      const itemDate = parseDate(transaction.paymentDate);
                      if (!itemDate) return false;
                      return itemDate.getFullYear() === year && itemDate.getMonth() + 1 === month;
                    });
                    
                    const monthRevenue = monthSpecificData.reduce((sum: any, transaction: any) => sum + (transaction.paymentValue || 0), 0);
                    const monthTransactions = monthSpecificData.length;
                    const monthCustomers = new Set(monthSpecificData.map((transaction: any) => transaction.memberId || transaction.customerEmail)).size;
                    
                    const enhancedCellData = {
                      ...item,
                      name: `${item.product} - ${display}`,
                      totalRevenue: monthRevenue,
                      grossRevenue: monthRevenue,
                      netRevenue: monthRevenue,
                      totalValue: monthRevenue,
                      totalCurrent: monthRevenue,
                      metricValue: monthRevenue,
                      transactions: monthTransactions,
                      totalTransactions: monthTransactions,
                      uniqueMembers: monthCustomers,
                      totalCustomers: monthCustomers,
                      rawData: monthSpecificData,
                      filteredTransactionData: monthSpecificData,
                      isDynamic: true,
                      calculatedFromFiltered: true,
                      cellSpecific: true,
                      month: display,
                      monthKey: key
                    };
                    
                    console.log(`Cell click: ${item.product} - ${display}: ${monthTransactions} transactions, ${monthRevenue} revenue`);
                    onRowClick(enhancedCellData);
                  }}
                >
                        <div className="flex items-center justify-center">
                          {formatMetricValue(current, selectedMetric)}
                          {getGrowthIndicator(current, previous)}
                        </div>
                      </td>;
              })}
                </tr>)}
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-t-4 border-gray-900 font-bold bg-slate-100">
                <td 
                  className="px-6 py-3 text-sm font-bold text-gray-900 sticky left-0 border-r border-gray-200 bg-slate-100 hover:bg-blue-100 cursor-pointer transition-colors"
                  onClick={() => {
                    // Total row click - show all data
                    const totalRevenue = data.reduce((sum, item) => sum + (item.paymentValue || 0), 0);
                    const totalTransactions = data.length;
                    const totalCustomers = new Set(data.map(item => item.memberId || item.customerEmail)).size;
                    
                    const totalRowData = {
                      name: 'All Products - Total',
                      totalRevenue,
                      grossRevenue: totalRevenue,
                      netRevenue: totalRevenue,
                      totalValue: totalRevenue,
                      totalCurrent: totalRevenue,
                      metricValue: totalRevenue,
                      transactions: totalTransactions,
                      totalTransactions,
                      uniqueMembers: totalCustomers,
                      totalCustomers,
                      rawData: data,
                      filteredTransactionData: data,
                      isDynamic: true,
                      calculatedFromFiltered: true,
                      isTotal: true
                    };
                    
                    console.log(`Total row click: All products - ${totalTransactions} transactions, ${totalRevenue} revenue`);
                    onRowClick(totalRowData);
                  }}
                >
                  TOTAL
                </td>
                {monthlyData.map(({
                key,
                year,
                month,
                display
              }) => <td 
                key={key} 
                className="px-3 py-3 text-center text-sm text-indigo-900 font-mono font-bold border-l border-gray-200 bg-slate-200 hover:bg-blue-100 cursor-pointer transition-colors"
                onClick={() => {
                  // Total cell click for specific month
                  const monthSpecificData = data.filter(item => {
                    const itemDate = parseDate(item.paymentDate);
                    if (!itemDate) return false;
                    return itemDate.getFullYear() === year && itemDate.getMonth() + 1 === month;
                  });
                  
                  const monthRevenue = monthSpecificData.reduce((sum, item) => sum + (item.paymentValue || 0), 0);
                  const monthTransactions = monthSpecificData.length;
                  const monthCustomers = new Set(monthSpecificData.map(item => item.memberId || item.customerEmail)).size;
                  
                  const totalCellData = {
                    name: `All Products - ${display}`,
                    totalRevenue: monthRevenue,
                    grossRevenue: monthRevenue,
                    netRevenue: monthRevenue,
                    totalValue: monthRevenue,
                    totalCurrent: monthRevenue,
                    metricValue: monthRevenue,
                    transactions: monthTransactions,
                    totalTransactions: monthTransactions,
                    uniqueMembers: monthCustomers,
                    totalCustomers: monthCustomers,
                    rawData: monthSpecificData,
                    filteredTransactionData: monthSpecificData,
                    isDynamic: true,
                    calculatedFromFiltered: true,
                    isTotal: true,
                    cellSpecific: true,
                    month: display,
                    monthKey: key
                  };
                  
                  console.log(`Total cell click: All products - ${display}: ${monthTransactions} transactions, ${monthRevenue} revenue`);
                  onRowClick(totalCellData);
                }}
              >
                    {formatMetricValue(totalsRow.monthlyValues[key] || 0, selectedMetric)}
                  </td>)}
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>;
};