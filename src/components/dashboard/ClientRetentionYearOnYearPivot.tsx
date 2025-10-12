import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3 } from 'lucide-react';
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
  | 'totalLTV';

const METRIC_LABELS: Record<MetricKey, string> = {
  trials: 'Trials',
  newMembers: 'New Members',
  converted: 'Converted',
  retained: 'Retained',
  retentionRate: 'Retention %',
  conversionRate: 'Conversion %',
  avgLTV: 'Avg LTV',
  totalLTV: 'Total LTV',
};

interface Props {
  data: NewClientData[];
}

export const ClientRetentionYearOnYearPivot: React.FC<Props> = ({ data }) => {
  const [metric, setMetric] = useState<MetricKey>('trials');
  const now = new Date();
  const currentYear = now.getFullYear();
  const previousYear = currentYear - 1;

  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => {
    const d = new Date(currentYear, i, 1);
    return { idx: i, key: d.toLocaleDateString('en-US', { month: 'short' }), month: i + 1 };
  }), [currentYear]);

  const pivot = useMemo(() => {
    const initCell = () => ({ trials: 0, newMembers: 0, converted: 0, retained: 0, totalLTV: 0, clients: [] as NewClientData[] });
    const map: Record<string, { current: any; previous: any }> = {};
    months.forEach(m => { map[m.key] = { current: initCell(), previous: initCell() }; });
    data.forEach(c => {
      const d = parseDate(c.firstVisitDate || '');
      if (!d) return;
      const monthKey = d.toLocaleDateString('en-US', { month: 'short' });
      const year = d.getFullYear();
      if (!map[monthKey]) return;
      const bucket = year === currentYear ? map[monthKey].current : year === previousYear ? map[monthKey].previous : null;
      if (!bucket) return;
      bucket.trials += 1;
      if ((c.isNew || '').toLowerCase().includes('new')) bucket.newMembers += 1;
      if (c.conversionStatus === 'Converted') bucket.converted += 1;
      if (c.retentionStatus === 'Retained') bucket.retained += 1;
      bucket.totalLTV += c.ltv || 0;
      bucket.clients.push(c);
    });
    // Derived
    months.forEach(m => {
      const cell = map[m.key];
      const derive = (b: any) => {
        b.avgLTV = b.trials > 0 ? b.totalLTV / b.trials : 0;
        b.conversionRate = b.newMembers > 0 ? (b.converted / b.newMembers) * 100 : 0;
        b.retentionRate = b.newMembers > 0 ? (b.retained / b.newMembers) * 100 : 0;
      };
      derive(cell.current);
      derive(cell.previous);
    });
    return map;
  }, [data, months, currentYear, previousYear]);

  const renderValue = (b: any) => {
    switch (metric) {
      case 'trials': return formatNumber(b.trials || 0);
      case 'newMembers': return formatNumber(b.newMembers || 0);
      case 'converted': return formatNumber(b.converted || 0);
      case 'retained': return formatNumber(b.retained || 0);
      case 'conversionRate': return `${(b.conversionRate || 0).toFixed(1)}%`;
      case 'retentionRate': return `${(b.retentionRate || 0).toFixed(1)}%`;
      case 'avgLTV': return formatCurrency(b.avgLTV || 0);
      case 'totalLTV': return formatCurrency(b.totalLTV || 0);
    }
  };

  return (
    <Card className="bg-white shadow-xl border-0 overflow-hidden">
      <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-emerald-700 to-teal-800 text-white">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Year-on-Year Pivot
            <Badge variant="secondary" className="bg-white/20 text-white">{previousYear} vs {currentYear}</Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            {(Object.keys(METRIC_LABELS) as MetricKey[]).map(k => (
              <button
                key={k}
                onClick={() => setMetric(k)}
                className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${metric === k ? 'bg-white text-emerald-700' : 'bg-white/10 text-white hover:bg-white/20'}`}
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
              <tr className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white">
                <th className="px-4 py-3 text-left sticky left-0 z-20 bg-emerald-700/90 font-bold text-xs uppercase tracking-wide">Month</th>
                {months.map(m => (
                  <th key={m.key} className="px-3 py-3 text-center font-bold text-xs uppercase tracking-wide min-w-[100px] border-l border-white/20">
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-bold whitespace-nowrap">{m.key}</span>
                      <span className="text-white/80 text-[10px]">Prev | Curr</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2 text-sm font-semibold text-slate-800 sticky left-0 bg-white z-10 border-r">Metric</td>
                {months.map(m => (
                  <td key={m.key} className="px-2 py-2 text-center text-sm font-mono text-slate-800 border-l">
                    <div className="flex flex-col gap-0.5">
                      <span className="opacity-80">{renderValue(pivot[m.key].previous)}</span>
                      <span className="font-bold">{renderValue(pivot[m.key].current)}</span>
                    </div>
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
