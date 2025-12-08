import React, { useMemo, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart3, Calendar, ChevronDown, ChevronUp, Eye, Filter, Minus, TrendingDown, TrendingUp, ShrinkIcon, ExpandIcon, Percent, Star, Users, Target } from 'lucide-react';
import { LeadsData } from '@/types/leads';
import { cn } from '@/lib/utils';
import { ModernTableWrapper, ModernMetricTabs } from './ModernTableWrapper';
import { PersistentTableFooter } from '@/components/dashboard/PersistentTableFooter';
import { formatNumber, formatCurrency, formatPercentage } from '@/utils/formatters';
import { generateStandardMonthRange } from '@/utils/dateUtils';
import { useMetricsTablesRegistry } from '@/contexts/MetricsTablesRegistryContext';

type GroupKey = 'source' | 'stage' | 'center' | 'channel' | 'associate';
type MetricType = 'totalLeads' | 'trialsCompleted' | 'trialsScheduled' | 'convertedLeads' | 'ltv' | 'avgVisits';

interface FunnelMonthOnMonthTableProps {
  data: LeadsData[];
  onDrillDown?: (title: string, data: LeadsData[], type: string) => void;
}

const FunnelMonthOnMonthTable: React.FC<FunnelMonthOnMonthTableProps> = ({ data, onDrillDown }) => {
  const [groupKey, setGroupKey] = useState<GroupKey>('source');
  const [metric, setMetric] = useState<MetricType>('totalLeads');
  const [viewMode, setViewMode] = useState<'values' | 'growth'>('values');
  const [sortBy, setSortBy] = useState<'group' | 'total'>('total');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [sortKey, setSortKey] = useState<string>('total');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const tableRef = useRef<HTMLTableElement>(null);
  const registry = useMetricsTablesRegistry();

  // Get context information for enhanced table copying
  const copyContext = useTableCopyContext();

  const handleSort = (column: 'group' | 'total') => {
    if (sortBy === column) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const formatPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;
  const growthIcon = (n: number) => (n > 0 ? <TrendingUp className="w-3 h-3 text-green-600" /> : n < 0 ? <TrendingDown className="w-3 h-3 text-red-600" /> : <Minus className="w-3 h-3 text-slate-400" />);

  const monthlyData = useMemo(() => {
    return generateStandardMonthRange();
  }, []);

  const months = monthlyData.map(m => ({ key: m.key, display: m.display }));
  const previousMonthKey = monthlyData.length > 1 ? monthlyData[1].key : null;

  // Register table for metrics
  React.useEffect(() => {
    if (tableRef.current) {
      registry.registerTable('funnel-month-on-month-analysis', tableRef.current);
    }
    return () => registry.unregisterTable('funnel-month-on-month-analysis');
  }, [registry]);

  const processedData = useMemo(() => {
    type Bucket = { totalLeads: number; trialsCompleted: number; trialsScheduled: number; convertedLeads: number; totalLTV: number; totalVisits: number };
    const emptyBucket = (): Bucket => ({ totalLeads: 0, trialsCompleted: 0, trialsScheduled: 0, convertedLeads: 0, totalLTV: 0, totalVisits: 0 });
    const map = new Map<string, { group: string; months: Map<string, Bucket>; totals: Bucket }>();

    const inc = (b: Bucket, l: LeadsData) => {
      b.totalLeads += 1;
      if (l.trialStatus === 'Trial Completed' || l.stage === 'Trial Completed') b.trialsCompleted += 1;
      const ts = (l.trialStatus || '').toLowerCase();
      const st = (l.stage || '').toLowerCase();
      if ((ts.includes('trial') && !ts.includes('completed')) || (st.includes('trial') && !st.includes('completed'))) b.trialsScheduled += 1;
      if (l.conversionStatus === 'Converted') b.convertedLeads += 1;
      b.totalLTV += l.ltv || 0;
      b.totalVisits += l.visits || 0;
    };

    data.forEach(l => {
      if (!l.createdAt) return;
      const d = new Date(l.createdAt);
      if (isNaN(d.getTime())) return;
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const gVal = ((l as any)[groupKey] as string) || 'Unknown';
      if (!map.has(gVal)) map.set(gVal, { group: gVal, months: new Map(), totals: emptyBucket() });
      const entry = map.get(gVal)!;
      if (!entry.months.has(mKey)) entry.months.set(mKey, emptyBucket());
      inc(entry.months.get(mKey)!, l);
      inc(entry.totals, l);
    });

    const metricVal = (b: Bucket) => {
      switch (metric) {
        case 'totalLeads': return b.totalLeads;
        case 'trialsCompleted': return b.trialsCompleted;
        case 'trialsScheduled': return b.trialsScheduled;
        case 'convertedLeads': return b.convertedLeads;
        case 'ltv': return b.totalLeads > 0 ? b.totalLTV / b.totalLeads : 0;
        case 'avgVisits': return b.totalLeads > 0 ? b.totalVisits / b.totalLeads : 0;
      }
    };

    const rows = Array.from(map.values()).map(r => {
      const totalVal = metricVal(r.totals) as number;
      return { group: r.group, months: r.months, totalVal };
    });

    return rows.sort((a, b) => {
      if (sortBy === 'group') return sortOrder === 'asc' ? a.group.localeCompare(b.group) : b.group.localeCompare(a.group);
      if (sortBy === 'total') return sortOrder === 'asc' ? (a.totalVal as number) - (b.totalVal as number) : (b.totalVal as number) - (a.totalVal as number);
    });
  }, [data, groupKey, metric, months, sortBy, sortOrder]);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-lg border">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Group By</label>
          <select 
            value={groupKey} 
            onChange={(e) => setGroupKey(e.target.value as GroupKey)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="source">Lead Source</option>
            <option value="stage">Stage</option>
            <option value="center">Center</option>
            <option value="channel">Channel</option>
            <option value="associate">Associate</option>
          </select>
        </div>
        
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Metric</label>
          <select 
            value={metric} 
            onChange={(e) => setMetric(e.target.value as MetricType)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="totalLeads">Total Leads</option>
            <option value="trialsCompleted">Trials Completed</option>
            <option value="trialsScheduled">Trials Scheduled</option>
            <option value="convertedLeads">Converted Leads</option>
            <option value="ltv">Total LTV</option>
            <option value="avgVisits">Average Visits</option>
          </select>
        </div>
        
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">View Mode</label>
          <select 
            value={viewMode} 
            onChange={(e) => setViewMode(e.target.value as 'values' | 'growth')}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="values">Values</option>
            <option value="growth">Growth %</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <ModernTableWrapper
        title="Funnel Month-on-Month Analysis"
        description={`${groupKey} performance analysis across monthly timeframes`}
        icon={<BarChart3 className="w-6 h-6 text-white" />}
        totalItems={processedData.length}
        showDisplayToggle={true}
        displayMode={viewMode}
        onDisplayModeChange={setViewMode}
        className="animate-in slide-in-from-bottom-8 fade-in duration-1000"
        showCopyButton={true}
      >
        <div className="overflow-x-auto" data-table="funnel-month-on-month-analysis">
          <table ref={tableRef} className="min-w-full bg-white">
            <thead>
              <tr className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800">
                <th className="px-6 py-3 text-left text-white font-bold text-sm uppercase tracking-wide sticky left-0 z-40 border-r border-white/20 cursor-pointer select-none">
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-white" />
                    <span>{groupKey.charAt(0).toUpperCase() + groupKey.slice(1)}</span>
                  </div>
                </th>
                {months.map(({ key, display }, index) => {
                  const isPreviousMonth = key === previousMonthKey;
                  return (
                    <th
                      key={key}
                      className={`px-3 py-3 text-center font-bold text-xs uppercase tracking-wider border-l border-white/20 min-w-[90px] cursor-pointer select-none ${
                        isPreviousMonth 
                          ? 'bg-blue-800 text-white' 
                          : 'text-white'
                      }`}
                      onClick={() => {
                        if (sortKey !== key) { setSortKey(key); setSortDir('desc'); }
                        else setSortDir(d => d === 'desc' ? 'asc' : 'desc');
                      }}
                      title={`Sort by ${display} (${sortDir})${isPreviousMonth ? ' - Main Month' : ''}`}
                    >
                      <div className="flex flex-col items-center">
                        <div className="flex items-center space-x-1">
                          {isPreviousMonth && <Star className="w-3 h-3" />}
                          <span className="text-xs font-bold whitespace-nowrap">{display.split(' ')[0]}</span>
                        </div>
                        <span className="text-slate-300 text-xs">{display.split(' ')[1]}</span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {processedData.map((row, index) => {
                const metricVal = (b: any): number => {
                  if (!b) return 0;
                  switch (metric) {
                    case 'totalLeads': return b.totalLeads;
                    case 'trialsCompleted': return b.trialsCompleted;
                    case 'trialsScheduled': return b.trialsScheduled;
                    case 'convertedLeads': return b.convertedLeads;
                    case 'ltv': return b.totalLeads > 0 ? b.totalLTV / b.totalLeads : 0;
                    case 'avgVisits': return b.totalLeads > 0 ? b.totalVisits / b.totalLeads : 0;
                  }
                };

                return (
                  <tr 
                    key={row.group}
                    className="bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 border-b border-gray-200 transition-all duration-300 hover:shadow-lg animate-in slide-in-from-left-2 fade-in duration-300 cursor-pointer h-9 max-h-9"
                    onClick={() => {
                      if (onDrillDown) {
                        const filteredData = data.filter(lead => {
                          const leadValue = ((lead as any)[groupKey] as string) || 'Unknown';
                          return leadValue === row.group;
                        });
                        onDrillDown(`${groupKey}: ${row.group} - Month Analysis`, filteredData, 'month-group');
                      }
                    }}
                  >
                    <td className="px-6 py-2 text-left sticky left-0 bg-white border-r border-gray-200 z-10 transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis">
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-400 text-xs">•</span>
                        <span className="text-slate-700 font-medium text-xs">{row.group}</span>
                      </div>
                    </td>
                    {months.map(({ key }, monthIdx) => {
                      const bucket = row.months.get(key);
                      const value = metricVal(bucket);
                      
                      // Calculate growth vs previous month
                      const prevMonth = monthIdx > 0 ? months[monthIdx - 1] : null;
                      const prevBucket = prevMonth ? row.months.get(prevMonth.key) : null;
                      const prevValue = metricVal(prevBucket);
                      const growth = prevValue > 0 ? ((value - prevValue) / prevValue) * 100 : 0;
                      
                      return (
                        <td 
                          key={key}
                          className="px-2 py-2 text-center text-sm font-mono text-slate-700 border-l border-gray-200 hover:bg-blue-100/60 cursor-pointer transition-all duration-200 whitespace-nowrap"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onDrillDown) {
                              const monthData = data.filter(lead => {
                                const leadValue = ((lead as any)[groupKey] as string) || 'Unknown';
                                const leadDate = new Date(lead.createdAt);
                                const monthKey = `${leadDate.getFullYear()}-${String(leadDate.getMonth() + 1).padStart(2, '0')}`;
                                return leadValue === row.group && monthKey === key;
                              });
                              onDrillDown(`${row.group} - ${key}`, monthData, 'month-detail');
                            }
                          }}
                        >
                          <div className="space-y-1">
                            <div className="font-bold">
                              {viewMode === 'values' ? (
                                metric === 'ltv' || metric === 'avgVisits' ? value.toFixed(1) : formatNumber(value)
                              ) : (
                                growth === 0 ? '0.0%' : (
                                  <span className={growth > 0 ? 'text-emerald-600' : 'text-red-500'}>
                                    {growth > 0 ? '+' : ''}{growth.toFixed(1)}%
                                  </span>
                                )
                              )}
                            </div>
                            {viewMode === 'values' && prevMonth && (
                              <div className={`text-xs ${
                                growth > 0 ? 'text-emerald-600' : 
                                growth < 0 ? 'text-red-500' : 'text-gray-500'
                              }`}>
                                {growth === 0 ? '—' : `${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`}
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              
              {/* Totals Row */}
              <tr className="bg-slate-800 text-white font-bold border-t-2 border-slate-400">
                <td className="px-6 py-3 text-left sticky left-0 bg-slate-800 border-r border-slate-400 z-20 cursor-pointer hover:underline whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-cyan-400" />
                    <span className="text-cyan-100 font-bold text-sm">TOTALS</span>
                  </div>
                </td>
                {months.map(({ key }) => {
                  // Calculate total value for this month across all groups
                  let totalValue = 0;
                  processedData.forEach(row => {
                    const bucket = row.months.get(key);
                    if (bucket) {
                      switch (metric) {
                        case 'totalLeads': totalValue += bucket.totalLeads; break;
                        case 'trialsCompleted': totalValue += bucket.trialsCompleted; break;
                        case 'trialsScheduled': totalValue += bucket.trialsScheduled; break;
                        case 'convertedLeads': totalValue += bucket.convertedLeads; break;
                        case 'ltv': totalValue += bucket.totalLTV; break;
                        case 'avgVisits': totalValue += bucket.totalVisits; break;
                      }
                    }
                  });
                  
                  // For average metrics, divide by total leads
                  if (metric === 'ltv' || metric === 'avgVisits') {
                    const totalLeads = processedData.reduce((sum, row) => {
                      const bucket = row.months.get(key);
                      return sum + (bucket ? bucket.totalLeads : 0);
                    }, 0);
                    if (totalLeads > 0) totalValue = totalValue / totalLeads;
                  }
                  
                  return (
                    <td 
                      key={key}
                      className="px-2 py-2 text-center text-sm font-bold text-white border-l border-slate-400 hover:bg-slate-700 cursor-pointer transition-all duration-200"
                    >
                      <div className="flex flex-col items-center space-y-0.5 min-h-6 justify-center">
                        <span className="font-mono text-xs whitespace-nowrap">
                          {metric === 'ltv' || metric === 'avgVisits' ? totalValue.toFixed(1) : formatNumber(totalValue)}
                        </span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </ModernTableWrapper>

      <PersistentTableFooter
        tableRef={tableRef}
        filename="funnel-month-on-month-analysis"
        sheetName="Funnel Analysis"
      />
    </div>
  );
};

export default FunnelMonthOnMonthTable;