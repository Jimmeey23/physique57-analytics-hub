import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { SalesData, YearOnYearMetricType } from '@/types/dashboard';
import { YearOnYearMetricTabs } from './YearOnYearMetricTabs';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { CreditCard, TrendingUp, TrendingDown, Edit3, Save, X, ShrinkIcon, ExpandIcon, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import CopyTableButton from '@/components/ui/CopyTableButton';
import { useMetricsTablesRegistry } from '@/contexts/MetricsTablesRegistryContext';
interface PaymentMethodMonthOnMonthTableProps {
  data: SalesData[];
  onRowClick: (row: any) => void;
  selectedMetric?: YearOnYearMetricType;
}
export const PaymentMethodMonthOnMonthTable: React.FC<PaymentMethodMonthOnMonthTableProps> = ({
  data,
  onRowClick,
  selectedMetric: initialMetric = 'revenue'
}) => {
  const [selectedMetric, setSelectedMetric] = useState<YearOnYearMetricType>(initialMetric);
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [summaryText, setSummaryText] = useState('• Digital payment methods showing strong adoption\n• Credit card transactions dominate premium services\n• Cash payments declining as expected in digital transformation');
  const [isTableCollapsed, setIsTableCollapsed] = useState(false);
  
  // Table ref for copy functionality
  const tableRef = useRef<HTMLTableElement>(null);
  const tableId = 'payment-method-month-on-month-table';
  
  // Register with metrics tables registry
  const { registerTable, unregisterTable } = useMetricsTablesRegistry();
  
  useEffect(() => {
    registerTable(tableId, tableRef);
    return () => unregisterTable(tableId);
  }, [registerTable, unregisterTable]);
  
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
  const monthlyData = useMemo(() => {
    const months = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Get current date for dynamic month calculation
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Generate months starting from Jan 2024 up to current month
    const startYear = 2024;
    const startMonth = 0; // January (0-indexed)
    
    for (let year = startYear; year <= currentYear; year++) {
      const fromMonth = year === startYear ? startMonth : 0;
      const toMonth = year === currentYear ? currentMonth : 11;
      
      for (let month = fromMonth; month <= toMonth; month++) {
        const monthName = monthNames[month];
        months.push({
          key: `${year}-${String(month + 1).padStart(2, '0')}`,
          display: `${monthName} ${year}`,
          year: year,
          month: month + 1,
          quarter: Math.ceil((month + 1) / 3)
        });
      }
    }
    return months;
  }, []);
  const processedData = useMemo(() => {
    // Debug log removed for production
    const paymentMethodGroups = data.reduce((acc: Record<string, SalesData[]>, item) => {
      const paymentMethod = item.paymentMethod || 'Unknown';
      if (!acc[paymentMethod]) {
        acc[paymentMethod] = [];
      }
      acc[paymentMethod].push(item);
      return acc;
    }, {});
    // Debug log removed for production
    const paymentMethodData = Object.entries(paymentMethodGroups).map(([paymentMethod, items]) => {
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
        paymentMethod,
        metricValue,
        monthlyValues,
        rawData: items,
        // Add comprehensive data for drill-down
        name: paymentMethod,
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
    // Debug log removed for production
    // Debug log removed for production
    return paymentMethodData.sort((a, b) => b.metricValue - a.metricValue);
  }, [data, selectedMetric, monthlyData]);
  const getGrowthIndicator = (current: number, previous: number, period: 'month' = 'month') => {
    if (previous === 0 && current === 0) return null;
    if (previous === 0) return (
      <div className="flex items-center gap-1">
        <TrendingUp className="w-3 h-3 text-green-500 inline" />
        <span className="text-green-600 text-xs">New vs last {period}</span>
      </div>
    );
    const growth = (current - previous) / previous * 100;
    if (growth > 5) {
      return (
        <div className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-green-500 inline" />
          <span className="text-green-600 text-xs">+{growth.toFixed(1)}% vs last {period}</span>
        </div>
      );
    } else if (growth < -5) {
      return (
        <div className="flex items-center gap-1">
          <TrendingDown className="w-3 h-3 text-red-500 inline" />
          <span className="text-red-600 text-xs">{growth.toFixed(1)}% vs last {period}</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1">
        <span className="text-gray-500 text-xs">{growth.toFixed(1)}% vs last {period}</span>
      </div>
    );
  };
  const getPaymentMethodBadge = (method: string) => {
    const color = method.toLowerCase().includes('card') ? 'bg-blue-100 text-blue-800' : method.toLowerCase().includes('cash') ? 'bg-green-100 text-green-800' : method.toLowerCase().includes('digital') ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800';
    return <Badge className={`${color} text-xs min-w-20 h-6 flex items-center justify-center`}>
        {method}
      </Badge>;
  };

  // Calculate totals row
  const totalsRow = useMemo(() => {
    const monthlyTotals: Record<string, number> = {};
    monthlyData.forEach(({
      key
    }) => {
      monthlyTotals[key] = processedData.reduce((sum, item) => sum + (item.monthlyValues[key] || 0), 0);
    });
    return {
      paymentMethod: 'TOTAL',
      metricValue: getMetricValue(data, selectedMetric),
      monthlyValues: monthlyTotals
    };
  }, [processedData, monthlyData, data, selectedMetric]);
  const saveSummary = () => {
    setIsEditingSummary(false);
    localStorage.setItem('paymentMethodMonthOnMonthSummary', summaryText);
  };
  const cancelEdit = () => {
    setIsEditingSummary(false);
    const saved = localStorage.getItem('paymentMethodMonthOnMonthSummary');
    if (saved) setSummaryText(saved);
  };
  return <Card className="bg-gradient-to-br from-white via-slate-50/30 to-white border-0 shadow-xl rounded-xl">
      <CardHeader className="pb-4 bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 rounded-t-lg">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-400" />
                Payment Method Month-on-Month Analysis
              </CardTitle>
              <p className="text-sm text-slate-300 mt-1">
                Monthly performance metrics by payment method ({data.length} total records)
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <CopyTableButton tableRef={tableRef} />
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsTableCollapsed(!isTableCollapsed)}
                className="flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                {isTableCollapsed ? <ExpandIcon className="w-4 h-4" /> : <ShrinkIcon className="w-4 h-4" />}
                {isTableCollapsed ? 'Expand' : 'Collapse'}
              </Button>
            </div>
          </div>
          
          <YearOnYearMetricTabs value={selectedMetric} onValueChange={setSelectedMetric} className="w-full" />
        </div>
      </CardHeader>

      {!isTableCollapsed && (
      <CardContent className="p-0">
        <div className="overflow-x-auto rounded-lg">
            <table ref={tableRef} id={tableId} className="min-w-full bg-white unified-table">
              <thead className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white font-semibold text-sm uppercase tracking-wider sticky top-0 z-20">
                <tr>
                  <th className="text-white font-bold uppercase tracking-wider px-6 py-3 text-left rounded-tl-lg sticky left-0 bg-gradient-to-r from-slate-800 to-slate-900 z-30 border-r border-white/20">Payment Method</th>
                  <th className="text-white font-bold text-xs uppercase tracking-wider px-3 py-3 border-l border-white/20 min-w-24">Contribution %</th>
                  {monthlyData.map(({
                  key,
                  display
                }) => <th key={key} className="text-white font-bold text-xs uppercase tracking-wider px-3 py-3 border-l border-white/20 min-w-32">
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-bold">{display.split(' ')[0]}</span>
                        <span className="text-slate-300 text-xs">{display.split(' ')[1]}</span>
                      </div>
                    </th>)}
                </tr>
              </thead>
              <tbody>
                {processedData.map((item, index) => <tr key={item.paymentMethod} className="hover:bg-blue-50 cursor-pointer border-b border-gray-100 transition-colors duration-200" onClick={() => onRowClick(item)}>
                    <td className="px-6 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-white border-r border-gray-200 min-w-60">
                      <div className="flex items-center gap-4 min-w-60">
                        <span className="font-bold text-slate-700">#{index + 1}</span>
                        {getPaymentMethodBadge(item.paymentMethod)}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center text-sm text-gray-900 font-mono">
                      {(item.metricValue / totalsRow.metricValue * 100).toFixed(1)}%
                    </td>
                    {monthlyData.map(({
                  key
                }, monthIndex) => {
                  const current = item.monthlyValues[key] || 0;
                  const previous = monthIndex > 0 ? item.monthlyValues[monthlyData[monthIndex - 1].key] || 0 : 0;
                  const monthTotal = totalsRow.monthlyValues[key] || 0;
                  const contribution = monthTotal > 0 ? (current / monthTotal * 100) : 0;
                  
                  return <td key={key} className="px-3 py-3 text-center text-sm text-gray-900 font-mono border-l border-gray-100 hover:bg-blue-100 cursor-pointer transition-colors group relative">
                          <div className="flex flex-col items-center justify-center">
                            <div>{formatMetricValue(current, selectedMetric)}</div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute bg-slate-800 text-white px-2 py-1 rounded text-xs z-40 -mt-8">
                              {getGrowthIndicator(current, previous)}
                              {contribution > 0 && <div className="text-blue-200">{contribution.toFixed(1)}% of month</div>}
                            </div>
                          </div>
                        </td>;
                })}
                  </tr>)}
              <tr className="bg-slate-800 text-white border-t-2 border-slate-600 font-bold">
                <td className="px-6 py-3 text-sm font-bold sticky left-0 bg-slate-800 border-r border-slate-600">
                  TOTAL
                </td>
                <td className="px-3 py-3 text-center text-sm font-mono font-bold border-l border-slate-600">100%</td>
                {monthlyData.map(({
                key
              }) => <td key={key} className="px-3 py-3 text-center text-sm font-mono font-bold border-l border-slate-600">
                    {formatMetricValue(totalsRow.monthlyValues[key] || 0, selectedMetric)}
                  </td>)}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Summary/Insights Section */}
        <div className="p-6 border-t border-gray-200 bg-gradient-to-r from-slate-50 to-white rounded-b-lg">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Payment Method Insights
            </h4>
            {!isEditingSummary ? <Button variant="outline" size="sm" onClick={() => setIsEditingSummary(true)} className="gap-2">
                <Edit3 className="w-4 h-4" />
                Edit
              </Button> : <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={saveSummary} className="gap-2 text-green-600">
                  <Save className="w-4 h-4" />
                  Save
                </Button>
                <Button variant="outline" size="sm" onClick={cancelEdit} className="gap-2 text-red-600">
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
              </div>}
          </div>
          
          {isEditingSummary ? <Textarea value={summaryText} onChange={e => setSummaryText(e.target.value)} placeholder="Enter payment method insights using bullet points (• )" className="min-h-32 text-sm" /> : <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-sm text-gray-700 whitespace-pre-line">
                {summaryText}
              </div>
            </div>}
        </div>
      </CardContent>
      )}
    </Card>;
};