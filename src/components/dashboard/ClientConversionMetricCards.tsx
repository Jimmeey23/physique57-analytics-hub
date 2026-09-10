import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Target, TrendingUp, DollarSign, Clock, UserCheck, Award, UserPlus, ArrowRight, CalendarDays, Repeat, TrendingDown, ShoppingBag, AlertTriangle, HeartHandshake, UserX } from 'lucide-react';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { NewClientData } from '@/types/dashboard';
import { useClientConversionMetrics, ClientMetricWithYoY } from '@/hooks/useClientConversionMetrics';
import { cn } from '@/lib/utils';
import { parseDate } from '@/utils/dateUtils';
import { isConvertedInCohort, isInNewClientCohort, isRetainedInCohort } from '@/utils/clientRetention';

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
  const isRepeatBuyer = (c: NewClientData) => isConvertedInCohort(c) && (c.purchaseCountPostTrial || 0) >= 2;
  const pctGrowth = (cur: number, prev: number) => prev > 0 ? Math.round(((cur - prev) / prev) * 100) : (cur > 0 ? 100 : 0);
  const repeatRateOf = (arr: NewClientData[]) => {
    const converted = arr.filter(isConvertedInCohort).length;
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
            return data.filter(client => isInNewClientCohort(client));
          case 'Converted Members':
            return data.filter(client => isConvertedInCohort(client));
          case 'Retained Members':
            return data.filter(client => isRetainedInCohort(client));
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

  return (
    <div className="min-w-0">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {metricCards.map((metric, index) => {
          const Icon = metric.icon;
          const change = typeof metric.change === 'number' ? metric.change : 0;
          const isPositive = change > 0;
          const isSignificant = Math.abs(change) >= 5;
          
          return (
            <Card
              key={index}
              className={cn(
                "group relative overflow-hidden cursor-pointer transition-all duration-200 h-full flex flex-col",
                "bg-white hover:bg-gradient-to-br hover:from-slate-900 hover:via-slate-900 hover:to-slate-950",
                "border border-slate-200 hover:border-slate-800 border-t-4",
                "shadow-sm hover:shadow-md",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500",
                index % 4 === 0 && "border-t-emerald-500",
                index % 4 === 1 && "border-t-blue-500",
                index % 4 === 2 && "border-t-purple-500",
                index % 4 === 3 && "border-t-rose-500",
                onCardClick && "hover:cursor-pointer"
              )}
              role={onCardClick ? 'button' : undefined}
              tabIndex={onCardClick ? 0 : undefined}
              aria-label={onCardClick ? `View ${metric.title} details` : undefined}
              onKeyDown={(event) => {
                if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
                  event.preventDefault();
                  onCardClick?.(metric.title, metric.filterData(), metric.metricType);
                }
              }}
              onClick={() => onCardClick?.(metric.title, metric.filterData(), metric.metricType)}
            >
              <CardContent className="p-5 relative flex-1 flex flex-col">
                <div className={cn(
                  "absolute inset-0 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-200",
                  index % 4 === 0 && "bg-gradient-to-br from-emerald-500 to-teal-500",
                  index % 4 === 1 && "bg-gradient-to-br from-blue-500 to-cyan-500",
                  index % 4 === 2 && "bg-gradient-to-br from-purple-500 to-pink-500",
                  index % 4 === 3 && "bg-gradient-to-br from-rose-500 to-orange-500"
                )} />

                <div className="absolute top-3 right-3 opacity-[0.08] group-hover:opacity-[0.15] transition-all duration-700 ease-out group-hover:scale-110 group-hover:rotate-6">
                  <Icon className="w-20 h-20 text-slate-900 group-hover:text-white" />
                </div>

                <div className="absolute inset-0 opacity-[0.02] group-hover:opacity-[0.04] transition-opacity duration-200"
                     style={{backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px'}} />

                <div className="relative z-10 space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        "p-2.5 rounded-xl shadow-sm transition-all duration-200 group-hover:scale-110 group-hover:shadow-md",
                        index % 4 === 0 && "bg-gradient-to-br from-emerald-500/15 to-emerald-600/10 text-emerald-700 group-hover:from-emerald-500/25 group-hover:to-emerald-600/20 group-hover:text-emerald-400 group-hover:shadow-emerald-500/20",
                        index % 4 === 1 && "bg-gradient-to-br from-blue-500/15 to-blue-600/10 text-blue-700 group-hover:from-blue-500/25 group-hover:to-blue-600/20 group-hover:text-blue-400 group-hover:shadow-blue-500/20",
                        index % 4 === 2 && "bg-gradient-to-br from-purple-500/15 to-purple-600/10 text-purple-700 group-hover:from-purple-500/25 group-hover:to-purple-600/20 group-hover:text-purple-400 group-hover:shadow-purple-500/20",
                        index % 4 === 3 && "bg-gradient-to-br from-rose-500/15 to-rose-600/10 text-rose-700 group-hover:from-rose-500/25 group-hover:to-rose-600/20 group-hover:text-rose-400 group-hover:shadow-rose-500/20"
                      )}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className={cn(
                          "font-bold text-sm text-slate-700 transition-all duration-200 leading-tight",
                          "group-hover:text-white group-hover:underline group-hover:underline-offset-4 group-hover:decoration-2",
                          index % 4 === 0 && "group-hover:decoration-emerald-400",
                          index % 4 === 1 && "group-hover:decoration-blue-400",
                          index % 4 === 2 && "group-hover:decoration-purple-400",
                          index % 4 === 3 && "group-hover:decoration-rose-400"
                        )}>
                          {metric.title}
                        </h3>
                        <p className="text-[9px] text-slate-500 group-hover:text-slate-400 transition-colors duration-200 mt-0.5 uppercase tracking-wide font-semibold">
                          Current Period
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={cn(
                    "p-2.5 rounded-lg transition-all duration-200",
                    "bg-slate-50 group-hover:bg-slate-800/30",
                    "border border-slate-100 group-hover:border-slate-700/50"
                  )}>
                    <p className="text-3xl font-bold text-slate-900 group-hover:text-white transition-colors duration-200 tracking-tight">
                      {metric.value}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={cn(
                        "h-0.5 flex-1 rounded-full transition-all duration-200",
                        metric.change > 0 && "bg-emerald-200 group-hover:bg-emerald-500/40",
                        metric.change < 0 && "bg-rose-200 group-hover:bg-rose-500/40",
                        metric.change === 0 && "bg-slate-200 group-hover:bg-slate-500/40"
                      )} />
                      <div className="flex items-center gap-1">
                        {metric.change > 0 && <TrendingUp className="w-3 h-3 text-emerald-600 group-hover:text-emerald-400" />}
                        {metric.change < 0 && <TrendingDown className="w-3 h-3 text-rose-600 group-hover:text-rose-400" />}
                        {metric.change === 0 && <TrendingDown className="w-3 h-3 text-slate-600 group-hover:text-slate-400" />}
                        <span className={cn(
                          "text-[10px] font-bold transition-colors duration-200",
                          metric.change > 0 && "text-emerald-600 group-hover:text-emerald-400",
                          metric.change < 0 && "text-rose-600 group-hover:text-rose-400",
                          metric.change === 0 && "text-slate-600 group-hover:text-slate-400"
                        )}>
                          {metric.changeDetails?.trend || (metric.change > 0 ? 'up' : metric.change < 0 ? 'down' : 'stable')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-auto">
                    <div className={cn(
                      "p-2.5 rounded-lg border transition-all duration-200 min-h-[100px] flex flex-col justify-between",
                      "bg-white/50 group-hover:bg-slate-800/20",
                      "border-slate-200 group-hover:border-slate-700/50"
                    )}>
                      <div className="text-[9px] font-bold text-slate-500 group-hover:text-slate-400 uppercase tracking-wider mb-1 transition-colors duration-200">
                        Month over Month
                      </div>
                      <div className="flex items-baseline gap-1.5 mb-1.5">
                        <span className="text-sm font-bold text-slate-700 group-hover:text-white transition-colors duration-200 tabular-nums">
                          {metric.previousValue}
                        </span>
                        <span className="text-[8px] text-slate-400 group-hover:text-slate-500 transition-colors duration-200">prev</span>
                      </div>
                      <div className={cn(
                        "inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg font-bold text-[11px] tabular-nums transition-all duration-200 min-w-[65px]",
                        metric.change > 0 && "bg-emerald-900/90 text-white group-hover:bg-emerald-800 group-hover:shadow-lg group-hover:shadow-emerald-900/40",
                        metric.change < 0 && "bg-rose-900/90 text-white group-hover:bg-rose-800 group-hover:shadow-lg group-hover:shadow-rose-900/40",
                        metric.change === 0 && "bg-slate-700/90 text-white group-hover:bg-slate-600 group-hover:shadow-lg"
                      )}>
                        {metric.change > 0 && <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" />}
                        {metric.change < 0 && <TrendingDown className="w-3.5 h-3.5 flex-shrink-0" />}
                        <span>{metric.change > 0 ? '+' : ''}{Math.round(metric.change || 0)}%</span>
                      </div>
                    </div>

                    <div className={cn(
                      "p-2.5 rounded-lg border transition-all duration-200 min-h-[100px] flex flex-col justify-between",
                      metric.yoyChange !== undefined 
                        ? "bg-white/50 group-hover:bg-slate-800/20 border-slate-200 group-hover:border-slate-700/50"
                        : "bg-slate-50/50 group-hover:bg-slate-800/10 border-slate-200 group-hover:border-slate-700/30"
                    )}>
                      {(metric.yoyPreviousValue !== undefined || metric.comparison?.previous !== undefined) ? (
                        <>
                          <div className="text-[9px] font-bold text-slate-500 group-hover:text-slate-400 uppercase tracking-wider mb-1 transition-colors duration-200">
                            Year over Year
                          </div>
                          <div className="flex items-baseline gap-1.5 mb-1.5">
                            <span className="text-sm font-bold text-slate-700 group-hover:text-white transition-colors duration-200 tabular-nums">
                              {metric.yoyPreviousValue ?? (
                                metric.comparison?.previous !== undefined ? (
                                  // Fallback formatting based on metric type
                                  (metric.title.toLowerCase().includes('rate') || metric.title.toLowerCase().includes('conversion'))
                                    ? formatPercentage(metric.comparison.previous)
                                    : metric.title.toLowerCase().includes('ltv') || metric.title.toLowerCase().includes('revenue')
                                      ? formatCurrency(metric.comparison.previous)
                                      : formatNumber(metric.comparison.previous)
                                ) : '—'
                              )}
                            </span>
                            <span className="text-[8px] text-slate-400 group-hover:text-slate-500 transition-colors duration-200">last year</span>
                          </div>
                          <div className={cn(
                            "inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg font-bold text-[11px] tabular-nums transition-all duration-200 min-w-[65px]",
                            metric.yoyChange > 0 && "bg-emerald-900/90 text-white group-hover:bg-emerald-800 group-hover:shadow-lg group-hover:shadow-emerald-900/40",
                            metric.yoyChange < 0 && "bg-rose-900/90 text-white group-hover:bg-rose-800 group-hover:shadow-lg group-hover:shadow-rose-900/40",
                            metric.yoyChange === 0 && "bg-slate-700/90 text-white group-hover:bg-slate-600 group-hover:shadow-lg"
                          )}>
                            {metric.yoyChange > 0 && <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" />}
                            {metric.yoyChange < 0 && <TrendingDown className="w-3.5 h-3.5 flex-shrink-0" />}
                            <span>{metric.yoyChange > 0 ? '+' : ''}{Math.round(metric.yoyChange || 0)}%</span>
                          </div>
                        </>
                      ) : (
                        <span className="text-[9px] text-slate-400 group-hover:text-slate-500 transition-colors duration-200 font-semibold">
                          No YoY Data
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={cn(
                    "relative pt-1.5 transition-all duration-200"
                  )}>
                    <p className="text-xs text-slate-600 group-hover:text-slate-300 leading-snug transition-colors duration-200 line-clamp-2 font-medium">
                      {metric.description}
                    </p>
                  </div>

                  <div className={cn(
                    "pt-2 space-y-2 border-t transition-all duration-200 overflow-hidden",
                    "max-h-0 opacity-0 group-hover:max-h-40 group-hover:opacity-100",
                    index % 4 === 0 && "border-emerald-200 group-hover:border-emerald-500/30",
                    index % 4 === 1 && "border-blue-200 group-hover:border-blue-500/30",
                    index % 4 === 2 && "border-purple-200 group-hover:border-purple-500/30",
                    index % 4 === 3 && "border-rose-200 group-hover:border-rose-500/30"
                  )}>
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Trend:</span>
                        <span className="text-white font-semibold">{metric.changeDetails?.trend || ''}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Difference:</span>
                        <span className="text-white font-semibold">{Math.abs(metric.comparison?.difference || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

// Memoize to prevent unnecessary re-renders
export const ClientConversionMetricCards = React.memo(ClientConversionMetricCardsComponent);

// Temporary fix for Icon component type
const Icon = ({ className }: { className?: string }) => <svg className={className}></svg>; // Updated to accept optional className
