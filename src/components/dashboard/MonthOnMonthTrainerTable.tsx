
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ModernTableWrapper } from './ModernTableWrapper';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Calendar, ChevronDown, ChevronRight, Info, BarChart3 } from 'lucide-react';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { TrainerMetricType } from '@/types/dashboard';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import { TrainerMetricTabs } from './TrainerMetricTabs';
import CopyTableButton from '@/components/ui/CopyTableButton';
import { useMetricsTablesRegistry } from '@/contexts/MetricsTablesRegistryContext';
import { ProcessedTrainerData, getMetricValue } from './TrainerDataProcessor';
import { TrainerNameCell } from '@/components/ui/TrainerAvatar';

interface MonthOnMonthTrainerTableProps {
  data: ProcessedTrainerData[];
  defaultMetric?: TrainerMetricType;
  onRowClick?: (trainer: string, data: any) => void;
}

export const MonthOnMonthTrainerTable = ({ 
  data, 
  defaultMetric = 'totalSessions',
  onRowClick 
}: MonthOnMonthTrainerTableProps) => {
  const [selectedMetric, setSelectedMetric] = useState<TrainerMetricType>(defaultMetric);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const processedData = useMemo(() => {
    const trainerGroups: Record<string, Record<string, ProcessedTrainerData>> = {};
    const monthSet = new Set<string>();

    // Group data by trainer
    data.forEach(record => {
      if (!trainerGroups[record.trainerName]) {
        trainerGroups[record.trainerName] = {};
      }
      trainerGroups[record.trainerName][record.monthYear] = record;
      monthSet.add(record.monthYear);
    });

    // Sort months chronologically (most recent first) - each month as individual column
    const months = Array.from(monthSet).sort((a, b) => {
      const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const toDate = (s: string) => {
        if (s.includes('/')) { const [m,y] = s.split('/'); return new Date(parseInt(y), parseInt(m)-1, 1); }
        const p = s.replace('-', ' ').split(' '); const mi = names.indexOf(p[0]); const yi = parseInt(p[1]); return new Date(yi, mi, 1);
      };
      return toDate(b).getTime() - toDate(a).getTime();
    });

    return { trainerGroups, months };
  }, [data]);

  const formatValue = (value: number, metric: TrainerMetricType) => {
    switch (metric) {
      case 'totalPaid':
      case 'cycleRevenue':
      case 'barreRevenue':
        return formatCurrency(value);
      case 'retentionRate':
      case 'conversionRate':
        return `${value.toFixed(1)}%`;
      case 'classAverageExclEmpty':
      case 'classAverageInclEmpty':
        return value.toFixed(1);
      default:
        return formatNumber(value);
    }
  };

  const getChangePercentage = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const toggleRowExpansion = (trainer: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(trainer)) {
      newExpanded.delete(trainer);
    } else {
      newExpanded.add(trainer);
    }
    setExpandedRows(newExpanded);
  };

  const handleRowClick = (trainer: string) => {
    const trainerData = processedData.trainerGroups[trainer];
    const months = processedData.months;
    const recs = Object.values(trainerData || {}) as any[];
    const totalSessions = recs.reduce((s, r) => s + (r.totalSessions || 0), 0);
    const totalRevenue = recs.reduce((s, r) => s + (r.totalPaid || 0), 0);
    const totalCustomers = recs.reduce((s, r) => s + (r.totalCustomers || 0), 0);
    const cycleSessions = recs.reduce((s, r) => s + (r.cycleSessions || 0), 0);
    const barreSessions = recs.reduce((s, r) => s + (r.barreSessions || 0), 0);
    const strengthSessions = recs.reduce((s, r) => s + (r.strengthSessions || 0), 0);
  const lastRec: any = (trainerData as any)[months[0]] || {};
  const prevRec: any = (trainerData as any)[months[1]] || {};
  const previousSessions = (prevRec as any).totalSessions || 0;
  const previousRevenue = (prevRec as any).totalPaid || 0;
  const previousCustomers = (prevRec as any).totalCustomers || 0;
  const location = (lastRec as any).location || (recs[0] as any)?.location || '';

    if (onRowClick) {
      onRowClick(trainer, {
        name: trainer,
        location,
        // Monthly mapping and order for trend charts
        monthlyData: trainerData,
        months,
        // Aggregates used by the drill-down modal
        totalSessions,
        totalRevenue,
        totalCustomers,
        previousSessions,
        previousRevenue,
        previousCustomers,
        cycleSessions,
        barreSessions,
        strengthSessions
      });
    }
  };

  // Calculate totals for each month (for class averages, compute weighted average by sessions)
  const monthlyTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    const isClassAvg = selectedMetric === 'classAverageExclEmpty' || selectedMetric === 'classAverageInclEmpty';
    const isRate = selectedMetric === 'conversionRate' || selectedMetric === 'retentionRate';
    processedData.months.forEach(month => {
      if (!isClassAvg && !isRate) {
        let sum = 0;
        Object.values(processedData.trainerGroups).forEach(trainerData => {
          if (trainerData[month]) sum += getMetricValue(trainerData[month], selectedMetric);
        });
        totals[month] = sum;
      } else if (isClassAvg) {
        let numerator = 0; // attendees
        let denom = 0; // sessions (non-empty for exclEmpty)
        Object.values(processedData.trainerGroups).forEach(trainerData => {
          const rec = trainerData[month];
          if (!rec) return;
          const sessions = selectedMetric === 'classAverageExclEmpty' ? (rec.nonEmptySessions || 0) : (rec.totalSessions || 0);
          const customers = rec.totalCustomers || 0;
          numerator += customers;
          denom += sessions;
        });
        totals[month] = denom > 0 ? numerator / denom : 0;
      } else if (isRate) {
        // Weighted average of rates by new members for the month
        let numerator = 0; // converted or retained members
        let denom = 0; // new members
        Object.values(processedData.trainerGroups).forEach(trainerData => {
          const rec: any = trainerData[month];
          if (!rec) return;
          if (selectedMetric === 'conversionRate') {
            numerator += (rec.convertedMembers || 0);
            denom += (rec.newMembers || 0);
          } else if (selectedMetric === 'retentionRate') {
            numerator += (rec.retainedMembers || 0);
            denom += (rec.newMembers || 0);
          }
        });
        totals[month] = denom > 0 ? (numerator / denom) * 100 : 0;
      }
    });
    return totals;
  }, [processedData, selectedMetric]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const allValues = Object.values(monthlyTotals);
    const isClassAvg = selectedMetric === 'classAverageExclEmpty' || selectedMetric === 'classAverageInclEmpty';
    const isRate = selectedMetric === 'conversionRate' || selectedMetric === 'retentionRate';
    let total = 0;
    if (!isClassAvg && !isRate) {
      total = allValues.reduce((sum, val) => sum + val, 0);
    } else if (isClassAvg) {
      // Compute overall weighted average across months
      let numerator = 0;
      let denom = 0;
      processedData.months.forEach(month => {
        Object.values(processedData.trainerGroups).forEach(trainerData => {
          const rec = (trainerData as any)[month];
          if (!rec) return;
          const sessions = selectedMetric === 'classAverageExclEmpty' ? (rec.nonEmptySessions || 0) : (rec.totalSessions || 0);
          const customers = rec.totalCustomers || 0;
          numerator += customers;
          denom += sessions;
        });
      });
      total = denom > 0 ? (numerator / denom) : 0;
    } else if (isRate) {
      // Weighted average across all months by new members
      let numerator = 0;
      let denom = 0;
      processedData.months.forEach(month => {
        Object.values(processedData.trainerGroups).forEach(trainerData => {
          const rec: any = (trainerData as any)[month];
          if (!rec) return;
          if (selectedMetric === 'conversionRate') {
            numerator += (rec.convertedMembers || 0);
            denom += (rec.newMembers || 0);
          } else if (selectedMetric === 'retentionRate') {
            numerator += (rec.retainedMembers || 0);
            denom += (rec.newMembers || 0);
          }
        });
      });
      total = denom > 0 ? (numerator / denom) * 100 : 0;
    }
    const average = allValues.length > 0 && !isClassAvg && !isRate ? total / allValues.length : total; // for class avg & rates, show the weighted average as "total"
    const growth = allValues.length >= 2 ? getChangePercentage(allValues[0], allValues[1]) : 0;
    return { total, average, growth };
  }, [monthlyTotals, processedData, selectedMetric]);

  if (!data.length) {
    return (
      <ModernTableWrapper
        title="Month-on-Month Trainer Analysis"
        description="No trainer data available for month-on-month comparison"
        icon={<BarChart3 className="w-5 h-5" />}
        totalItems={0}
      >
        <div className="p-8 text-center text-slate-600">
          No trainer data available for analysis
        </div>
      </ModernTableWrapper>
    );
  }

  const containerRef = useRef<HTMLDivElement>(null);
  const registry = useMetricsTablesRegistry();
  const tableId = 'Month-on-Month Trainer Analysis';
  useEffect(() => {
    if (!registry) return;
    const el = containerRef.current;
    if (!el) return;
    const getTextContent = () => {
      const table = el.querySelector('table') || el;
      let text = `${tableId}\n`;
      const headerCells = table.querySelectorAll('thead th');
      const headers: string[] = [];
      headerCells.forEach(cell => { const t = cell.textContent?.trim(); if (t) headers.push(t); });
      if (headers.length) {
        text += headers.join('\t') + '\n';
        text += headers.map(() => '---').join('\t') + '\n';
      }
      const rows = table.querySelectorAll('tbody tr');
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const rowData: string[] = [];
        cells.forEach(c => rowData.push((c.textContent || '').trim()));
        if (rowData.length) text += rowData.join('\t') + '\n';
      });
      return text.trim();
    };
    registry.register({ id: tableId, getTextContent });
    return () => registry.unregister(tableId);
  }, [registry]);

  // Generate "All Tabs" content across all trainer metrics, regardless of the active tab
  const generateAllTabsContent = useMemo(() => {
    const allMetrics: TrainerMetricType[] = [
      'totalSessions',
      'totalCustomers',
      'totalPaid',
      'classAverageExclEmpty',
      'emptySessions',
      'conversionRate',
      'retentionRate',
      'newMembers'
    ];

    const metricLabel = (m: TrainerMetricType) => {
      switch (m) {
        case 'totalSessions': return 'Total Sessions';
        case 'totalCustomers': return 'Total Members';
        case 'totalPaid': return 'Total Revenue';
        case 'classAverageExclEmpty': return 'Class Average';
        case 'emptySessions': return 'Empty Sessions';
        case 'conversionRate': return 'Conversion Rate';
        case 'retentionRate': return 'Retention Rate';
        case 'newMembers': return 'New Members';
        default: return m;
      }
    };

    const lines: string[] = [];
    lines.push(`${tableId} — All Metrics`);
    lines.push(`Trainers: ${Object.keys(processedData.trainerGroups).length} | Months: ${processedData.months.length}`);

    allMetrics.forEach(metric => {
      lines.push('');
      lines.push(`=== ${metricLabel(metric)} ===`);
      // Header row
      const headers = ['Trainer', ...processedData.months, 'MoM Change', metric === 'classAverageExclEmpty' || metric === 'classAverageInclEmpty' || metric === 'conversionRate' || metric === 'retentionRate' ? 'Weighted Avg' : 'Total'];
      lines.push(headers.join('\t'));

      // Totals row (for class avg / rates use weighted average)
      const isClassAvg = metric === 'classAverageExclEmpty' || metric === 'classAverageInclEmpty';
      const isRate = metric === 'conversionRate' || metric === 'retentionRate';

      const monthlyTotals = processedData.months.map(month => {
        if (!isClassAvg && !isRate) {
          let sum = 0;
          Object.values(processedData.trainerGroups).forEach(trainerData => {
            if ((trainerData as any)[month]) sum += getMetricValue((trainerData as any)[month], metric);
          });
          return sum;
        } else if (isClassAvg) {
          let num = 0; let den = 0;
          Object.values(processedData.trainerGroups).forEach(trainerData => {
            const rec: any = (trainerData as any)[month];
            if (!rec) return;
            const sessions = metric === 'classAverageExclEmpty' ? (rec.nonEmptySessions || 0) : (rec.totalSessions || 0);
            const customers = rec.totalCustomers || 0;
            num += customers;
            den += sessions;
          });
          return den > 0 ? (num / den) : 0;
        } else { // isRate
          let num = 0; let den = 0;
          Object.values(processedData.trainerGroups).forEach(trainerData => {
            const rec: any = (trainerData as any)[month];
            if (!rec) return;
            if (metric === 'conversionRate') { num += (rec.convertedMembers || 0); den += (rec.newMembers || 0); }
            else { num += (rec.retainedMembers || 0); den += (rec.newMembers || 0); }
          });
          return den > 0 ? (num / den) * 100 : 0;
        }
      });
      const totalsAllValues = monthlyTotals;
      const totalsGrowth = totalsAllValues.length >= 2 ? getChangePercentage(totalsAllValues[0], totalsAllValues[1]) : 0;
      const totalsOverall = (() => {
        if (!isClassAvg && !isRate) return totalsAllValues.reduce((s, v) => s + v, 0);
        // weighted avg across all months
        if (isClassAvg) {
          let num = 0; let den = 0;
          processedData.months.forEach(month => {
            Object.values(processedData.trainerGroups).forEach(trainerData => {
              const rec: any = (trainerData as any)[month];
              if (!rec) return;
              const sessions = metric === 'classAverageExclEmpty' ? (rec.nonEmptySessions || 0) : (rec.totalSessions || 0);
              const customers = rec.totalCustomers || 0;
              num += customers; den += sessions;
            });
          });
          return den > 0 ? (num / den) : 0;
        }
        // isRate
        let num = 0; let den = 0;
        processedData.months.forEach(month => {
          Object.values(processedData.trainerGroups).forEach(trainerData => {
            const rec: any = (trainerData as any)[month];
            if (!rec) return;
            if (metric === 'conversionRate') { num += (rec.convertedMembers || 0); den += (rec.newMembers || 0); }
            else { num += (rec.retainedMembers || 0); den += (rec.newMembers || 0); }
          });
        });
        return den > 0 ? (num / den) * 100 : 0;
      })();

      const totalsRow = [
        'TOTAL',
        ...monthlyTotals.map(v => formatValue(v, metric)),
        `${totalsGrowth >= 0 ? '' : ''}${Math.abs(totalsGrowth).toFixed(1)}%`,
        formatValue(totalsOverall as number, metric)
      ];
      lines.push(totalsRow.join('\t'));

      // Trainer rows
      Object.entries(processedData.trainerGroups).forEach(([trainer, trainerData]) => {
        const values = processedData.months.map(month => (trainerData as any)[month] ? getMetricValue((trainerData as any)[month], metric) : 0);
        const growth = values.length >= 2 ? getChangePercentage(values[0], values[1]) : 0;
        const total = (() => {
          if (!isClassAvg && !isRate) return values.reduce((s, v) => s + v, 0);
          if (isClassAvg) {
            let num = 0; let den = 0;
            processedData.months.forEach(month => {
              const rec: any = (trainerData as any)[month];
              if (!rec) return;
              const sessions = metric === 'classAverageExclEmpty' ? (rec.nonEmptySessions || 0) : (rec.totalSessions || 0);
              const customers = rec.totalCustomers || 0;
              num += customers; den += sessions;
            });
            return den > 0 ? (num / den) : 0;
          }
          // isRate
          let num = 0; let den = 0;
          processedData.months.forEach(month => {
            const rec: any = (trainerData as any)[month];
            if (!rec) return;
            if (metric === 'conversionRate') { num += (rec.convertedMembers || 0); den += (rec.newMembers || 0); }
            else { num += (rec.retainedMembers || 0); den += (rec.newMembers || 0); }
          });
          return den > 0 ? (num / den) * 100 : 0;
        })();

        const row = [
          trainer,
          ...values.map(v => formatValue(v, metric)),
          `${growth >= 0 ? '' : ''}${Math.abs(growth).toFixed(1)}%`,
          formatValue(total as number, metric)
        ];
        lines.push(row.join('\t'));
      });
    });

    return lines.join('\n');
  }, [processedData]);

  return (
    <ModernTableWrapper
      title="Month-on-Month Trainer Analysis"
      description={`Individual month performance for ${Object.keys(processedData.trainerGroups).length} trainers • ${processedData.months.length} months tracked • Sorted by most recent`}
      icon={<BarChart3 className="w-5 h-5" />}
      totalItems={Object.keys(processedData.trainerGroups).length}
    >
      <div ref={containerRef} className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Metrics Tabs and Controls Header */}
        <div className="pb-4 bg-white rounded-t-lg p-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                  Individual Monthly Columns
                </Badge>
                <CopyTableButton
                  tableRef={containerRef as any}
                  tableName={tableId}
                  size="sm"
                  onCopyAllTabs={async () => generateAllTabsContent}
                />
              </div>
            </div>
            <TrainerMetricTabs value={selectedMetric} onValueChange={setSelectedMetric} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="sticky top-0 z-20 bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600">
              <TableRow className="border-none" style={{ height: '40px' }}>
                <TableHead className="font-bold text-white sticky left-0 bg-purple-600/95 backdrop-blur-sm z-30 min-w-[240px] h-10">
                  Trainer
                </TableHead>
                {processedData.months.map((month) => (
                  <TableHead key={month} className="text-center font-bold text-white min-w-[140px]">
                    <div className="flex flex-col">
                      <span className="text-sm">{month.split('-')[0] || month.split('/')[0]}</span>
                      <span className="text-slate-300 text-xs">{month.split('-')[1] || month.split('/')[1]}</span>
                    </div>
                  </TableHead>
                ))}
                <TableHead className="text-center font-bold text-white min-w-[120px]">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="cursor-help">MoM Change</TooltipTrigger>
                      <TooltipContent>Month-over-month change for the selected metric</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
                <TableHead className="text-center font-bold text-white min-w-[140px]">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="cursor-help">Total</TooltipTrigger>
                      <TooltipContent>
                        {selectedMetric === 'classAverageExclEmpty' || selectedMetric === 'classAverageInclEmpty'
                          ? 'Weighted average across visible months (by sessions)'
                          : selectedMetric === 'conversionRate' || selectedMetric === 'retentionRate'
                            ? 'Weighted average across visible months (by new members)'
                            : 'Sum across all visible months for each trainer'}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
                <TableHead className="text-right font-bold text-white min-w-[60px]">
                  <CopyTableButton
                    tableRef={containerRef as any}
                    tableName={tableId}
                    size="sm"
                    onCopyAllTabs={async () => generateAllTabsContent}
                  />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Totals Row */}
              <TableRow className="bg-gradient-to-r from-slate-100 to-slate-200 font-bold">
                <TableCell className="font-bold text-slate-900 sticky left-0 bg-transparent z-10">
                  TOTAL
                </TableCell>
                {processedData.months.map((month) => (
                  <TableCell key={`total-${month}`} className="text-center font-bold text-slate-900">
                    {formatValue(monthlyTotals[month] || 0, selectedMetric)}
                  </TableCell>
                ))}
                <TableCell className="text-center">
                  <Badge className={cn(
                    "flex items-center gap-1 text-xs px-2 py-1",
                    summaryStats.growth >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  )}>
                    {summaryStats.growth >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {Math.abs(summaryStats.growth).toFixed(1)}%
                  </Badge>
                </TableCell>
                <TableCell className="text-center font-bold text-slate-900">
                  {formatValue(summaryStats.total, selectedMetric)}
                </TableCell>
              </TableRow>

              {/* Trainer Rows */}
              {Object.entries(processedData.trainerGroups).map(([trainer, trainerData]) => {
                const isExpanded = expandedRows.has(trainer);
                const values = processedData.months.map(month => 
                  trainerData[month] ? getMetricValue(trainerData[month], selectedMetric) : 0
                );
                
                const trainerTotal = (() => {
                  if (selectedMetric === 'classAverageExclEmpty' || selectedMetric === 'classAverageInclEmpty') {
                    // Weighted average across months per trainer
                    let num = 0; let den = 0;
                    processedData.months.forEach((month, i) => {
                      const rec: any = (trainerData as any)[month];
                      if (!rec) return;
                      const sessions = selectedMetric === 'classAverageExclEmpty' ? (rec.nonEmptySessions || 0) : (rec.totalSessions || 0);
                      const customers = rec.totalCustomers || 0;
                      num += customers;
                      den += sessions;
                    });
                    return den > 0 ? (num / den) : 0;
                  } else if (selectedMetric === 'conversionRate' || selectedMetric === 'retentionRate') {
                    // Weighted average of rates by new members across months for this trainer
                    let num = 0; let den = 0;
                    processedData.months.forEach((month) => {
                      const rec: any = (trainerData as any)[month];
                      if (!rec) return;
                      if (selectedMetric === 'conversionRate') {
                        num += (rec.convertedMembers || 0);
                        den += (rec.newMembers || 0);
                      } else {
                        num += (rec.retainedMembers || 0);
                        den += (rec.newMembers || 0);
                      }
                    });
                    return den > 0 ? (num / den) * 100 : 0;
                  }
                  return values.reduce((sum, val) => sum + val, 0);
                })();
                const growth = values.length >= 2 ? getChangePercentage(values[0], values[1]) : 0;
                
                return (
                  <React.Fragment key={trainer}>
                    <TableRow 
                      className="hover:bg-slate-50/50 transition-colors border-b cursor-pointer"
                      onClick={() => handleRowClick(trainer)}
                      style={{ height: '40px' }}
                    >
                      <TableCell className="font-medium text-slate-800 sticky left-0 bg-white z-10 border-r min-w-[240px]" style={{ height: '40px' }}>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRowExpansion(trainer);
                            }}
                            className="p-1 h-6 w-6"
                          >
                            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                          </Button>
                          <TrainerNameCell name={trainer} className="text-nowrap" />
                        </div>
                      </TableCell>
                      {values.map((value, index) => (
                        <TableCell 
                          key={`${trainer}-${index}`} 
                          className="text-center text-sm font-medium text-slate-800 hover:bg-slate-50 cursor-pointer" 
                          style={{ height: '40px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!onRowClick) return;
                            const month = processedData.months[index];
                            const trainerMonthMap = (processedData.trainerGroups as any)[trainer] || {};
                            const rec = trainerMonthMap[month] || {};
                            const payload = {
                              ...rec,
                              trainerName: trainer,
                              monthYear: month,
                              location: rec.location || (values.length ? (trainerMonthMap[processedData.months[0]]?.location || '') : ''),
                              type: 'trainer-month-cell'
                            };
                            onRowClick(trainer, payload);
                          }}
                        >
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger className="cursor-help">{formatValue(value, selectedMetric)}</TooltipTrigger>
                              <TooltipContent>
                                {processedData.months[index]} • {selectedMetric}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      ))}
                      <TableCell className="text-center">
                        <Badge
                          className={cn(
                            "flex items-center gap-1 w-fit mx-auto",
                            growth >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          )}
                        >
                          {growth >= 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {Math.abs(growth).toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-bold text-slate-700">
                        {formatValue(trainerTotal, selectedMetric)}
                      </TableCell>
                    </TableRow>
                    
                     {/* Expanded Row Details */}
                     {isExpanded && (
                       <TableRow className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 animate-fade-in">
                         <TableCell colSpan={processedData.months.length + 3} className="p-6">
                           <div className="space-y-6">
                             {/* Key Metrics Grid */}
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                               <div className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                                 <p className="text-slate-600 text-xs font-medium">Average per Month</p>
                                 <p className="font-bold text-slate-800 text-lg">
                                   {formatValue(trainerTotal / processedData.months.length, selectedMetric)}
                                 </p>
                               </div>
                               <div className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                                 <p className="text-slate-600 text-xs font-medium">Best Month</p>
                                 <p className="font-bold text-green-600 text-lg">
                                   {formatValue(Math.max(...values), selectedMetric)}
                                 </p>
                               </div>
                               <div className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                                 <p className="text-slate-600 text-xs font-medium">Consistency Score</p>
                                 <p className="font-bold text-blue-600 text-lg">
                                   {values.length > 1 ? 
                                     (100 - (values.reduce((acc, val, i) => {
                                       if (i === 0) return acc;
                                       const change = Math.abs((val - values[i-1]) / Math.max(values[i-1], 1)) * 100;
                                       return acc + change;
                                     }, 0) / (values.length - 1))).toFixed(0) 
                                     : '100'
                                   }%
                                 </p>
                               </div>
                               <div className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                                 <p className="text-slate-600 text-xs font-medium">Growth Trend</p>
                                 <p className={cn(
                                   "font-bold text-lg",
                                   growth >= 0 ? "text-green-600" : "text-red-600"
                                 )}>
                                   {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
                                 </p>
                               </div>
                             </div>

                             {/* Enhanced Metrics */}
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                               <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border">
                                 <h4 className="font-semibold text-blue-800 mb-3">Performance Metrics</h4>
                                 <div className="space-y-2 text-sm">
                                   <div className="flex justify-between">
                                     <span className="text-blue-600">Total:</span>
                                     <span className="font-bold">{formatValue(trainerTotal, selectedMetric)}</span>
                                   </div>
                                   <div className="flex justify-between">
                                     <span className="text-blue-600">Average:</span>
                                     <span className="font-bold">{formatValue(trainerTotal / processedData.months.length, selectedMetric)}</span>
                                   </div>
                                   <div className="flex justify-between">
                                     <span className="text-blue-600">Best:</span>
                                     <span className="font-bold">{formatValue(Math.max(...values), selectedMetric)}</span>
                                   </div>
                                 </div>
                               </div>

                               <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border">
                                 <h4 className="font-semibold text-green-800 mb-3">Class Formats</h4>
                                 <div className="space-y-2 text-sm">
                                   {(() => {
                                     const recsLocal = Object.values(trainerData || {}) as any[];
                                     const cyc = recsLocal.reduce((s, r) => s + (r.cycleSessions || 0), 0) as number;
                                     const bar = recsLocal.reduce((s, r) => s + (r.barreSessions || 0), 0) as number;
                                     const str = recsLocal.reduce((s, r) => s + (r.strengthSessions || 0), 0) as number;
                                     return (
                                       <>
                                         <div className="flex justify-between">
                                           <span className="text-green-600">Cycle Sessions:</span>
                                           <span className="font-bold">{formatNumber(cyc)}</span>
                                         </div>
                                         <div className="flex justify-between">
                                           <span className="text-green-600">Barre Sessions:</span>
                                           <span className="font-bold">{formatNumber(bar)}</span>
                                         </div>
                                         <div className="flex justify-between">
                                           <span className="text-green-600">Strength Sessions:</span>
                                           <span className="font-bold">{formatNumber(str)}</span>
                                         </div>
                                       </>
                                     );
                                   })()}
                                 </div>
                               </div>

                               <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border">
                                 <h4 className="font-semibold text-purple-800 mb-3">Member Engagement</h4>
                                 <div className="space-y-2 text-sm">
                                   <div className="flex justify-between">
                                     <span className="text-purple-600">Retention:</span>
                                     <span className="font-bold">{
                                       (() => {
                                         const recs = Object.values(trainerData as any) as any[];
                                         const totalNew = recs.reduce((s, r) => s + (r.newMembers || 0), 0);
                                         const totalRetained = recs.reduce((s, r) => s + (r.retainedMembers || 0), 0);
                                         const rate = totalNew > 0 ? (totalRetained / totalNew) * 100 : 0;
                                         return `${rate.toFixed(1)}%`;
                                       })()
                                     }</span>
                                   </div>
                                   <div className="flex justify-between">
                                     <span className="text-purple-600">Conversion:</span>
                                     <span className="font-bold">{
                                       (() => {
                                         const recs = Object.values(trainerData as any) as any[];
                                         const totalNew = recs.reduce((s, r) => s + (r.newMembers || 0), 0);
                                         const totalConverted = recs.reduce((s, r) => s + (r.convertedMembers || 0), 0);
                                         const rate = totalNew > 0 ? (totalConverted / totalNew) * 100 : 0;
                                         return `${rate.toFixed(1)}%`;
                                       })()
                                     }</span>
                                   </div>
                                   <div className="flex justify-between">
                                     <span className="text-purple-600">Revenue/Session:</span>
                                     <span className="font-bold">{
                                       (() => {
                                         const recs = Object.values(trainerData as any) as any[];
                                         const totRev = recs.reduce((s, r) => s + (r.totalPaid || 0), 0);
                                         const totSess = recs.reduce((s, r) => s + (r.totalSessions || 0), 0);
                                         return formatCurrency(totSess > 0 ? totRev / totSess : 0);
                                       })()
                                     }</span>
                                   </div>
                                 </div>
                               </div>
                             </div>
                           </div>
                         </TableCell>
                       </TableRow>
                     )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Footer Summary Section */}
        <div className="bg-gradient-to-r from-slate-50 to-white border-t p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              Monthly Performance Summary
            </h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Object.keys(processedData.trainerGroups).length}
              </div>
              <div className="text-sm text-slate-600">Active Trainers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">
                {formatValue(summaryStats.total, selectedMetric)}
              </div>
              <div className="text-sm text-slate-600">Total {selectedMetric}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatValue(summaryStats.average, selectedMetric)}
              </div>
              <div className="text-sm text-slate-600">Monthly Average</div>
            </div>
            <div className="text-center">
              <div className={cn(
                "text-2xl font-bold",
                summaryStats.growth >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {summaryStats.growth >= 0 ? '+' : ''}{summaryStats.growth.toFixed(1)}%
              </div>
              <div className="text-sm text-slate-600">Recent Growth</div>
            </div>
          </div>
        </div>
      </div>
    </ModernTableWrapper>
  );
};
