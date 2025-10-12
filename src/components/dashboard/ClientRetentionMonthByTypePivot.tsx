import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, TrendingUp, ArrowUpDown } from 'lucide-react';
import { NewClientData } from '@/types/dashboard';
import { parseDate } from '@/utils/dateUtils';
import { formatCurrency, formatNumber } from '@/utils/formatters';

type MetricKey =
  | 'trials'
  | 'newMembers'
  | 'converted'
  | 'retained'
  | 'retentionRate'
  | 'conversionRate'
  | 'avgLTV'
  | 'totalLTV'
  | 'avgConversionDays'
  | 'avgVisits';

const METRIC_LABELS: Record<MetricKey, string> = {
  trials: 'Trials',
  newMembers: 'New Members',
  converted: 'Converted',
  retained: 'Retained',
  retentionRate: 'Retention %',
  conversionRate: 'Conversion %',
  avgLTV: 'Avg LTV',
  totalLTV: 'Total LTV',
  avgConversionDays: 'Avg Conv Days',
  avgVisits: 'Avg Visits',
};

interface ClientRetentionMonthByTypePivotProps {
  data: NewClientData[];
  visitsSummary?: Record<string, number>;
  onRowClick?: (data: any) => void;
}

export const ClientRetentionMonthByTypePivot: React.FC<ClientRetentionMonthByTypePivotProps> = ({ data, visitsSummary, onRowClick }) => {
  const [metric, setMetric] = useState<MetricKey>('trials');
  const [displayMode, setDisplayMode] = useState<'values' | 'growth'>('values');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const months = useMemo(() => {
    const arr: { key: string; label: string; year: number; month: number }[] = [];
    const now = new Date();
    for (let i = 0; i < 22; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      arr.push({ key, label, year: d.getFullYear(), month: d.getMonth() + 1 });
    }
    return arr; // newest first
  }, []);

  const clientTypes = useMemo(() => {
    const set = new Set<string>();
    data.forEach(c => set.add(c.isNew || 'Unknown'));
    return Array.from(set).sort((a, b) => {
      const an = a.toLowerCase();
      const bn = b.toLowerCase();
      if (an.includes('new') && !bn.includes('new')) return -1;
      if (!an.includes('new') && bn.includes('new')) return 1;
      return a.localeCompare(b);
    });
  }, [data]);

  const pivot = useMemo(() => {
    // Build a nested map: type -> monthKey -> stats
    const map: Record<string, Record<string, any>> = {};
    // Pre-initialize
    clientTypes.forEach(t => {
      map[t] = {};
      months.forEach((m, idx) => {
        // visitsSummary comes as 'Jan 2024'
        const dt = new Date(m.year, m.month - 1, 1);
        const summaryKey = dt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        map[t][m.key] = {
          trials: 0,
          newMembers: 0,
          converted: 0,
          retained: 0,
          totalLTV: 0,
          conversionIntervals: [] as number[],
          visitsPostTrial: [] as number[],
          visits: visitsSummary?.[summaryKey] || 0,
          previous: idx < months.length - 1 ? null : undefined, // will link to prev month
        };
      });
    });

    data.forEach(c => {
      const d = parseDate(c.firstVisitDate || '');
      if (!d) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!months.find(m => m.key === key)) return; // restrict to the 22 months window
      const type = c.isNew || 'Unknown';
      const cell = map[type]?.[key];
      if (!cell) return;

      cell.trials += 1;
      if ((c.isNew || '').toLowerCase().includes('new')) cell.newMembers += 1;
      if (c.conversionStatus === 'Converted') cell.converted += 1;
      if (c.retentionStatus === 'Retained') cell.retained += 1;
      cell.totalLTV += c.ltv || 0;
      if (c.conversionSpan && c.conversionSpan > 0) cell.conversionIntervals.push(c.conversionSpan);
      if (c.visitsPostTrial && c.visitsPostTrial > 0) cell.visitsPostTrial.push(c.visitsPostTrial);
    });

    // Compute derived metrics and link previous
    clientTypes.forEach(t => {
      months.forEach((m, idx) => {
        const cell = map[t][m.key];
        const avgLTV = cell.trials > 0 ? cell.totalLTV / cell.trials : 0;
        const avgConversionDays = cell.conversionIntervals.length > 0
          ? cell.conversionIntervals.reduce((a: number, b: number) => a + b, 0) / cell.conversionIntervals.length
          : 0;
        const avgVisits = cell.visitsPostTrial.length > 0
          ? cell.visitsPostTrial.reduce((a: number, b: number) => a + b, 0) / cell.visitsPostTrial.length
          : 0;
        const conversionRate = cell.newMembers > 0 ? (cell.converted / cell.newMembers) * 100 : 0;
        const retentionRate = cell.newMembers > 0 ? (cell.retained / cell.newMembers) * 100 : 0;
        
        // Link to previous month (next in array since newest first)
        const prevMonthKey = months[idx + 1]?.key;
        const previous = prevMonthKey ? map[t][prevMonthKey] : null;
        
        map[t][m.key] = {
          ...cell,
          avgLTV,
          avgConversionDays,
          avgVisits,
          conversionRate,
          retentionRate,
          previous,
        };
      });
    });

    return map;
  }, [data, clientTypes, months, visitsSummary]);

  const renderValue = (cell: any, monthIdx: number) => {
    let value: string;
    switch (metric) {
      case 'trials': value = formatNumber(cell.trials || 0); break;
      case 'newMembers': value = formatNumber(cell.newMembers || 0); break;
      case 'converted': value = formatNumber(cell.converted || 0); break;
      case 'retained': value = formatNumber(cell.retained || 0); break;
      case 'retentionRate': value = `${(cell.retentionRate || 0).toFixed(1)}%`; break;
      case 'conversionRate': value = `${(cell.conversionRate || 0).toFixed(1)}%`; break;
      case 'avgLTV': value = formatCurrency(cell.avgLTV || 0); break;
      case 'totalLTV': value = formatCurrency(cell.totalLTV || 0); break;
      case 'avgConversionDays': value = `${Math.round(cell.avgConversionDays || 0)}`; break;
      case 'avgVisits': value = (cell.avgVisits || 0).toFixed(1); break;
      default: value = '0';
    }

    if (displayMode === 'growth' && monthIdx < months.length - 1) {
      const prevCell = cell.previous;
      if (!prevCell) return <span className="text-slate-400 text-xs">—</span>;
      
      let current = 0, previous = 0;
      switch (metric) {
        case 'trials': current = cell.trials || 0; previous = prevCell.trials || 0; break;
        case 'newMembers': current = cell.newMembers || 0; previous = prevCell.newMembers || 0; break;
        case 'converted': current = cell.converted || 0; previous = prevCell.converted || 0; break;
        case 'retained': current = cell.retained || 0; previous = prevCell.retained || 0; break;
        case 'retentionRate': current = cell.retentionRate || 0; previous = prevCell.retentionRate || 0; break;
        case 'conversionRate': current = cell.conversionRate || 0; previous = prevCell.conversionRate || 0; break;
        case 'avgLTV': current = cell.avgLTV || 0; previous = prevCell.avgLTV || 0; break;
        case 'totalLTV': current = cell.totalLTV || 0; previous = prevCell.totalLTV || 0; break;
        case 'avgConversionDays': current = cell.avgConversionDays || 0; previous = prevCell.avgConversionDays || 0; break;
        case 'avgVisits': current = cell.avgVisits || 0; previous = prevCell.avgVisits || 0; break;
      }

      const growth = previous !== 0 ? ((current - previous) / previous) * 100 : 0;
      const isPositive = growth >= 0;
      
      return (
        <span className={`text-xs font-semibold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
          {isPositive ? '▲' : '▼'} {Math.abs(growth).toFixed(1)}%
        </span>
      );
    }

    return <span className="text-sm font-medium text-slate-800">{value}</span>;
  };

  // Build sortable data
  const sortedTypes = useMemo(() => {
    if (!sortColumn) return clientTypes;
    
    const sorted = [...clientTypes].sort((a, b) => {
      if (sortColumn === 'type') return a.localeCompare(b);
      
      const aCell = pivot[a]?.[sortColumn];
      const bCell = pivot[b]?.[sortColumn];
      if (!aCell || !bCell) return 0;
      
      let aVal = 0, bVal = 0;
      switch (metric) {
        case 'trials': aVal = aCell.trials || 0; bVal = bCell.trials || 0; break;
        case 'newMembers': aVal = aCell.newMembers || 0; bVal = bCell.newMembers || 0; break;
        case 'converted': aVal = aCell.converted || 0; bVal = bCell.converted || 0; break;
        case 'retained': aVal = aCell.retained || 0; bVal = bCell.retained || 0; break;
        case 'retentionRate': aVal = aCell.retentionRate || 0; bVal = bCell.retentionRate || 0; break;
        case 'conversionRate': aVal = aCell.conversionRate || 0; bVal = bCell.conversionRate || 0; break;
        case 'avgLTV': aVal = aCell.avgLTV || 0; bVal = bCell.avgLTV || 0; break;
        case 'totalLTV': aVal = aCell.totalLTV || 0; bVal = bCell.totalLTV || 0; break;
        case 'avgConversionDays': aVal = aCell.avgConversionDays || 0; bVal = bCell.avgConversionDays || 0; break;
        case 'avgVisits': aVal = aCell.avgVisits || 0; bVal = bCell.avgVisits || 0; break;
      }
      
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
    });
    
    return sorted;
  }, [clientTypes, sortColumn, sortDir, pivot, metric]);

  const handleSort = (col: string) => {
    if (sortColumn === col) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortColumn(col);
      setSortDir('desc');
    }
  };

  // Calculate totals row
  const totalsRow = useMemo(() => {
    const totals: Record<string, any> = {};
    months.forEach(m => {
      const aggregated = {
        trials: 0,
        newMembers: 0,
        converted: 0,
        retained: 0,
        totalLTV: 0,
        conversionIntervals: [] as number[],
        visitsPostTrial: [] as number[],
      };
      
      clientTypes.forEach(t => {
        const cell = pivot[t]?.[m.key];
        if (!cell) return;
        aggregated.trials += cell.trials || 0;
        aggregated.newMembers += cell.newMembers || 0;
        aggregated.converted += cell.converted || 0;
        aggregated.retained += cell.retained || 0;
        aggregated.totalLTV += cell.totalLTV || 0;
        aggregated.conversionIntervals.push(...(cell.conversionIntervals || []));
        aggregated.visitsPostTrial.push(...(cell.visitsPostTrial || []));
      });

      const avgLTV = aggregated.trials > 0 ? aggregated.totalLTV / aggregated.trials : 0;
      const avgConversionDays = aggregated.conversionIntervals.length > 0
        ? aggregated.conversionIntervals.reduce((a: number, b: number) => a + b, 0) / aggregated.conversionIntervals.length
        : 0;
      const avgVisits = aggregated.visitsPostTrial.length > 0
        ? aggregated.visitsPostTrial.reduce((a: number, b: number) => a + b, 0) / aggregated.visitsPostTrial.length
        : 0;
      const conversionRate = aggregated.newMembers > 0 ? (aggregated.converted / aggregated.newMembers) * 100 : 0;
      const retentionRate = aggregated.newMembers > 0 ? (aggregated.retained / aggregated.newMembers) * 100 : 0;

      totals[m.key] = {
        ...aggregated,
        avgLTV,
        avgConversionDays,
        avgVisits,
        conversionRate,
        retentionRate,
      };
    });
    return totals;
  }, [pivot, clientTypes, months]);

  return (
    <Card className="bg-white shadow-xl border-0 overflow-hidden hover:shadow-2xl transition-shadow duration-300">
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
      <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-indigo-700 to-purple-800 text-white pt-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Month-on-Month by Client Type
              <Badge variant="secondary" className="bg-white/20 text-white">Last 22 months</Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={displayMode === 'values' ? 'default' : 'outline'}
                onClick={() => setDisplayMode('values')}
                className={displayMode === 'values' ? 'bg-white text-indigo-700 hover:bg-white/90' : 'bg-white/10 text-white hover:bg-white/20 border-white/30'}
              >
                Values
              </Button>
              <Button
                size="sm"
                variant={displayMode === 'growth' ? 'default' : 'outline'}
                onClick={() => setDisplayMode('growth')}
                className={displayMode === 'growth' ? 'bg-white text-indigo-700 hover:bg-white/90' : 'bg-white/10 text-white hover:bg-white/20 border-white/30'}
              >
                Growth %
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {(Object.keys(METRIC_LABELS) as MetricKey[]).map(k => (
              <button
                key={k}
                onClick={() => setMetric(k)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all min-w-[90px] ${metric === k ? 'bg-white text-indigo-700 shadow-md' : 'bg-white/10 text-white hover:bg-white/20'}`}
                title={METRIC_LABELS[k]}
              >
                {METRIC_LABELS[k]}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto max-h-[600px]">
          <table className="min-w-full">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gradient-to-r from-indigo-700 to-purple-800 text-white">
                <th 
                  className="px-4 py-3 text-left sticky left-0 z-20 bg-indigo-700 font-bold text-xs uppercase tracking-wide cursor-pointer hover:bg-indigo-600 select-none"
                  onClick={() => handleSort('type')}
                >
                  <div className="flex items-center gap-1">
                    Client Type
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                {months.map(m => (
                  <th 
                    key={m.key} 
                    className="px-3 py-3 text-center font-bold text-xs uppercase tracking-wide min-w-[90px] border-l border-white/20 cursor-pointer hover:bg-indigo-600/50 select-none"
                    onClick={() => handleSort(m.key)}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold whitespace-nowrap">{m.label.split(' ')[0]}</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                      <span className="text-white/80 text-[10px]">{m.label.split(' ')[1]}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedTypes.map((t) => (
                <tr 
                  key={t} 
                  className="border-b border-slate-100 hover:bg-indigo-50 cursor-pointer transition-colors"
                  onClick={() => onRowClick?.({ type: t, data: pivot[t], metric })}
                >
                  <td className="px-4 py-2 text-sm font-semibold text-slate-800 sticky left-0 bg-white hover:bg-indigo-50 z-10 border-r">{t}</td>
                  {months.map((m, idx) => {
                    const cell = pivot[t]?.[m.key] || {};
                    return (
                      <td key={m.key} className="px-2 py-2 text-center border-l">
                        {renderValue(cell, idx)}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {/* Totals Row */}
              <tr className="bg-slate-800 font-bold border-t-4 border-slate-600">
                <td className="px-4 py-2 text-sm text-white sticky left-0 bg-slate-800 z-10 border-r">TOTALS</td>
                {months.map((m, idx) => {
                  const cell = totalsRow[m.key] || {};
                  return (
                    <td key={m.key} className="px-2 py-2 text-center border-l text-white">
                      {renderValue(cell, idx)}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientRetentionMonthByTypePivot;
