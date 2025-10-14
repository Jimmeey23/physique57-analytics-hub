import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ModernDataTable } from '@/components/ui/ModernDataTable';
import { Badge } from '@/components/ui/badge';
import { Calendar, BarChart3, TrendingUp, TrendingDown, Filter } from 'lucide-react';
import { LeadsData } from '@/types/leads';
import { formatNumber, formatCurrency } from '@/utils/formatters';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
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
    render: (value: string) => <div className="font-semibold text-slate-800 min-w-[120px] truncate">
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
        <div className="text-center font-medium text-xs">
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
          <div className="font-medium text-slate-600 text-xs">
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
      <Card className="w-full bg-gradient-to-br from-white via-red-50/30 to-red-100/40 backdrop-blur-sm border-red-200/50 shadow-xl shadow-red-100/20">
        <CardHeader className="pb-4">
          <motion.div 
            variants={headerVariants}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Year-on-Year Source Performance</h3>
                <p className="text-sm text-gray-600">Historical comparison across years by source</p>
              </div>
            </div>
            <Badge 
              variant="outline" 
              className="bg-gradient-to-r from-red-500/10 to-orange-500/10 text-red-700 border-red-300/50 backdrop-blur-sm"
            >
              <Calendar className="w-3 h-3 mr-1" />
              Historical Analysis
            </Badge>
          </motion.div>
          <motion.div 
            variants={headerVariants}
            className="flex items-center gap-2 text-xs text-slate-600 mt-2"
          >
            <Filter className="w-3 h-3" />
            <span>
              Showing {processedData.length} sources across {monthsForColumns.length} months
            </span>
          </motion.div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Metric Selector */}
          <motion.div 
            className="p-4 mb-4 border border-red-200/50 rounded-lg bg-gradient-to-r from-red-50/30 to-orange-50/30 backdrop-blur-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Tabs value={selectedMetric} onValueChange={(value) => setSelectedMetric(value as MetricType)}>
              <TabsList className="grid w-full grid-cols-4 lg:grid-cols-6 gap-1 h-auto p-1 bg-white/80 backdrop-blur-sm">
                {metricTabs.map((tab) => (
                  <TabsTrigger 
                    key={tab.value} 
                    value={tab.value} 
                    className="text-xs p-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-red-600 data-[state=active]:text-white transition-all duration-200"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <Badge 
                variant="outline" 
                className="bg-gradient-to-r from-red-500/10 to-orange-500/10 text-red-700 border-red-300/50"
              >
                <BarChart3 className="w-3 h-3 mr-1" />
                {metricTabs.find(t => t.value === selectedMetric)?.label}
              </Badge>

              <div className="ml-auto flex items-center gap-2">
                <span className="text-[11px] text-slate-600">View:</span>
                <div className="inline-flex rounded-md overflow-hidden border border-red-200/60 bg-white/70 backdrop-blur px-0.5">
                  <button
                    className={cn(
                      'px-2 py-1 text-[11px] font-medium transition-colors',
                      viewMode === 'values' ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' : 'text-slate-700'
                    )}
                    onClick={() => setViewMode('values')}
                  >
                    Values
                  </button>
                  <button
                    className={cn(
                      'px-2 py-1 text-[11px] font-medium transition-colors',
                      viewMode === 'growth' ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' : 'text-slate-700'
                    )}
                    onClick={() => setViewMode('growth')}
                  >
                    % Growth
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Table */}
          <motion.div 
            className="max-h-[500px] overflow-auto rounded-lg border border-red-200/50"
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
              headerGradient="from-slate-800 to-indigo-900" 
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
                const top = [...withCurr].sort((a,b) => (b[currField][selectedMetric] - a[currField][selectedMetric]))[0];
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
        </CardContent>
      </Card>
    </motion.div>
  );
};