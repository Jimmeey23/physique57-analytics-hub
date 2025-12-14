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

export interface ClientMetricWithYoY extends ClientMetric {
  yoyPreviousValue?: string;
  yoyPreviousRawValue?: number;
  yoyChange?: number;
  comparison?: { current: number; previous: number; difference: number };
  filterData?: () => NewClientData[];
  metricType?: string;
  rawValue?: number;
  previousRawValue?: number;
  icon?: React.ComponentType<{ className?: string }>;
}

interface Options {
  dateRange?: { start?: string | Date; end?: string | Date };
}

const calcGrowth = (current: number, previous: number) => {
  if (previous === 0) return { rate: current > 0 ? 100 : 0, isSignificant: current > 0, trend: current > 0 ? 'moderate' as Trend : 'weak' as Trend };
  const rate = ((current - previous) / previous) * 100;
  const mag = Math.abs(rate);
  
  // Trend should consider direction of change
  let trend: Trend;
  if (rate > 0) {
    // Positive growth
    trend = mag > 20 ? 'strong' : mag > 5 ? 'moderate' : 'weak';
  } else {
    // Negative growth (decline) - should always be weak or moderate at best
    trend = mag > 20 ? 'weak' : mag > 5 ? 'moderate' : 'weak';
  }
  
  return { rate, isSignificant: mag > 2, trend };
};

export function useClientConversionMetrics(
  data: NewClientData[] = [],
  historicalData?: NewClientData[],
  options?: Options
) {
  return useMemo(() => {
    // Use historicalData as the base dataset that contains data across multiple periods
    // This should have location/trainer filters applied but NOT date filters
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

    // Filter base data for current period by the selected date range
    const current = base.filter((it) => within(parseDate((it as any).firstVisitDate), currentStart, currentEnd));
    
    // Filter base data for previous period by previous month date range
    const previous = base.filter((it) => within(parseDate((it as any).firstVisitDate), prevStart, prevEnd));

    const isNew = (c: NewClientData) => String(c.isNew || '').toLowerCase().includes('new');
    const isConverted = (c: NewClientData) => c.conversionStatus === 'Converted';
    const isRetained = (c: NewClientData) => c.retentionStatus === 'Retained';

    // Calculate current period metrics
    const curNew = current.filter(isNew).length;
    const curConverted = current.filter(isConverted).length;
    const curRetained = current.filter(isRetained).length;

    // Calculate previous period metrics
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

    // Year-over-year: same month last year
    const prevYearAnchor = new Date(currentStart.getFullYear() - 1, currentStart.getMonth(), 15);
    const prevYearStart = monthStart(prevYearAnchor);
    const prevYearEnd = monthEnd(prevYearAnchor);

    const previousYear = base.filter((it) => within(parseDate((it as any).firstVisitDate), prevYearStart, prevYearEnd));

    const metrics = [
      {
        title: 'New Members',
        value: formatNumber(curNew),
        rawValue: curNew,
        change: calcGrowth(curNew, prevNew).rate,
        changeDetails: calcGrowth(curNew, prevNew),
        previousValue: formatNumber(prevNew),
        previousRawValue: prevNew,
        yoyPreviousValue: formatNumber(previousYear.filter(isNew).length),
        yoyPreviousRawValue: previousYear.filter(isNew).length,
        yoyChange: calcGrowth(curNew, previousYear.filter(isNew).length).rate,
        comparison: { current: curNew, previous: previousYear.filter(isNew).length, difference: curNew - previousYear.filter(isNew).length },
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
        yoyPreviousValue: formatNumber(previousYear.filter(isConverted).length),
        yoyPreviousRawValue: previousYear.filter(isConverted).length,
        yoyChange: calcGrowth(curConverted, previousYear.filter(isConverted).length).rate,
        comparison: { current: curConverted, previous: previousYear.filter(isConverted).length, difference: curConverted - previousYear.filter(isConverted).length },
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
        yoyPreviousValue: formatNumber(previousYear.filter(isRetained).length),
        yoyPreviousRawValue: previousYear.filter(isRetained).length,
        yoyChange: calcGrowth(curRetained, previousYear.filter(isRetained).length).rate,
        comparison: { current: curRetained, previous: previousYear.filter(isRetained).length, difference: curRetained - previousYear.filter(isRetained).length },
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
        yoyPreviousValue: formatPercentage(previousYear.length > 0 ? (previousYear.filter(isConverted).length / previousYear.filter(isNew).length) * 100 : 0),
        yoyPreviousRawValue: previousYear.length > 0 ? (previousYear.filter(isConverted).length / previousYear.filter(isNew).length) * 100 : 0,
        yoyChange: calcGrowth(overallConvCur, previousYear.length > 0 ? (previousYear.filter(isConverted).length / previousYear.filter(isNew).length) * 100 : 0).rate,
        comparison: { current: overallConvCur, previous: previousYear.length > 0 ? (previousYear.filter(isConverted).length / previousYear.filter(isNew).length) * 100 : 0, difference: overallConvCur - (previousYear.length > 0 ? (previousYear.filter(isConverted).length / previousYear.filter(isNew).length) * 100 : 0) },
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
        yoyPreviousValue: formatPercentage(previousYear.length > 0 ? (previousYear.filter(isRetained).length / previousYear.filter(isNew).length) * 100 : 0),
        yoyPreviousRawValue: previousYear.length > 0 ? (previousYear.filter(isRetained).length / previousYear.filter(isNew).length) * 100 : 0,
        yoyChange: calcGrowth(retentionCur, previousYear.length > 0 ? (previousYear.filter(isRetained).length / previousYear.filter(isNew).length) * 100 : 0).rate,
        comparison: { current: retentionCur, previous: previousYear.length > 0 ? (previousYear.filter(isRetained).length / previousYear.filter(isNew).length) * 100 : 0, difference: retentionCur - (previousYear.length > 0 ? (previousYear.filter(isRetained).length / previousYear.filter(isNew).length) * 100 : 0) },
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
        yoyPreviousValue: formatCurrency(previousYear.length > 0 ? (previousYear.reduce((s, c) => s + (c.ltv || 0), 0) / previousYear.length) : 0),
        yoyPreviousRawValue: previousYear.length > 0 ? (previousYear.reduce((s, c) => s + (c.ltv || 0), 0) / previousYear.length) : 0,
        yoyChange: calcGrowth(avgLTVCur, previousYear.length > 0 ? (previousYear.reduce((s, c) => s + (c.ltv || 0), 0) / previousYear.length) : 0).rate,
        comparison: { current: avgLTVCur, previous: previousYear.length > 0 ? (previousYear.reduce((s, c) => s + (c.ltv || 0), 0) / previousYear.length) : 0, difference: avgLTVCur - (previousYear.length > 0 ? (previousYear.reduce((s, c) => s + (c.ltv || 0), 0) / previousYear.length) : 0) },
        periodLabel,
        icon: 'DollarSign',
        description: `Average lifetime value`,
      },
    ];

    // Debug: log computed metrics and YoY values
    // eslint-disable-next-line no-console
    console.debug('useClientConversionMetrics -> metrics', metrics.map(m => ({ title: m.title, previous: (m as any).previousValue, yoyPrevious: (m as any).yoyPreviousValue, comparison: (m as any).comparison })));
    return { metrics };
  }, [data, historicalData, options?.dateRange?.start, options?.dateRange?.end]);
}
