import { useMemo } from 'react';
import { NewClientData } from '@/types/dashboard';
import { parseDate } from '@/utils/dateUtils';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';

type Trend = 'strong' | 'moderate' | 'weak';

export interface ClientMetric {
  title: string;
  value: string;
  rawValue: number;
  change: number;
  changeDetails: { rate: number; isSignificant: boolean; trend: Trend };
  previousValue: string;
  previousRawValue: number;
  periodLabel?: string;
  icon: string;
  description: string;
}

interface Options {
  dateRange?: { start?: string | Date; end?: string | Date };
}

const calcGrowth = (current: number, previous: number) => {
  if (previous === 0) return { rate: current > 0 ? 100 : 0, isSignificant: current > 0, trend: current > 0 ? 'moderate' as Trend : 'weak' as Trend };
  const rate = ((current - previous) / previous) * 100;
  const mag = Math.abs(rate);
  const trend: Trend = mag > 20 ? 'strong' : mag > 5 ? 'moderate' : 'weak';
  return { rate, isSignificant: mag > 2, trend };
};

export function useClientConversionMetrics(
  data: NewClientData[] = [],
  historicalData?: NewClientData[],
  options?: Options
) {
  return useMemo(() => {
    // Use the filtered data passed in as 'data' for current period metrics
    // This respects all filters applied (location, trainer, etc.)
    const current = data;
    
    // For historical comparison, we need to get previous month data from the same filter context
    // Use historicalData if provided, otherwise use the full unfiltered dataset with same filters
    const base = (historicalData && historicalData.length > 0 ? historicalData : data) as NewClientData[];
    
    const compareEnd = options?.dateRange?.end
      ? (typeof options.dateRange.end === 'string' ? new Date(options.dateRange.end) : (options.dateRange.end as Date))
      : new Date();
    const monthStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    const currentStart = monthStart(compareEnd);
    const currentEnd = monthEnd(compareEnd);
    const prevAnchor = new Date(currentStart.getFullYear(), currentStart.getMonth() - 1, 15);
    const prevStart = monthStart(prevAnchor);
    const prevEnd = monthEnd(prevAnchor);
    const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
    const periodLabel = `${fmt(currentStart)} vs ${fmt(prevStart)}`;

    const within = (d?: Date | null, start?: Date, end?: Date) => !!(d && start && end && d >= start && d <= end);

    // For previous period, filter the base data by previous month date range
    const previous = base.filter((it) => within(parseDate((it as any).firstVisitDate), prevStart, prevEnd));

    const isNew = (c: NewClientData) => String(c.isNew || '').toLowerCase().includes('new');
    const isConverted = (c: NewClientData) => c.conversionStatus === 'Converted';
    const isRetained = (c: NewClientData) => c.retentionStatus === 'Retained';

    // Use the current filtered data directly (already filtered by all user selections)
    const curNew = current.filter(isNew).length;
    const curConverted = current.filter(isConverted).length;
    const curRetained = current.filter(isRetained).length;

    // For previous month comparison, filter the previous data
    const prevNew = previous.filter(isNew).length;
    const prevConverted = previous.filter(isConverted).length;
    const prevRetained = previous.filter(isRetained).length;

    const overallConvCur = curNew > 0 ? (curConverted / curNew) * 100 : 0;
    const overallConvPrev = prevNew > 0 ? (prevConverted / prevNew) * 100 : 0;

    const retentionCur = curNew > 0 ? (curRetained / curNew) * 100 : 0;
    const retentionPrev = prevNew > 0 ? (prevRetained / prevNew) * 100 : 0;

    const totalLTVCur = current.reduce((s, c) => s + (c.ltv || 0), 0);
    const totalLTVPrev = previous.reduce((s, c) => s + (c.ltv || 0), 0);
    const avgLTVCur = current.length > 0 ? totalLTVCur / current.length : 0;
    const avgLTVPrev = previous.length > 0 ? totalLTVPrev / previous.length : 0;

    const metrics = [
      {
        title: 'New Members',
        value: formatNumber(curNew),
        rawValue: curNew,
        change: calcGrowth(curNew, prevNew).rate,
        changeDetails: calcGrowth(curNew, prevNew),
        previousValue: formatNumber(prevNew),
        previousRawValue: prevNew,
        periodLabel,
        icon: 'UserPlus',
        description: 'Recently acquired clients',
      },
      {
        title: 'Converted Members',
        value: formatNumber(curConverted),
        rawValue: curConverted,
        change: calcGrowth(curConverted, prevConverted).rate,
        changeDetails: calcGrowth(curConverted, prevConverted),
        previousValue: formatNumber(prevConverted),
        previousRawValue: prevConverted,
        periodLabel,
        icon: 'Award',
        description: 'Trial to paid conversions',
      },
      {
        title: 'Retained Members',
        value: formatNumber(curRetained),
        rawValue: curRetained,
        change: calcGrowth(curRetained, prevRetained).rate,
        changeDetails: calcGrowth(curRetained, prevRetained),
        previousValue: formatNumber(prevRetained),
        previousRawValue: prevRetained,
        periodLabel,
        icon: 'UserCheck',
        description: 'Active retained clients',
      },
      {
        title: 'Conversion Rate',
        value: formatPercentage(overallConvCur),
        rawValue: overallConvCur,
        change: calcGrowth(overallConvCur, overallConvPrev).rate,
        changeDetails: calcGrowth(overallConvCur, overallConvPrev),
        previousValue: formatPercentage(overallConvPrev),
        previousRawValue: overallConvPrev,
        periodLabel,
        icon: 'TrendingUp',
        description: 'New to converted rate',
      },
      {
        title: 'Retention Rate',
        value: formatPercentage(retentionCur),
        rawValue: retentionCur,
        change: calcGrowth(retentionCur, retentionPrev).rate,
        changeDetails: calcGrowth(retentionCur, retentionPrev),
        previousValue: formatPercentage(retentionPrev),
        previousRawValue: retentionPrev,
        periodLabel,
        icon: 'Target',
        description: 'Member retention rate',
      },
      {
        title: 'Avg LTV',
        value: formatCurrency(avgLTVCur),
        rawValue: avgLTVCur,
        change: calcGrowth(avgLTVCur, avgLTVPrev).rate,
        changeDetails: calcGrowth(avgLTVCur, avgLTVPrev),
        previousValue: formatCurrency(avgLTVPrev),
        previousRawValue: avgLTVPrev,
        periodLabel,
        icon: 'DollarSign',
        description: `Average lifetime value`,
      },
    ];

    return { metrics };
  }, [data, historicalData, options?.dateRange?.start, options?.dateRange?.end]);
}
