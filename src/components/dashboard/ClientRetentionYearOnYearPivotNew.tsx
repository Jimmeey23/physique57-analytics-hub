import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart3, ArrowUpDown } from 'lucide-react';
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

type RowType = 'clientType' | 'membership';

interface Props {
  data: NewClientData[];
  onRowClick?: (data: any) => void;
}

export const ClientRetentionYearOnYearPivot: React.FC<Props> = ({ data, onRowClick }) => {
  const [metric, setMetric] = useState<MetricKey>('trials');
  const [rowType, setRowType] = useState<RowType>('clientType');
  const [displayMode, setDisplayMode] = useState<'values' | 'growth'>('values');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const previousYear = currentYear - 1;

  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => {
    const d = new Date(currentYear, i, 1);
    return { idx: i, key: d.toLocaleDateString('en-US', { month: 'short' }), month: i + 1 };
  }), [currentYear]);

  const rowKeys = useMemo(() => {
    const set = new Set<string>();
    data.forEach(c => {
      const key = rowType === 'clientType' ? (c.isNew || 'Unknown') : (c.membershipUsed || 'Unknown');
      set.add(key);
    });
    return Array.from(set).sort((a, b) => {
      if (rowType === 'clientType') {
        const an = a.toLowerCase();
        const bn = b.toLowerCase();
        if (an.includes('new') && !bn.includes('new')) return -1;
        if (!an.includes('new') && bn.includes('new')) return 1;
      }
      return a.localeCompare(b);
    });
  }, [data, rowType]);

  const pivot = useMemo(() => {
    const initCell = () => ({ 
      trials: 0, 
      newMembers: 0, 
      converted: 0, 
      retained: 0, 
      totalLTV: 0, 
      conversionIntervals: [] as number[],
      visitsPostTrial: [] as number[],
      clients: [] as NewClientData[] // Store actual client data for drill-down
    });
    const map: Record<string, { current: Record<string, any>; previous: Record<string, any> }> = {};
    
    rowKeys.forEach(rk => {
      map[rk] = { current: {}, previous: {} };
      months.forEach(m => {
        map[rk].current[m.key] = initCell();
        map[rk].previous[m.key] = initCell();
      });
    });

    data.forEach(c => {
      const d = parseDate(c.firstVisitDate || '');
      if (!d) return;
      const monthKey = d.toLocaleDateString('en-US', { month: 'short' });
      const year = d.getFullYear();
      const rowKey = rowType === 'clientType' ? (c.isNew || 'Unknown') : (c.membershipUsed || 'Unknown');
      
      if (!map[rowKey]) return;
      const bucket = year === currentYear ? map[rowKey].current[monthKey] : year === previousYear ? map[rowKey].previous[monthKey] : null;
      if (!bucket) return;
      
      bucket.trials += 1;
      if ((c.isNew || '').toLowerCase().includes('new')) bucket.newMembers += 1;
      if (c.conversionStatus === 'Converted') bucket.converted += 1;
      if (c.retentionStatus === 'Retained') bucket.retained += 1;
      bucket.totalLTV += c.ltv || 0;
      bucket.clients.push(c); // Add client to bucket
      
      // Add conversion interval and visits tracking
      if (c.conversionSpan !== undefined && c.conversionSpan !== null) {
        bucket.conversionIntervals.push(c.conversionSpan);
      }
      if (c.visitsPostTrial !== undefined && c.visitsPostTrial !== null) {
        bucket.visitsPostTrial.push(c.visitsPostTrial);
      }
    });

    // Derived metrics
    rowKeys.forEach(rk => {
      months.forEach(m => {
        const derive = (b: any) => {
          b.avgLTV = b.trials > 0 ? b.totalLTV / b.trials : 0;
          b.conversionRate = b.newMembers > 0 ? (b.converted / b.newMembers) * 100 : 0;
          b.retentionRate = b.newMembers > 0 ? (b.retained / b.newMembers) * 100 : 0;
          b.avgConversionDays = b.conversionIntervals.length > 0 
            ? b.conversionIntervals.reduce((sum: number, val: number) => sum + val, 0) / b.conversionIntervals.length 
            : 0;
          b.avgVisits = b.visitsPostTrial.length > 0
            ? b.visitsPostTrial.reduce((sum: number, val: number) => sum + val, 0) / b.visitsPostTrial.length
            : 0;
        };
        derive(map[rk].current[m.key]);
        derive(map[rk].previous[m.key]);
      });
    });
    
    return map;
  }, [data, rowKeys, months, currentYear, previousYear, rowType]);

  const renderValue = (current: any, previous: any) => {
    let currVal = 0, prevVal = 0;
    
    switch (metric) {
      case 'trials':
        currVal = current.trials || 0;
        prevVal = previous.trials || 0;
        break;
      case 'newMembers':
        currVal = current.newMembers || 0;
        prevVal = previous.newMembers || 0;
        break;
      case 'converted':
        currVal = current.converted || 0;
        prevVal = previous.converted || 0;
        break;
      case 'retained':
        currVal = current.retained || 0;
        prevVal = previous.retained || 0;
        break;
      case 'conversionRate':
        currVal = current.conversionRate || 0;
        prevVal = previous.conversionRate || 0;
        break;
      case 'retentionRate':
        currVal = current.retentionRate || 0;
        prevVal = previous.retentionRate || 0;
        break;
      case 'avgLTV':
        currVal = current.avgLTV || 0;
        prevVal = previous.avgLTV || 0;
        break;
      case 'totalLTV':
        currVal = current.totalLTV || 0;
        prevVal = previous.totalLTV || 0;
        break;
      case 'avgConversionDays':
        currVal = current.avgConversionDays || 0;
        prevVal = previous.avgConversionDays || 0;
        break;
      case 'avgVisits':
        currVal = current.avgVisits || 0;
        prevVal = previous.avgVisits || 0;
        break;
    }

    if (displayMode === 'growth') {
      const growth = prevVal !== 0 ? ((currVal - prevVal) / prevVal) * 100 : 0;
      const isPositive = growth >= 0;
      return (
        <span className={`text-xs font-semibold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
          {isPositive ? '▲' : '▼'} {Math.abs(growth).toFixed(1)}%
        </span>
      );
    }

    // Values mode: show prev | curr
    const format = (val: number) => {
      switch (metric) {
        case 'trials':
        case 'newMembers':
        case 'converted':
        case 'retained':
          return formatNumber(val);
        case 'conversionRate':
        case 'retentionRate':
          return `${val.toFixed(1)}%`;
        case 'avgLTV':
        case 'totalLTV':
          return formatCurrency(val);
        case 'avgConversionDays':
          return `${val.toFixed(0)} days`;
        case 'avgVisits':
          return `${val.toFixed(1)}`;
        default:
          return String(val);
      }
    };

    return (
      <div className="flex flex-col gap-0.5 text-xs">
        <span className="text-slate-500">{format(prevVal)}</span>
        <span className="font-bold text-slate-800">{format(currVal)}</span>
      </div>
    );
  };

  // Render value with white text for totals row
  const renderValueWhite = (current: any, previous: any) => {
    let currVal = 0, prevVal = 0;
    
    switch (metric) {
      case 'trials':
        currVal = current.trials || 0;
        prevVal = previous.trials || 0;
        break;
      case 'newMembers':
        currVal = current.newMembers || 0;
        prevVal = previous.newMembers || 0;
        break;
      case 'converted':
        currVal = current.converted || 0;
        prevVal = previous.converted || 0;
        break;
      case 'retained':
        currVal = current.retained || 0;
        prevVal = previous.retained || 0;
        break;
      case 'conversionRate':
        currVal = current.conversionRate || 0;
        prevVal = previous.conversionRate || 0;
        break;
      case 'retentionRate':
        currVal = current.retentionRate || 0;
        prevVal = previous.retentionRate || 0;
        break;
      case 'avgLTV':
        currVal = current.avgLTV || 0;
        prevVal = previous.avgLTV || 0;
        break;
      case 'totalLTV':
        currVal = current.totalLTV || 0;
        prevVal = previous.totalLTV || 0;
        break;
      case 'avgConversionDays':
        currVal = current.avgConversionDays || 0;
        prevVal = previous.avgConversionDays || 0;
        break;
      case 'avgVisits':
        currVal = current.avgVisits || 0;
        prevVal = previous.avgVisits || 0;
        break;
    }

    if (displayMode === 'growth') {
      const growth = prevVal !== 0 ? ((currVal - prevVal) / prevVal) * 100 : 0;
      const isPositive = growth >= 0;
      return (
        <span className="text-xs font-semibold text-white">
          {isPositive ? '▲' : '▼'} {Math.abs(growth).toFixed(1)}%
        </span>
      );
    }

    // Values mode: show prev | curr with white text
    const format = (val: number) => {
      switch (metric) {
        case 'trials':
        case 'newMembers':
        case 'converted':
        case 'retained':
          return formatNumber(val);
        case 'conversionRate':
        case 'retentionRate':
          return `${val.toFixed(1)}%`;
        case 'avgLTV':
        case 'totalLTV':
          return formatCurrency(val);
        case 'avgConversionDays':
          return `${val.toFixed(0)} days`;
        case 'avgVisits':
          return `${val.toFixed(1)}`;
        default:
          return String(val);
      }
    };

    return (
      <div className="flex flex-col gap-0.5 text-xs">
        <span className="text-white/70">{format(prevVal)}</span>
        <span className="font-bold text-white">{format(currVal)}</span>
      </div>
    );
  };

  const sortedRowKeys = useMemo(() => {
    if (!sortColumn) return rowKeys;
    
    const sorted = [...rowKeys].sort((a, b) => {
      if (sortColumn === 'row') return a.localeCompare(b);
      
      const aData = pivot[a];
      const bData = pivot[b];
      if (!aData || !bData) return 0;
      
      const aCurr = aData.current[sortColumn];
      const bCurr = bData.current[sortColumn];
      if (!aCurr || !bCurr) return 0;
      
      let aVal = 0, bVal = 0;
      switch (metric) {
        case 'trials': aVal = aCurr.trials || 0; bVal = bCurr.trials || 0; break;
        case 'newMembers': aVal = aCurr.newMembers || 0; bVal = bCurr.newMembers || 0; break;
        case 'converted': aVal = aCurr.converted || 0; bVal = bCurr.converted || 0; break;
        case 'retained': aVal = aCurr.retained || 0; bVal = bCurr.retained || 0; break;
        case 'retentionRate': aVal = aCurr.retentionRate || 0; bVal = bCurr.retentionRate || 0; break;
        case 'conversionRate': aVal = aCurr.conversionRate || 0; bVal = bCurr.conversionRate || 0; break;
        case 'avgLTV': aVal = aCurr.avgLTV || 0; bVal = bCurr.avgLTV || 0; break;
        case 'totalLTV': aVal = aCurr.totalLTV || 0; bVal = bCurr.totalLTV || 0; break;
      }
      
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
    });
    
    return sorted;
  }, [rowKeys, sortColumn, sortDir, pivot, metric]);

  const handleSort = (col: string) => {
    if (sortColumn === col) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortColumn(col);
      setSortDir('desc');
    }
  };

  // Calculate totals
  const totalsRow = useMemo(() => {
    const totals: { current: Record<string, any>; previous: Record<string, any> } = { current: {}, previous: {} };
    
    months.forEach(m => {
      const initCell = () => ({ 
        trials: 0, 
        newMembers: 0, 
        converted: 0, 
        retained: 0, 
        totalLTV: 0,
        conversionIntervals: [] as number[],
        visitsPostTrial: [] as number[],
        clients: [] as NewClientData[]
      });
      totals.current[m.key] = initCell();
      totals.previous[m.key] = initCell();
      
      rowKeys.forEach(rk => {
        const curr = pivot[rk]?.current[m.key];
        const prev = pivot[rk]?.previous[m.key];
        
        if (curr) {
          totals.current[m.key].trials += curr.trials || 0;
          totals.current[m.key].newMembers += curr.newMembers || 0;
          totals.current[m.key].converted += curr.converted || 0;
          totals.current[m.key].retained += curr.retained || 0;
          totals.current[m.key].totalLTV += curr.totalLTV || 0;
          totals.current[m.key].conversionIntervals.push(...(curr.conversionIntervals || []));
          totals.current[m.key].visitsPostTrial.push(...(curr.visitsPostTrial || []));
          totals.current[m.key].clients.push(...(curr.clients || []));
        }
        
        if (prev) {
          totals.previous[m.key].trials += prev.trials || 0;
          totals.previous[m.key].newMembers += prev.newMembers || 0;
          totals.previous[m.key].converted += prev.converted || 0;
          totals.previous[m.key].retained += prev.retained || 0;
          totals.previous[m.key].totalLTV += prev.totalLTV || 0;
          totals.previous[m.key].conversionIntervals.push(...(prev.conversionIntervals || []));
          totals.previous[m.key].visitsPostTrial.push(...(prev.visitsPostTrial || []));
          totals.previous[m.key].clients.push(...(prev.clients || []));
        }
      });
      
      const derive = (b: any) => {
        b.avgLTV = b.trials > 0 ? b.totalLTV / b.trials : 0;
        b.conversionRate = b.newMembers > 0 ? (b.converted / b.newMembers) * 100 : 0;
        b.retentionRate = b.newMembers > 0 ? (b.retained / b.newMembers) * 100 : 0;
        b.avgConversionDays = b.conversionIntervals.length > 0 
          ? b.conversionIntervals.reduce((sum: number, val: number) => sum + val, 0) / b.conversionIntervals.length 
          : 0;
        b.avgVisits = b.visitsPostTrial.length > 0
          ? b.visitsPostTrial.reduce((sum: number, val: number) => sum + val, 0) / b.visitsPostTrial.length
          : 0;
      };
      derive(totals.current[m.key]);
      derive(totals.previous[m.key]);
    });
    
    return totals;
  }, [pivot, rowKeys, months]);

  return (
    <Card className="bg-white shadow-xl border-0 overflow-hidden hover:shadow-2xl transition-shadow duration-300">
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
      <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-emerald-700 to-teal-800 text-white pt-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Year-on-Year Analysis
              <Badge variant="secondary" className="bg-white/20 text-white">{previousYear} vs {currentYear}</Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={displayMode === 'values' ? 'default' : 'outline'}
                onClick={() => setDisplayMode('values')}
                className={displayMode === 'values' ? 'bg-white text-emerald-700 hover:bg-white/90' : 'bg-white/10 text-white hover:bg-white/20 border-white/30'}
              >
                Values
              </Button>
              <Button
                size="sm"
                variant={displayMode === 'growth' ? 'default' : 'outline'}
                onClick={() => setDisplayMode('growth')}
                className={displayMode === 'growth' ? 'bg-white text-emerald-700 hover:bg-white/90' : 'bg-white/10 text-white hover:bg-white/20 border-white/30'}
              >
                Growth %
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-white/10 rounded-lg p-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setRowType('clientType')}
                className={`min-w-[110px] ${rowType === 'clientType' ? 'bg-white text-emerald-700' : 'text-white hover:bg-white/20'}`}
              >
                Client Type
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setRowType('membership')}
                className={`min-w-[110px] ${rowType === 'membership' ? 'bg-white text-emerald-700' : 'text-white hover:bg-white/20'}`}
              >
                Membership
              </Button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {(Object.keys(METRIC_LABELS) as MetricKey[]).map(k => (
                <button
                  key={k}
                  onClick={() => setMetric(k)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all min-w-[90px] ${metric === k ? 'bg-white text-emerald-700 shadow-md' : 'bg-white/10 text-white hover:bg-white/20'}`}
                  title={METRIC_LABELS[k]}
                >
                  {METRIC_LABELS[k]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
  <div className="overflow-x-auto max-h-[600px] relative">
          <table className="min-w-full relative">
            <thead>
              <tr className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white sticky top-0 z-10">
                <th 
                  className="px-4 py-3 text-left sticky left-0 z-20 font-bold text-xs uppercase tracking-wide cursor-pointer select-none border-r border-white/20 bg-emerald-700"
                  onClick={() => handleSort('row')}
                >
                  <div className="flex items-center gap-1">
                    {rowType === 'clientType' ? 'Client Type' : 'Membership'}
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                {months.map(m => (
                  <th 
                    key={m.key} 
                    className="px-3 py-3 text-center font-bold text-xs uppercase tracking-wide min-w-[100px] border-l border-white/20 cursor-pointer hover:bg-emerald-600/50 select-none sticky top-0"
                    onClick={() => handleSort(m.key)}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold whitespace-nowrap">{m.key}</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                      {displayMode === 'values' && (
                        <span className="text-white/80 text-[10px]">Prev | Curr</span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedRowKeys.map((rk) => (
                <tr 
                  key={rk} 
                  className="border-b border-slate-100 hover:bg-emerald-50 cursor-pointer transition-colors"
                  onClick={() => {
                    // Aggregate clients from all months for this row
                    const allCurrentClients = months.flatMap(m => pivot[rk]?.current[m.key]?.clients || []);
                    const allPreviousClients = months.flatMap(m => pivot[rk]?.previous[m.key]?.clients || []);
                    const allClients = [...allCurrentClients, ...allPreviousClients];
                    onRowClick?.({ 
                      rowKey: rk, 
                      rowType, 
                      data: pivot[rk], 
                      metric,
                      clients: allClients
                    });
                  }}
                >
                  <td className="px-4 py-2 text-sm font-semibold text-slate-800 sticky left-0 bg-white hover:bg-emerald-50 z-10 border-r">{rk}</td>
                  {months.map((m) => (
                    <td 
                      key={m.key} 
                      className="px-2 py-2 text-center border-l"
                      onClick={(e) => {
                        // Allow clicking individual cells for month-specific drill-down
                        e.stopPropagation();
                        const currentClients = pivot[rk]?.current[m.key]?.clients || [];
                        const previousClients = pivot[rk]?.previous[m.key]?.clients || [];
                        onRowClick?.({ 
                          rowKey: rk, 
                          rowType,
                          month: m.key,
                          data: { current: pivot[rk].current[m.key], previous: pivot[rk].previous[m.key] },
                          metric,
                          clients: [...currentClients, ...previousClients]
                        });
                      }}
                    >
                      {renderValue(pivot[rk].current[m.key], pivot[rk].previous[m.key])}
                    </td>
                  ))}
                </tr>
              ))}
              {/* Totals Row */}
              <tr className="bg-slate-800 font-bold border-t-4 border-slate-600">
                <td className="px-4 py-2 text-sm text-white sticky left-0 bg-slate-800 z-10 border-r">TOTALS</td>
                {months.map((m) => (
                  <td 
                    key={m.key} 
                    className="px-2 py-2 text-center border-l cursor-pointer hover:bg-slate-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      const currentClients = totalsRow.current[m.key]?.clients || [];
                      const previousClients = totalsRow.previous[m.key]?.clients || [];
                      onRowClick?.({ 
                        rowKey: 'TOTALS', 
                        rowType,
                        month: m.key,
                        data: { current: totalsRow.current[m.key], previous: totalsRow.previous[m.key] },
                        metric,
                        clients: [...currentClients, ...previousClients]
                      });
                    }}
                  >
                    {renderValueWhite(totalsRow.current[m.key], totalsRow.previous[m.key])}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientRetentionYearOnYearPivot;
