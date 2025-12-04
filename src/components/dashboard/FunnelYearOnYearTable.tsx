import React, { useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { ModernDataTable } from '@/components/ui/ModernDataTable';
import { Badge } from '@/components/ui/badge';
import { Calendar, BarChart3, TrendingUp, TrendingDown, Filter, Eye, Percent } from 'lucide-react';
import { LeadsData } from '@/types/leads';
import { formatNumber, formatCurrency } from '@/utils/formatters';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { ModernTableWrapper } from './ModernTableWrapper';
import { Button } from '@/components/ui/button';
interface FunnelYearOnYearTableProps {
  allData: LeadsData[]; // Use all data, not filtered
  onDrillDown?: (title: string, data: LeadsData[], type: string) => void;
}
type MetricType = 'totalLeads' | 'trialsCompleted' | 'trialsScheduled' | 'proximityIssues' | 'convertedLeads' | 'trialToMemberRate' | 'leadToTrialRate' | 'leadToMemberRate' | 'ltv' | 'avgVisits' | 'pipelineHealth';
export const FunnelYearOnYearTable: React.FC<FunnelYearOnYearTableProps> = ({
  allData,
  onDrillDown
}) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('totalLeads');
  const [viewMode, setViewMode] = useState<'values' | 'growth'>('values');
  const tableRef = useRef<HTMLTableElement>(null);

  const tableVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  const headerVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 }
    }
  };
  const processedData = useMemo(() => {
    if (!allData.length) return [];
    const sourceData = allData.reduce((acc, lead) => {
      const source = lead.source || 'Unknown';
      if (!acc[source]) {
        acc[source] = {};
      }
      if (lead.createdAt) {
        const date = new Date(lead.createdAt);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const yearMonthKey = `${year}-${String(month).padStart(2, '0')}`;
        if (!acc[source][yearMonthKey]) {
          acc[source][yearMonthKey] = {
            totalLeads: 0,
            trialsCompleted: 0,
            trialsScheduled: 0,
            proximityIssues: 0,
            convertedLeads: 0,
            totalLTV: 0,
            totalVisits: 0
          };
        }
        const yearMonthData = acc[source][yearMonthKey];
        yearMonthData.totalLeads += 1;
  const ts = (lead.trialStatus || '').toLowerCase();
  const st = (lead.stage || '').toLowerCase();
  if (lead.trialStatus === 'Trial Completed' || lead.stage === 'Trial Completed') yearMonthData.trialsCompleted += 1;
  if ((ts.includes('trial') && !ts.includes('completed')) || (st.includes('trial') && !st.includes('completed'))) yearMonthData.trialsScheduled += 1;
  if (st.includes('proximity') || (lead.remarks || '').toLowerCase().includes('proximity')) yearMonthData.proximityIssues += 1;
        if (lead.conversionStatus === 'Converted') yearMonthData.convertedLeads += 1;
        yearMonthData.totalLTV += lead.ltv || 0;
        yearMonthData.totalVisits += lead.visits || 0;
      }
      return acc;
    }, {} as Record<string, Record<string, any>>);

    // Generate months for current year and previous year
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const months = [] as { month: number; name: string; current: string; previous: string }[];
    // Build months from Jan to current month for both years
    for (let month = 1; month <= currentMonth; month++) {
      const monthName = new Date(currentYear, month - 1).toLocaleString('default', { month: 'short' });
      months.push({
        month,
        name: monthName,
        current: `${currentYear}-${String(month).padStart(2, '0')}`,
        previous: `${currentYear - 1}-${String(month).padStart(2, '0')}`
      });
    }
    return Object.keys(sourceData).map(source => {
      const sourceStats = sourceData[source];
      const result: any = {
        source
      };
      months.forEach(monthInfo => {
        const currentData = sourceStats[monthInfo.current] || {
          totalLeads: 0,
          trialsCompleted: 0,
          trialsScheduled: 0,
          proximityIssues: 0,
          convertedLeads: 0,
          totalLTV: 0,
          totalVisits: 0
        };
        const previousData = sourceStats[monthInfo.previous] || {
          totalLeads: 0,
          trialsCompleted: 0,
          trialsScheduled: 0,
          proximityIssues: 0,
          convertedLeads: 0,
          totalLTV: 0,
          totalVisits: 0
        };
        const calculateMetric = (data: any) => {
          const trialToMemberRate = data.trialsCompleted > 0 ? data.convertedLeads / data.trialsCompleted * 100 : 0;
          const leadToTrialRate = data.totalLeads > 0 ? data.trialsCompleted / data.totalLeads * 100 : 0;
          const leadToMemberRate = data.totalLeads > 0 ? data.convertedLeads / data.totalLeads * 100 : 0;
          const avgLTV = data.totalLeads > 0 ? data.totalLTV / data.totalLeads : 0;
          const avgVisits = data.totalLeads > 0 ? data.totalVisits / data.totalLeads : 0;
          const pipelineHealth = data.totalLeads > 0 ? (data.totalLeads - data.proximityIssues) / data.totalLeads * 100 : 0;
          return {
            totalLeads: data.totalLeads,
            trialsCompleted: data.trialsCompleted,
            trialsScheduled: data.trialsScheduled,
            proximityIssues: data.proximityIssues,
            convertedLeads: data.convertedLeads,
            trialToMemberRate,
            leadToTrialRate,
            leadToMemberRate,
            ltv: avgLTV,
            avgVisits,
            pipelineHealth
          };
        };
        const currentMetrics = calculateMetric(currentData);
        const previousMetrics = calculateMetric(previousData);
        result[`${monthInfo.name}_${currentYear}`] = currentMetrics;
        result[`${monthInfo.name}_${currentYear - 1}`] = previousMetrics;
      });
      return result;
    }).filter(source => {
      return months.some(monthInfo => source[`${monthInfo.name}_${currentYear}`]?.totalLeads > 0 || source[`${monthInfo.name}_${currentYear - 1}`]?.totalLeads > 0);
    });
  }, [allData]);
  // Raw totals with nested metrics (for calculations)
  const rawTotals = useMemo(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const months = [] as { month: number; name: string }[];
    for (let month = 1; month <= currentMonth; month++) {
      const monthName = new Date(currentYear, month - 1).toLocaleString('default', { month: 'short' });
      months.push({ month, name: monthName });
    }
    const result: any = {
      source: 'TOTALS'
    };
    months.forEach(monthInfo => {
      const currentTotals = processedData.reduce((acc, source) => {
        const data = source[`${monthInfo.name}_${currentYear}`] || {};
        acc.totalLeads += data.totalLeads || 0;
        acc.trialsCompleted += data.trialsCompleted || 0;
        acc.trialsScheduled += data.trialsScheduled || 0;
        acc.proximityIssues += data.proximityIssues || 0;
        acc.convertedLeads += data.convertedLeads || 0;
        acc.totalLTV += (data.ltv || 0) * (data.totalLeads || 0);
        acc.totalVisits += (data.avgVisits || 0) * (data.totalLeads || 0);
        return acc;
      }, {
        totalLeads: 0,
        trialsCompleted: 0,
        trialsScheduled: 0,
        proximityIssues: 0,
        convertedLeads: 0,
        totalLTV: 0,
        totalVisits: 0
      });
      const previousTotals = processedData.reduce((acc, source) => {
        const data = source[`${monthInfo.name}_${currentYear - 1}`] || {};
        acc.totalLeads += data.totalLeads || 0;
        acc.trialsCompleted += data.trialsCompleted || 0;
        acc.trialsScheduled += data.trialsScheduled || 0;
        acc.proximityIssues += data.proximityIssues || 0;
        acc.convertedLeads += data.convertedLeads || 0;
        acc.totalLTV += (data.ltv || 0) * (data.totalLeads || 0);
        acc.totalVisits += (data.avgVisits || 0) * (data.totalLeads || 0);
        return acc;
      }, {
        totalLeads: 0,
        trialsCompleted: 0,
        trialsScheduled: 0,
        proximityIssues: 0,
        convertedLeads: 0,
        totalLTV: 0,
        totalVisits: 0
      });
      const calculateTotalMetrics = (totals: any) => {
        const trialToMemberRate = totals.trialsCompleted > 0 ? totals.convertedLeads / totals.trialsCompleted * 100 : 0;
        const leadToTrialRate = totals.totalLeads > 0 ? totals.trialsCompleted / totals.totalLeads * 100 : 0;
        const leadToMemberRate = totals.totalLeads > 0 ? totals.convertedLeads / totals.totalLeads * 100 : 0;
        const avgLTV = totals.totalLeads > 0 ? totals.totalLTV / totals.totalLeads : 0;
        const avgVisits = totals.totalLeads > 0 ? totals.totalVisits / totals.totalLeads : 0;
        const pipelineHealth = totals.totalLeads > 0 ? (totals.totalLeads - totals.proximityIssues) / totals.totalLeads * 100 : 0;
        return {
          totalLeads: totals.totalLeads,
          trialsCompleted: totals.trialsCompleted,
          trialsScheduled: totals.trialsScheduled,
          proximityIssues: totals.proximityIssues,
          convertedLeads: totals.convertedLeads,
          trialToMemberRate,
          leadToTrialRate,
          leadToMemberRate,
          ltv: avgLTV,
          avgVisits,
          pipelineHealth
        };
      };
      result[`${monthInfo.name}_${currentYear}`] = calculateTotalMetrics(currentTotals);
      result[`${monthInfo.name}_${currentYear - 1}`] = calculateTotalMetrics(previousTotals);
    });
    return result;
  }, [processedData]);

  // Pre-formatted footer data that extracts the selected metric for display
  const totals = useMemo(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const months = [] as { month: number; name: string }[];
    for (let month = 1; month <= currentMonth; month++) {
      const monthName = new Date(currentYear, month - 1).toLocaleString('default', { month: 'short' });
      months.push({ month, name: monthName });
    }
    
    const result: any = {
      source: 'TOTALS'
    };
    
    months.forEach(monthInfo => {
      const currentData = rawTotals[`${monthInfo.name}_${currentYear}`];
      const previousData = rawTotals[`${monthInfo.name}_${currentYear - 1}`];
      
      if (viewMode === 'growth') {
        // In growth mode, show YoY growth percentage
        const currentVal = currentData?.[selectedMetric] || 0;
        const previousVal = previousData?.[selectedMetric] || 0;
        if (previousVal > 0) {
          const growth = ((currentVal - previousVal) / previousVal) * 100;
          result[`${monthInfo.name}_${currentYear}`] = growth > 0 ? `+${growth.toFixed(1)}%` : `${growth.toFixed(1)}%`;
        } else {
          result[`${monthInfo.name}_${currentYear}`] = '-';
        }
        result[`${monthInfo.name}_${currentYear - 1}`] = '—';
      } else {
        // In values mode, show the formatted metric value
        result[`${monthInfo.name}_${currentYear}`] = formatValue(currentData, selectedMetric);
        result[`${monthInfo.name}_${currentYear - 1}`] = formatValue(previousData, selectedMetric);
      }
    });
    
    return result;
  }, [rawTotals, selectedMetric, viewMode]);
  const formatValue = (value: any, metric: MetricType) => {
    if (typeof value !== 'object' || !value) return '-';
    const metricValue = value[metric];
    if (metricValue === undefined || metricValue === 0) return '-';
    switch (metric) {
      case 'ltv':
        return metricValue < 1000 ? `₹${Math.round(metricValue)}` : formatCurrency(metricValue);
      case 'trialToMemberRate':
      case 'leadToTrialRate':
      case 'leadToMemberRate':
      case 'pipelineHealth':
        return `${metricValue.toFixed(1)}%`;
      case 'avgVisits':
        return metricValue.toFixed(1);
      default:
        return metricValue.toLocaleString('en-IN');
    }
  };
  const metricTabs = [{
    value: 'totalLeads',
    label: 'Total Leads'
  }, {
    value: 'trialsCompleted',
    label: 'Trials Completed'
  }, {
    value: 'trialsScheduled',
    label: 'Trials Scheduled'
  }, {
    value: 'proximityIssues',
    label: 'Proximity Issues'
  }, {
    value: 'convertedLeads',
    label: 'Converted Leads'
  }, {
    value: 'trialToMemberRate',
    label: 'Trial → Member Rate'
  }, {
    value: 'leadToTrialRate',
    label: 'Lead → Trial Rate'
  }, {
    value: 'leadToMemberRate',
    label: 'Lead → Member Rate'
  }, {
    value: 'ltv',
    label: 'Average LTV'
  }, {
    value: 'avgVisits',
    label: 'Avg Visits/Lead'
  }, {
    value: 'pipelineHealth',
    label: 'Pipeline Health'
  }];

  // Generate columns
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const monthsForColumns = [] as { month: number; name: string }[];
  for (let month = 1; month <= currentMonth; month++) {
    const monthName = new Date(currentYear, month - 1).toLocaleString('default', { month: 'short' });
    monthsForColumns.push({ month, name: monthName });
  }
  const columns = [{
    key: 'source',
    header: 'Lead Source',
    render: (value: string) => <div className="font-semibold text-slate-700 min-w-[120px] truncate">
          {value === 'TOTALS' ? (
            <span className="text-slate-900 font-extrabold uppercase tracking-wide">TOTALS</span>
          ) : (
            value
          )}
        </div>,
    align: 'left' as const,
    className: 'min-w-[140px] sticky left-0 bg-white'
  }, ...monthsForColumns.flatMap(monthInfo => [{
    key: `${monthInfo.name}_${currentYear}`,
    header: `${monthInfo.name} ${currentYear}`,
    render: (value: any, row: any) => {
      // If growth view, show YoY growth vs previous year in the current year column
      if (viewMode === 'growth') {
        const currentValue = value;
        const previousValue = row[`${monthInfo.name}_${currentYear - 1}`];
        let growth: number | null = null;
        let growthDisplay = '';
        if (currentValue && previousValue && typeof currentValue === 'object' && typeof previousValue === 'object') {
          const current = currentValue[selectedMetric];
          const previous = previousValue[selectedMetric];
          if (current !== undefined && previous !== undefined && previous !== 0) {
            growth = ((current - previous) / previous) * 100;
            if (Math.abs(growth) > 0.1) {
              growthDisplay = growth > 0 ? `+${growth.toFixed(1)}%` : `${growth.toFixed(1)}%`;
            } else {
              growthDisplay = '0.0%';
            }
          }
        }
        return (
          <div className="text-center text-xs font-semibold">
            {growthDisplay ? (
              <span className={cn(growth && growth > 0 ? 'text-green-600' : 'text-red-600')}>
                {growthDisplay}
              </span>
            ) : (
              <span className="text-slate-400">-</span>
            )}
          </div>
        );
      }
      // Values view: show the metric value
      return (
        <div className="text-center font-medium text-xs text-slate-700">
          {formatValue(value, selectedMetric)}
        </div>
      );
    },
    align: 'center' as const,
    className: 'min-w-[90px]'
  }, {
    key: `${monthInfo.name}_${currentYear - 1}`,
    header: `${monthInfo.name} ${currentYear - 1}`,
    render: (value: any, row: any) => {
      const currentValue = row[`${monthInfo.name}_${currentYear}`];
      const previousValue = value;
      if (viewMode === 'growth') {
        // Show only growth % (rendered in current-year column), keep baseline column minimal
        let growth: number | null = null;
        let growthDisplay = '';
        if (currentValue && previousValue && typeof currentValue === 'object' && typeof previousValue === 'object') {
          const current = currentValue[selectedMetric];
          const previous = previousValue[selectedMetric];
          if (current !== undefined && previous !== undefined && previous !== 0) {
            growth = ((current - previous) / previous) * 100;
            if (Math.abs(growth) > 0.1) {
              growthDisplay = growth > 0 ? `+${growth.toFixed(1)}%` : `${growth.toFixed(1)}%`;
            } else {
              growthDisplay = '0.0%';
            }
          }
        }
        return (
          <div className="text-center text-xs text-slate-400">—</div>
        );
      }
      // Values view: show the previous year's value only
      return (
        <div className="text-center">
          <div className="font-medium text-slate-700 text-xs">
            {formatValue(value, selectedMetric)}
          </div>
        </div>
      );
    },
    align: 'center' as const,
    className: 'min-w-[90px]'
  }])];
  return (
    <motion.div
      variants={tableVariants}
      initial="hidden"
      animate="visible"
      className="w-full"
    >
      <ModernTableWrapper
        title="Year-on-Year Source Performance"
        description={`Historical comparison across years by source - ${metricTabs.find(t => t.value === selectedMetric)?.label || selectedMetric}`}
        icon={<BarChart3 className="w-5 h-5 text-white" />}
        totalItems={processedData.length}
        showDisplayToggle={true}
        displayMode={viewMode}
        onDisplayModeChange={(mode) => setViewMode(mode as 'values' | 'growth')}
        showCollapseControls={false}
        tableRef={tableRef}
        headerControls={
          <div className="flex items-center gap-2">
            <select 
              className="border border-white/30 bg-white/10 text-white rounded-md px-2 py-1 text-xs"
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as MetricType)}
            >
              {metricTabs.map((tab) => (
                <option key={tab.value} value={tab.value} className="text-slate-900">
                  {tab.label}
                </option>
              ))}
            </select>
          </div>
        }
      >
        <div className="pt-0">
          {/* Table */}
          <motion.div 
            className="overflow-auto rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <ModernDataTable 
              data={processedData} 
              columns={columns} 
              loading={false} 
              stickyHeader={true} 
              showFooter={true} 
              footerData={totals} 
              maxHeight="400px" 
              className="rounded-lg" 
              headerGradient="from-slate-800 via-slate-900 to-slate-800" 
              onRowClick={(row) => {
                const filteredData = allData.filter(lead => lead.source === row.source);
                onDrillDown?.(`Source: ${row.source} - Year Analysis`, filteredData, 'year-source');
              }} 
            />
            <div className="border-t border-slate-200 p-4 bg-slate-50 rounded-b-xl mt-2">
              {(() => {
                const currentDate = new Date();
                const currentYear = currentDate.getFullYear();
                // Pick the most recent month name we generated above
                const recentMonthKey = monthsForColumns[monthsForColumns.length - 1]?.name;
                if (!recentMonthKey) return <div className="text-xs text-slate-500">No data available.</div>;
                const currField = `${recentMonthKey}_${currentYear}`;
                const prevField = `${recentMonthKey}_${currentYear - 1}`;
                const withCurr = processedData.filter(r => r[currField]?.[selectedMetric] > 0);
                if (!withCurr.length) return <div className="text-xs text-slate-500">No notable points for the latest month.</div>;
                const top = [...withCurr].sort((a,b) => (b[currField]?.[selectedMetric] || 0) - (a[currField]?.[selectedMetric] || 0))[0];
                if (!top) return <div className="text-xs text-slate-500">No data available.</div>;
                // Use rawTotals for calculations (has nested metrics)
                const growth = (top[currField] && top[prevField] && top[prevField][selectedMetric]) ? ((top[currField][selectedMetric] - top[prevField][selectedMetric]) / top[prevField][selectedMetric]) * 100 : 0;
                return (
                  <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
                    <li>Top source in {recentMonthKey} {currentYear}: <span className="font-semibold">{top.source}</span></li>
                    <li>{selectedMetric} YoY change: {growth > 0 ? '+' : ''}{growth.toFixed(1)}%</li>
                  </ul>
                );
              })()}
            </div>
          </motion.div>
        </div>
      </ModernTableWrapper>
    </motion.div>
  );
};