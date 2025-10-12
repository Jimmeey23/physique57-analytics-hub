import { useMemo } from 'react';
import { ExpirationData } from '@/types/dashboard';
import { parseDate } from '@/utils/dateUtils';
import { formatNumber, formatPercentage, formatCurrency } from '@/utils/formatters';

type Trend = 'strong' | 'moderate' | 'weak';

export interface ExpirationMetric {
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

export function useExpirationMetrics(
  data: ExpirationData[] = [],
  historicalData?: ExpirationData[],
  options?: Options
) {
  return useMemo(() => {
    const base = (historicalData && historicalData.length > 0 ? historicalData : data) as ExpirationData[];
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

    const current = base.filter((it) => within(parseDate((it as any).endDate), currentStart, currentEnd));
    const previous = base.filter((it) => within(parseDate((it as any).endDate), prevStart, prevEnd));

    const countByStatus = (list: ExpirationData[], status: string) => list.filter((i) => (i.status || '').toLowerCase() === status).length;

    const totalMembershipsCur = current.length;
    const totalMembershipsPrev = previous.length;

    const activeCur = countByStatus(current, 'active');
    const activePrev = countByStatus(previous, 'active');

    const churnedCur = countByStatus(current, 'churned');
    const churnedPrev = countByStatus(previous, 'churned');

    const frozenCur = countByStatus(current, 'frozen');
    const frozenPrev = countByStatus(previous, 'frozen');

    const churnRateCur = totalMembershipsCur > 0 ? (churnedCur / totalMembershipsCur) * 100 : 0;
    const churnRatePrev = totalMembershipsPrev > 0 ? (churnedPrev / totalMembershipsPrev) * 100 : 0;

    const activeRateCur = totalMembershipsCur > 0 ? (activeCur / totalMembershipsCur) * 100 : 0;
    const activeRatePrev = totalMembershipsPrev > 0 ? (activePrev / totalMembershipsPrev) * 100 : 0;

    const frozenRateCur = totalMembershipsCur > 0 ? (frozenCur / totalMembershipsCur) * 100 : 0;
    const frozenRatePrev = totalMembershipsPrev > 0 ? (frozenPrev / totalMembershipsPrev) * 100 : 0;

    // Revenue impact from churned (using paid field)
    const paidVal = (s: string | undefined) => {
      if (!s) return 0;
      const n = parseFloat(String(s).replace(/[^0-9.-]/g, ''));
      return isNaN(n) ? 0 : n;
    };
    const churnLossCur = current
      .filter((i) => (i.status || '').toLowerCase() === 'churned')
      .reduce((sum, i) => sum + paidVal(i.paid), 0);
    const churnLossPrev = previous
      .filter((i) => (i.status || '').toLowerCase() === 'churned')
      .reduce((sum, i) => sum + paidVal(i.paid), 0);

    const metrics: ExpirationMetric[] = [
      {
        title: 'Total Memberships',
        value: formatNumber(totalMembershipsCur),
        rawValue: totalMembershipsCur,
        change: calcGrowth(totalMembershipsCur, totalMembershipsPrev).rate,
        changeDetails: calcGrowth(totalMembershipsCur, totalMembershipsPrev),
        previousValue: formatNumber(totalMembershipsPrev),
        previousRawValue: totalMembershipsPrev,
        periodLabel,
        icon: 'Users',
        description: 'All tracked membership records',
      },
      {
        title: 'Active Members',
        value: formatNumber(activeCur),
        rawValue: activeCur,
        change: calcGrowth(activeCur, activePrev).rate,
        changeDetails: calcGrowth(activeCur, activePrev),
        previousValue: formatNumber(activePrev),
        previousRawValue: activePrev,
        periodLabel,
        icon: 'CheckCircle',
        description: `${formatPercentage(activeRateCur)} of total memberships`,
      },
      {
        title: 'Churned Members',
        value: formatNumber(churnedCur),
        rawValue: churnedCur,
        change: calcGrowth(churnedCur, churnedPrev).rate,
        changeDetails: calcGrowth(churnedCur, churnedPrev),
        previousValue: formatNumber(churnedPrev),
        previousRawValue: churnedPrev,
        periodLabel,
        icon: 'AlertTriangle',
        description: `${formatPercentage(churnRateCur)} churn rate`,
      },
      {
        title: 'Frozen Members',
        value: formatNumber(frozenCur),
        rawValue: frozenCur,
        change: calcGrowth(frozenCur, frozenPrev).rate,
        changeDetails: calcGrowth(frozenCur, frozenPrev),
        previousValue: formatNumber(frozenPrev),
        previousRawValue: frozenPrev,
        periodLabel,
        icon: 'Clock',
        description: `${formatPercentage(frozenRateCur)} of total memberships`,
      },
      {
        title: 'Revenue Impact',
        value: `₹${formatNumber(churnLossCur)}`,
        rawValue: churnLossCur,
        change: calcGrowth(churnLossCur, churnLossPrev).rate,
        changeDetails: calcGrowth(churnLossCur, churnLossPrev),
        previousValue: `₹${formatNumber(churnLossPrev)}`,
        previousRawValue: churnLossPrev,
        periodLabel,
        icon: 'TrendingUp',
        description: `Loss from churned members`,
      },
    ];

    return { metrics };
  }, [data, historicalData, options?.dateRange?.start, options?.dateRange?.end]);
}
