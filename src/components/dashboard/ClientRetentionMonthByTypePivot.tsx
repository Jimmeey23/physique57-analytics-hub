import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';
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
}

export const ClientRetentionMonthByTypePivot: React.FC<ClientRetentionMonthByTypePivotProps> = ({ data, visitsSummary }) => {
  const [metric, setMetric] = useState<MetricKey>('trials');

  const months = useMemo(() => {
    const arr: { key: string; label: string; year: number; month: number }[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
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
      months.forEach(m => {
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
        };
      });
    });

    data.forEach(c => {
      const d = parseDate(c.firstVisitDate || '');
      if (!d) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!months.find(m => m.key === key)) return; // restrict to the 12 months window
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

    // Compute derived metrics
    clientTypes.forEach(t => {
      months.forEach(m => {
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
        map[t][m.key] = {
          ...cell,
          avgLTV,
          avgConversionDays,
          avgVisits,
          conversionRate,
          retentionRate,
        };
      });
    });

    return map;
  }, [data, clientTypes, months, visitsSummary]);

  const renderValue = (cell: any) => {
    switch (metric) {
      case 'trials': return formatNumber(cell.trials || 0);
      case 'newMembers': return formatNumber(cell.newMembers || 0);
      case 'converted': return formatNumber(cell.converted || 0);
      case 'retained': return formatNumber(cell.retained || 0);
      case 'retentionRate': return `${(cell.retentionRate || 0).toFixed(1)}%`;
      case 'conversionRate': return `${(cell.conversionRate || 0).toFixed(1)}%`;
      case 'avgLTV': return formatCurrency(cell.avgLTV || 0);
      case 'totalLTV': return formatCurrency(cell.totalLTV || 0);
      case 'avgConversionDays': return `${Math.round(cell.avgConversionDays || 0)} d`;
      case 'avgVisits': return (cell.avgVisits || 0).toFixed(1);
    }
  };

  return (
    <Card className="bg-white shadow-xl border-0 overflow-hidden">
      <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-indigo-700 to-purple-800 text-white">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Month-on-Month by Client Type (Pivot)
            <Badge variant="secondary" className="bg-white/20 text-white">Last 12 months</Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            {(Object.keys(METRIC_LABELS) as MetricKey[]).map(k => (
              <button
                key={k}
                onClick={() => setMetric(k)}
                className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${metric === k ? 'bg-white text-indigo-700' : 'bg-white/10 text-white hover:bg-white/20'}`}
                title={METRIC_LABELS[k]}
              >
                {METRIC_LABELS[k]}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gradient-to-r from-indigo-700 to-purple-800 text-white">
                <th className="px-4 py-3 text-left sticky left-0 z-20 bg-indigo-700/90 font-bold text-xs uppercase tracking-wide">Client Type</th>
                {months.map(m => (
                  <th key={m.key} className="px-3 py-3 text-center font-bold text-xs uppercase tracking-wide min-w-[90px] border-l border-white/20">
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-bold whitespace-nowrap">{m.label.split(' ')[0]}</span>
                      <span className="text-white/80 text-[10px]">{m.label.split(' ')[1]}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clientTypes.map((t) => (
                <tr key={t} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-2 text-sm font-semibold text-slate-800 sticky left-0 bg-white z-10 border-r">{t}</td>
                  {months.map(m => {
                    const cell = pivot[t]?.[m.key] || {};
                    return (
                      <td key={m.key} className="px-2 py-2 text-center text-sm font-mono text-slate-800 border-l">
                        {renderValue(cell)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientRetentionMonthByTypePivot;
