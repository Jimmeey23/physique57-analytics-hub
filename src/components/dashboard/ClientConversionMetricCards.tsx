import React from 'react';
import { Users, Target, TrendingUp, DollarSign, UserCheck, Award, UserPlus, CalendarDays, Repeat, ShoppingBag, AlertTriangle, HeartHandshake, UserX, type LucideIcon } from 'lucide-react';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { NewClientData } from '@/types/dashboard';
import { useClientConversionMetrics, ClientMetricWithYoY } from '@/hooks/useClientConversionMetrics';
import { parseDate } from '@/utils/dateUtils';
import { isConverted, isNewClient, isRetained } from '@/utils/clientRetention';
import { MetricCard, MetricGrid } from '@/components/ui/MetricCard';

interface ClientConversionMetricCardsProps {
  data: NewClientData[];
  historicalData?: NewClientData[];
  dateRange?: { start?: string | Date; end?: string | Date };
  onCardClick?: (title: string, data: NewClientData[], metricType: string) => void;
}

  const computeAvgForRange = (arr: NewClientData[], field: 'conversionSpan' | 'visitsPostTrial') => {
    const filteredData = arr.filter(c => c[field] !== undefined && c[field] !== null && c[field] >= 0);
    if (filteredData.length === 0) return 0;
    const sum = filteredData.reduce((s, c) => s + (c[field] || 0), 0);
    return sum / filteredData.length;
  };

  // ---- Cohort helpers for the extended retention metrics (fuzzy sheet-status matching) ----
  const statusOf = (c: NewClientData) => String(c.retentionStatus || '').toLowerCase();
  const isReactivatedStatus = (c: NewClientData) => /reactivat|rejoin|win.?back|returning|re-?engag/.test(statusOf(c));
  const isAtRiskStatus = (c: NewClientData) => !isReactivatedStatus(c) && /at.?risk|dormant|inactive|lapsing|slipping|cooling/.test(statusOf(c));
  const isChurnedStatus = (c: NewClientData) => !isReactivatedStatus(c) && !isAtRiskStatus(c) && /churn|lost|cancel|lapsed|expir|dropped|terminat|dead/.test(statusOf(c));
  const isRepeatBuyer = (c: NewClientData) => isConverted(c) && (c.purchaseCountPostTrial || 0) >= 2;
  const pctGrowth = (cur: number, prev: number) => prev > 0 ? Math.round(((cur - prev) / prev) * 100) : (cur > 0 ? 100 : 0);
  const repeatRateOf = (arr: NewClientData[]) => {
    const converted = arr.filter(isConverted).length;
    if (converted === 0) return 0;
    return (arr.filter(isRepeatBuyer).length / converted) * 100;
  };
  const churnVisitsAvgOf = (arr: NewClientData[]) => {
    const churned = arr.filter(c => isChurnedStatus(c) && (c.visitsPostTrial || 0) > 0);
    if (churned.length === 0) return 0;
    return churned.reduce((sum, c) => sum + (c.visitsPostTrial || 0), 0) / churned.length;
  };

const ClientConversionMetricCardsComponent: React.FC<ClientConversionMetricCardsProps> = ({ data, historicalData, dateRange, onCardClick }) => {
  const { metrics } = useClientConversionMetrics(data, historicalData, { dateRange });

  
  // Calculate additional metrics
  const avgConversionTime = React.useMemo(() => {
    const withSpan = data.filter(c => c.conversionSpan && c.conversionSpan > 0);
    if (withSpan.length === 0) return 0;
    return withSpan.reduce((sum, c) => sum + (c.conversionSpan || 0), 0) / withSpan.length;
  }, [data]);

  const avgVisitsPostTrial = React.useMemo(() => {
    const withVisits = data.filter(c => c.visitsPostTrial && c.visitsPostTrial > 0);
    if (withVisits.length === 0) return 0;
    return withVisits.reduce((sum, c) => sum + (c.visitsPostTrial || 0), 0) / withVisits.length;
  }, [data]);

  // For the two special metrics, compute previous period and YoY values using `historicalData` (which should be the filtered historical set)


  const getRangeAnchors = () => {
    const compareEnd = dateRange?.end ? (typeof dateRange.end === 'string' ? parseDate(dateRange.end) : dateRange.end as Date) || new Date() : new Date();
    const monthStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    const currentStart = monthStart(compareEnd);
    const prevAnchor = new Date(currentStart.getFullYear(), currentStart.getMonth() - 1, 15);
    const prevStart = monthStart(prevAnchor);
    const prevEnd = monthEnd(prevAnchor);
    const prevYearAnchor = new Date(currentStart.getFullYear() - 1, currentStart.getMonth(), 15);
    const prevYearStart = monthStart(prevYearAnchor);
    const prevYearEnd = monthEnd(prevYearAnchor);
    return { prevStart, prevEnd, prevYearStart, prevYearEnd };
  };

  const { prevStart, prevEnd, prevYearStart, prevYearEnd } = getRangeAnchors();

  const prevPeriodData = React.useMemo(() => {
    if (!historicalData) return [] as typeof data;
    return historicalData.filter(it => {
      const d = parseDate(it.firstVisitDate);
      return d && d >= prevStart && d <= prevEnd;
    });
  }, [historicalData, prevStart, prevEnd]);

  const prevYearData = React.useMemo(() => {
    if (!historicalData) return [] as typeof data;
    return historicalData.filter(it => {
      const d = parseDate(it.firstVisitDate);
      return d && d >= prevYearStart && d <= prevYearEnd;
    });
  }, [historicalData, prevYearStart, prevYearEnd]);

  const avgConversionTimePrev = React.useMemo(() => computeAvgForRange(prevPeriodData, 'conversionSpan'), [prevPeriodData]);
  const avgConversionTimeYoY = React.useMemo(() => computeAvgForRange(prevYearData, 'conversionSpan'), [prevYearData]);

  const avgVisitsPostTrialPrev = React.useMemo(() => computeAvgForRange(prevPeriodData, 'visitsPostTrial'), [prevPeriodData]);
  const avgVisitsPostTrialYoY = React.useMemo(() => computeAvgForRange(prevYearData, 'visitsPostTrial'), [prevYearData]);

  // Extended retention metrics (current / previous-period / YoY splits)
  const repeatRate = React.useMemo(() => repeatRateOf(data), [data]);
  const repeatRatePrev = React.useMemo(() => repeatRateOf(prevPeriodData), [prevPeriodData]);
  const repeatRateYoY = React.useMemo(() => repeatRateOf(prevYearData), [prevYearData]);
  const atRiskCount = React.useMemo(() => data.filter(isAtRiskStatus).length, [data]);
  const atRiskPrev = React.useMemo(() => prevPeriodData.filter(isAtRiskStatus).length, [prevPeriodData]);
  const atRiskYoY = React.useMemo(() => prevYearData.filter(isAtRiskStatus).length, [prevYearData]);
  const reactivatedCount = React.useMemo(() => data.filter(isReactivatedStatus).length, [data]);
  const reactivatedPrev = React.useMemo(() => prevPeriodData.filter(isReactivatedStatus).length, [prevPeriodData]);
  const reactivatedYoY = React.useMemo(() => prevYearData.filter(isReactivatedStatus).length, [prevYearData]);
  const churnVisitsAvg = React.useMemo(() => churnVisitsAvgOf(data), [data]);
  const churnVisitsPrev = React.useMemo(() => churnVisitsAvgOf(prevPeriodData), [prevPeriodData]);
  const churnVisitsYoY = React.useMemo(() => churnVisitsAvgOf(prevYearData), [prevYearData]);

  const iconMap: Record<string, typeof Users> = {
    'New Members': UserPlus,
    'Converted Members': Award,
    'Retained Members': UserCheck,
    'Conversion Rate': TrendingUp,
    'Retention Rate': Target,
    'Avg LTV': DollarSign,
    'Avg Conversion Time': CalendarDays,
    'Avg Visits Post-Trial': Repeat,
  };
  
  const metricCards: ClientMetricWithYoY[] = [
    ...metrics.map(m => ({
      title: m.title,
      value: m.value,
      icon: iconMap[m.title] || Users,
      gradient: 'from-slate-700 to-slate-800',
      description: m.description,
      change: m.change,
      previousValue: m.previousValue,
      period: m.periodLabel || 'vs previous month',
      metricType: m.title.toLowerCase().replace(/\s+/g, '_'),
      // Include YoY fields from the underlying metrics so cards can render them
      yoyPreviousValue: m.yoyPreviousValue,
      yoyPreviousRawValue: m.yoyPreviousRawValue,
      yoyChange: m.yoyChange,
      comparison: m.comparison,
      changeDetails: m.changeDetails,
      filterData: () => {
        switch (m.title) {
          case 'New Members':
            return data.filter(client => isNewClient(client));
          case 'Converted Members':
            return data.filter(client => isConverted(client));
          case 'Retained Members':
            return data.filter(client => isRetained(client));
          default:
            return data;
        }
      }
    } as ClientMetricWithYoY)),
    {
      title: 'Avg Conversion Time',
      value: `${Math.round(avgConversionTime)} days`,
      rawValue: avgConversionTime,
      icon: CalendarDays,
      gradient: 'from-slate-700 to-slate-800',
      description: 'Average days to convert',
      change: avgConversionTimePrev > 0 ? Math.round(((avgConversionTime - avgConversionTimePrev) / (avgConversionTimePrev || 1)) * 100) : 0,
      previousValue: `${Math.round(avgConversionTimePrev)} days`,
      period: '',
      metricType: 'avg_conversion_time',
      yoyPreviousValue: prevYearData.length > 0 ? `${Math.round(avgConversionTimeYoY)} days` : undefined,
      yoyPreviousRawValue: avgConversionTimeYoY,
      yoyChange: prevYearData.length > 0 ? (avgConversionTimeYoY === 0 ? (avgConversionTime > 0 ? 100 : 0) : Math.round(((avgConversionTime - avgConversionTimeYoY) / (avgConversionTimeYoY || 1)) * 100)) : undefined,
      comparison: { current: avgConversionTime, previous: avgConversionTimeYoY || 0, difference: avgConversionTime - (avgConversionTimeYoY || 0) },
      changeDetails: {
        rate: avgConversionTimePrev > 0 ? Math.round(((avgConversionTime - avgConversionTimePrev) / (avgConversionTimePrev || 1)) * 100) : 0,
        isSignificant: Math.abs(avgConversionTime - avgConversionTimePrev) > 1,
        trend: avgConversionTime > avgConversionTimePrev ? 'moderate' : 'weak'
      },
      filterData: () => data.filter(c => c.conversionSpan && c.conversionSpan > 0)
    } as ClientMetricWithYoY,
    {
      title: 'Avg Visits Post-Trial',
      value: avgVisitsPostTrial.toFixed(1),
      rawValue: avgVisitsPostTrial,
      icon: Repeat,
      gradient: 'from-slate-700 to-slate-800',
      description: 'Average visits after trial',
      change: avgVisitsPostTrialPrev > 0 ? Math.round(((avgVisitsPostTrial - avgVisitsPostTrialPrev) / (avgVisitsPostTrialPrev || 1)) * 100) : 0,
      previousValue: avgVisitsPostTrialPrev.toFixed(1),
      yoyPreviousValue: prevYearData.length > 0 ? avgVisitsPostTrialYoY.toFixed(1) : undefined,
      yoyPreviousRawValue: avgVisitsPostTrialYoY,
      yoyChange: prevYearData.length > 0 ? (avgVisitsPostTrialYoY === 0 ? (avgVisitsPostTrial > 0 ? 100 : 0) : Math.round(((avgVisitsPostTrial - avgVisitsPostTrialYoY) / (avgVisitsPostTrialYoY || 1)) * 100)) : undefined,
      comparison: { current: avgVisitsPostTrial, previous: avgVisitsPostTrialYoY || 0, difference: avgVisitsPostTrial - (avgVisitsPostTrialYoY || 0) },
      changeDetails: {
        rate: avgVisitsPostTrialPrev > 0 ? Math.round(((avgVisitsPostTrial - avgVisitsPostTrialPrev) / (avgVisitsPostTrialPrev || 1)) * 100) : 0,
        isSignificant: Math.abs(avgVisitsPostTrial - avgVisitsPostTrialPrev) > 0.1,
        trend: avgVisitsPostTrial > avgVisitsPostTrialPrev ? 'moderate' : 'weak'
      },
      filterData: () => data.filter(c => c.visitsPostTrial && c.visitsPostTrial > 0)
    } as ClientMetricWithYoY,
    {
      title: 'Repeat Purchase Rate',
      value: formatPercentage(repeatRate),
      rawValue: repeatRate,
      previousRawValue: repeatRatePrev,
      icon: ShoppingBag,
      gradient: 'from-slate-700 to-slate-800',
      description: 'Converted clients buying again',
      change: pctGrowth(repeatRate, repeatRatePrev),
      previousValue: formatPercentage(repeatRatePrev),
      period: 'vs previous month',
      metricType: 'repeat_purchase_rate',
      yoyPreviousValue: prevYearData.length > 0 ? formatPercentage(repeatRateYoY) : undefined,
      yoyPreviousRawValue: repeatRateYoY,
      yoyChange: prevYearData.length > 0 ? pctGrowth(repeatRate, repeatRateYoY) : undefined,
      comparison: { current: repeatRate, previous: repeatRateYoY || 0, difference: repeatRate - (repeatRateYoY || 0) },
      changeDetails: {
        rate: pctGrowth(repeatRate, repeatRatePrev),
        isSignificant: Math.abs(repeatRate - repeatRatePrev) > 1,
        trend: repeatRate > repeatRatePrev ? 'moderate' : 'weak'
      },
      filterData: () => data.filter(isRepeatBuyer)
    } as ClientMetricWithYoY,
    {
      title: 'At-Risk Members',
      value: formatNumber(atRiskCount),
      rawValue: atRiskCount,
      previousRawValue: atRiskPrev,
      icon: AlertTriangle,
      gradient: 'from-slate-700 to-slate-800',
      description: data.length > 0 ? `${((atRiskCount / data.length) * 100).toFixed(1)}% of clients need attention` : 'Clients showing churn signals',
      change: pctGrowth(atRiskCount, atRiskPrev),
      previousValue: formatNumber(atRiskPrev),
      period: 'vs previous month',
      metricType: 'at_risk_members',
      yoyPreviousValue: prevYearData.length > 0 ? formatNumber(atRiskYoY) : undefined,
      yoyPreviousRawValue: atRiskYoY,
      yoyChange: prevYearData.length > 0 ? pctGrowth(atRiskCount, atRiskYoY) : undefined,
      comparison: { current: atRiskCount, previous: atRiskYoY || 0, difference: atRiskCount - (atRiskYoY || 0) },
      changeDetails: {
        rate: pctGrowth(atRiskCount, atRiskPrev),
        isSignificant: Math.abs(atRiskCount - atRiskPrev) >= 5,
        trend: atRiskCount > atRiskPrev ? 'moderate' : 'weak'
      },
      filterData: () => data.filter(isAtRiskStatus)
    } as ClientMetricWithYoY,
    ...(reactivatedCount > 0 ? [{
      title: 'Reactivated Members',
      value: formatNumber(reactivatedCount),
      rawValue: reactivatedCount,
      previousRawValue: reactivatedPrev,
      icon: HeartHandshake,
      gradient: 'from-slate-700 to-slate-800',
      description: 'Won-back clients this period',
      change: pctGrowth(reactivatedCount, reactivatedPrev),
      previousValue: formatNumber(reactivatedPrev),
      period: 'vs previous month',
      metricType: 'reactivated_members',
      yoyPreviousValue: prevYearData.length > 0 ? formatNumber(reactivatedYoY) : undefined,
      yoyPreviousRawValue: reactivatedYoY,
      yoyChange: prevYearData.length > 0 ? pctGrowth(reactivatedCount, reactivatedYoY) : undefined,
      comparison: { current: reactivatedCount, previous: reactivatedYoY || 0, difference: reactivatedCount - (reactivatedYoY || 0) },
      changeDetails: {
        rate: pctGrowth(reactivatedCount, reactivatedPrev),
        isSignificant: Math.abs(reactivatedCount - reactivatedPrev) >= 3,
        trend: reactivatedCount > reactivatedPrev ? 'moderate' : 'weak'
      },
      filterData: () => data.filter(isReactivatedStatus)
    } as ClientMetricWithYoY] : []),
    {
      title: 'Avg Visits Before Churn',
      value: churnVisitsAvg.toFixed(1),
      rawValue: churnVisitsAvg,
      previousRawValue: churnVisitsPrev,
      icon: UserX,
      gradient: 'from-slate-700 to-slate-800',
      description: 'Avg visits of churned clients',
      change: pctGrowth(churnVisitsAvg, churnVisitsPrev),
      previousValue: churnVisitsPrev.toFixed(1),
      period: 'vs previous month',
      metricType: 'avg_visits_before_churn',
      yoyPreviousValue: prevYearData.length > 0 ? churnVisitsYoY.toFixed(1) : undefined,
      yoyPreviousRawValue: churnVisitsYoY,
      yoyChange: prevYearData.length > 0 ? pctGrowth(churnVisitsAvg, churnVisitsYoY) : undefined,
      comparison: { current: churnVisitsAvg, previous: churnVisitsYoY || 0, difference: churnVisitsAvg - (churnVisitsYoY || 0) },
      changeDetails: {
        rate: pctGrowth(churnVisitsAvg, churnVisitsPrev),
        isSignificant: Math.abs(churnVisitsAvg - churnVisitsPrev) > 0.5,
        trend: churnVisitsAvg > churnVisitsPrev ? 'moderate' : 'weak'
      },
      filterData: () => data.filter(c => isChurnedStatus(c) && (c.visitsPostTrial || 0) > 0)
    } as ClientMetricWithYoY
  ];

  const formatYoyFallback = (metric: ClientMetricWithYoY): string => {
    const prev = metric.comparison?.previous;
    if (prev === undefined) return '—';
    const title = metric.title.toLowerCase();
    if (title.includes('rate') || title.includes('conversion')) return formatPercentage(prev);
    if (title.includes('ltv') || title.includes('revenue')) return formatCurrency(prev);
    return formatNumber(prev);
  };

  return (
    <MetricGrid cols={4}>
      {metricCards.map((metric) => {
        const Icon = metric.icon as LucideIcon;
        const change = typeof metric.change === 'number' ? metric.change : 0;
        const yoyValue = metric.yoyPreviousValue ?? formatYoyFallback(metric);
        const yoyChange = typeof metric.yoyChange === 'number' ? metric.yoyChange : null;
        return (
          <MetricCard
            key={metric.title}
            label={metric.title}
            value={metric.value}
            sub={metric.description}
            icon={Icon}
            delta={{
              value: `${change > 0 ? '+' : ''}${Math.round(change)}%`,
              tone: change > 0 ? 'up' : change < 0 ? 'down' : 'flat',
            }}
            details={
              <span className="space-y-1">
                <span className="block">
                  MoM: <strong>{metric.previousValue}</strong> ({change > 0 ? '+' : ''}{Math.round(change)}%)
                </span>
                <span className="block">
                  YoY: <strong>{yoyValue}</strong>
                  {yoyChange !== null && yoyValue !== '—' && (
                    <> ({yoyChange > 0 ? '+' : ''}{Math.round(yoyChange)}%)</>
                  )}
                </span>
                <span className="block text-muted-foreground">
                  Trend: {metric.changeDetails?.trend || '—'} · Δ {Math.abs(metric.comparison?.difference || 0)}
                </span>
              </span>
            }
            detailsTitle="Period comparison"
            onSelect={
              onCardClick
                ? () => onCardClick(metric.title, metric.filterData?.() ?? data, metric.metricType ?? '')
                : undefined
            }
          />
        );
      })}
    </MetricGrid>
  );
};

// Memoize to prevent unnecessary re-renders
export const ClientConversionMetricCards = React.memo(ClientConversionMetricCardsComponent);
