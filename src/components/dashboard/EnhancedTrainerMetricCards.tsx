import React from 'react';
import {
  Users,
  Activity,
  DollarSign,
  Target,
  TrendingUp,
  Zap,
  Award,
  BarChart3,
  Gauge,
  CalendarX,
  AlarmClock,
  UserX
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { ProcessedTrainerData } from './TrainerDataProcessor';
import { SessionData } from '@/hooks/useSessionsData';
import { parseDate } from '@/utils/dateUtils';
import { MetricCard, MetricGrid } from '@/components/ui/MetricCard';

interface EnhancedTrainerMetricCardsProps {
  data: ProcessedTrainerData[];
  /** Raw sessions for reliability metrics; scoped to the in-scope trainers/locations/months. */
  sessions?: SessionData[];
  onCardClick?: (title: string, data: any) => void;
}

export const EnhancedTrainerMetricCards: React.FC<EnhancedTrainerMetricCardsProps> = ({ data, sessions, onCardClick }) => {
  const summaryStats = React.useMemo(() => {
    if (!data.length) return null;

    const totalTrainers = new Set(data.map(d => d.trainerName)).size;
    const totalSessions = data.reduce((sum, d) => sum + d.totalSessions, 0);
    const totalRevenue = data.reduce((sum, d) => sum + d.totalPaid, 0);
    const totalCustomers = data.reduce((sum, d) => sum + d.totalCustomers, 0);
    const avgClassSize = totalSessions > 0 ? totalCustomers / totalSessions : 0;
    const avgRevenue = totalTrainers > 0 ? totalRevenue / totalTrainers : 0;
    const avgRevenuePerSession = totalSessions > 0 ? totalRevenue / totalSessions : 0;
    
    // Calculate utilization rate (non-empty sessions / total sessions)
    const totalNonEmptySessions = data.reduce((sum, d) => sum + d.nonEmptySessions, 0);
    const utilizationRate = totalSessions > 0 ? (totalNonEmptySessions / totalSessions) * 100 : 0;

    // Calculate weighted conversion and retention rates (by new members)
    const totalNewMembers = data.reduce((sum, d) => sum + (d.newMembers || 0), 0);
    const totalConverted = data.reduce((sum, d) => sum + (d.convertedMembers || 0), 0);
    const totalRetained = data.reduce((sum, d) => sum + (d.retainedMembers || 0), 0);
    const avgConversionRate = totalNewMembers > 0 ? (totalConverted / totalNewMembers) * 100 : 0;
    const avgRetentionRate = totalNewMembers > 0 ? (totalRetained / totalNewMembers) * 100 : 0;

    // ---- Fill & class-quality metrics (payroll scope) ----
    const totalCapacity = data.reduce((sum, d) => sum + (d.capacity || 0), 0);
    const fillRate = totalCapacity > 0 ? (totalCustomers / totalCapacity) * 100 : 0;
    const totalEmptySessions = data.reduce((sum, d) => sum + (d.emptySessions || 0), 0);
    const emptySessionRate = totalSessions > 0 ? (totalEmptySessions / totalSessions) * 100 : 0;

    // Month-over-month deltas for the new cards (latest vs previous in-scope month)
    const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const monthKeyOf = (label: string) => {
      const m = String(label || '').match(/^([A-Za-z]+)-(\d{4})$/);
      if (!m) return null;
      const idx = MONTHS.indexOf(m[1].slice(0, 3).toLowerCase());
      if (idx < 0) return null;
      return Number(m[2]) * 12 + idx;
    };
    const monthKeys = Array.from(new Set(data.map(d => monthKeyOf(d.monthYear)).filter((k): k is number => k !== null))).sort((a, b) => b - a);
    const latestKey = monthKeys[0] ?? null;
    const prevKey = monthKeys[1] ?? null;
    const rowsIn = (key: number | null) => (key === null ? [] : data.filter(d => monthKeyOf(d.monthYear) === key));
    const fillOf = (rows: ProcessedTrainerData[]) => {
      const cap = rows.reduce((sum, d) => sum + (d.capacity || 0), 0);
      const cust = rows.reduce((sum, d) => sum + d.totalCustomers, 0);
      return cap > 0 ? (cust / cap) * 100 : 0;
    };
    const emptyOf = (rows: ProcessedTrainerData[]) => {
      const sess = rows.reduce((sum, d) => sum + d.totalSessions, 0);
      const empty = rows.reduce((sum, d) => sum + (d.emptySessions || 0), 0);
      return sess > 0 ? (empty / sess) * 100 : 0;
    };
    const sizeOf = (rows: ProcessedTrainerData[]) => {
      const sess = rows.reduce((sum, d) => sum + d.totalSessions, 0);
      const cust = rows.reduce((sum, d) => sum + d.totalCustomers, 0);
      return sess > 0 ? cust / sess : 0;
    };
    const fillMom = latestKey !== null && prevKey !== null ? fillOf(rowsIn(latestKey)) - fillOf(rowsIn(prevKey)) : null;
    const emptyMom = latestKey !== null && prevKey !== null ? emptyOf(rowsIn(latestKey)) - emptyOf(rowsIn(prevKey)) : null;
    const sizeMom = latestKey !== null && prevKey !== null ? sizeOf(rowsIn(latestKey)) - sizeOf(rowsIn(prevKey)) : null;

    // ---- Reliability metrics (sessions scope, matched to in-scope trainer/location/month) ----
    const sessionMonthLabel = (dateStr: string) => {
      const d = parseDate(dateStr);
      if (!d || isNaN(d.getTime())) return '';
      return `${d.toLocaleDateString('en-US', { month: 'short' })}-${d.getFullYear()}`;
    };
    const scopeKeys = new Set(data.map(d => `${d.trainerName}|${d.location || ''}|${d.monthYear}`));
    const scopedSessions = (sessions || []).filter(sv =>
      scopeKeys.has(`${sv.trainerName}|${sv.location || ''}|${sessionMonthLabel(sv.date)}`)
    );
    const lateOf = (rows: SessionData[]) => {
      const booked = rows.reduce((sum, r) => sum + (r.bookedCount || 0), 0);
      const late = rows.reduce((sum, r) => sum + (r.lateCancelledCount || 0), 0);
      return booked > 0 ? (late / booked) * 100 : 0;
    };
    const noShowOf = (rows: SessionData[]) => {
      const booked = rows.reduce((sum, r) => sum + (r.bookedCount || 0), 0);
      const noShow = rows.reduce((sum, r) => sum + Math.max(0, (r.bookedCount || 0) - (r.checkedInCount || 0) - (r.lateCancelledCount || 0)), 0);
      return booked > 0 ? (noShow / booked) * 100 : 0;
    };
    const lateCancelRate = lateOf(scopedSessions);
    const noShowRate = noShowOf(scopedSessions);
    const scopedBooked = scopedSessions.reduce((sum, r) => sum + (r.bookedCount || 0), 0);
    const latestLabel = latestKey !== null ? data.find(d => monthKeyOf(d.monthYear) === latestKey)?.monthYear || '' : '';
    const prevLabel = prevKey !== null ? data.find(d => monthKeyOf(d.monthYear) === prevKey)?.monthYear || '' : '';
    const lateMom = latestLabel && prevLabel
      ? lateOf(scopedSessions.filter(r => sessionMonthLabel(r.date) === latestLabel)) - lateOf(scopedSessions.filter(r => sessionMonthLabel(r.date) === prevLabel))
      : null;
    const noShowMom = latestLabel && prevLabel
      ? noShowOf(scopedSessions.filter(r => sessionMonthLabel(r.date) === latestLabel)) - noShowOf(scopedSessions.filter(r => sessionMonthLabel(r.date) === prevLabel))
      : null;

    return {
      totalTrainers,
      totalSessions,
      totalRevenue,
      totalCustomers,
      avgClassSize,
      avgRevenue,
      avgRevenuePerSession,
      utilizationRate,
      avgConversionRate,
      avgRetentionRate,
      fillRate,
      emptySessionRate,
      totalCapacity,
      totalEmptySessions,
      lateCancelRate,
      noShowRate,
      scopedBooked,
      scopedSessionCount: scopedSessions.length,
      fillMom,
      emptyMom,
      sizeMom,
      lateMom,
      noShowMom
    };
  }, [data, sessions]);

  if (!summaryStats) {
    return null;
  }

  const metricCards = [
    {
      title: 'Active Trainers',
      value: formatNumber(summaryStats.totalTrainers),
      subtitle: 'Total instructors',
      icon: Users,
      details: [
        { label: 'Avg Sessions/Trainer', value: (summaryStats.totalSessions / summaryStats.totalTrainers).toFixed(1) },
        { label: 'Avg Revenue/Trainer', value: formatCurrency(summaryStats.avgRevenue) }
      ]
    },
    {
      title: 'Total Sessions',
      value: formatNumber(summaryStats.totalSessions),
      subtitle: 'Classes conducted',
      icon: Activity,
      details: [
        { label: 'Utilization Rate', value: `${summaryStats.utilizationRate.toFixed(1)}%` },
        { label: 'Avg Class Size', value: summaryStats.avgClassSize.toFixed(1) }
      ]
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(summaryStats.totalRevenue),
      subtitle: 'Generated income',
      icon: DollarSign,
      details: [
        { label: 'Revenue/Session', value: formatCurrency(summaryStats.avgRevenuePerSession) },
        { label: 'Revenue/Customer', value: formatCurrency(summaryStats.totalCustomers > 0 ? summaryStats.totalRevenue / summaryStats.totalCustomers : 0) }
      ]
    },
    {
      title: 'Total Members',
      value: formatNumber(summaryStats.totalCustomers),
      subtitle: 'Class attendees',
      icon: Target,
      details: [
        { label: 'Members/Session', value: summaryStats.avgClassSize.toFixed(1) },
        { label: 'Total Unique', value: formatNumber(summaryStats.totalCustomers) }
      ]
    },
    {
      title: 'Efficiency Score',
      value: `${summaryStats.utilizationRate.toFixed(1)}%`,
      subtitle: 'Session utilization',
      icon: Zap,
      details: [
        { label: 'Fill Rate', value: `${summaryStats.utilizationRate.toFixed(1)}%` },
        { label: 'Performance', value: 'Excellent' }
      ]
    },
    {
      title: 'Conversion Rate',
      value: `${summaryStats.avgConversionRate.toFixed(1)}%`,
      subtitle: 'Member conversion',
      icon: TrendingUp,
      details: [
        { label: 'Retention Rate', value: `${summaryStats.avgRetentionRate.toFixed(1)}%` },
        { label: 'Performance', value: 'Strong' }
      ]
    },
    {
      title: 'Revenue / Session',
      value: formatCurrency(summaryStats.avgRevenuePerSession),
      subtitle: 'Average per class',
      icon: BarChart3,
      details: [
        { label: 'Total Revenue', value: formatCurrency(summaryStats.totalRevenue) },
        { label: 'Total Sessions', value: formatNumber(summaryStats.totalSessions) }
      ]
    },
    {
      title: 'Retention Rate',
      value: `${summaryStats.avgRetentionRate.toFixed(1)}%`,
      subtitle: 'Weighted across months',
      icon: Award,
      details: [
        { label: 'Conversion Rate', value: `${summaryStats.avgConversionRate.toFixed(1)}%` },
        { label: 'Utilization', value: `${summaryStats.utilizationRate.toFixed(1)}%` }
      ]
    },
    {
      title: 'Fill Rate',
      value: `${summaryStats.fillRate.toFixed(1)}%`,
      subtitle: 'Seats filled vs capacity',
      icon: Gauge,
      change: summaryStats.fillMom === null ? '—' : `${summaryStats.fillMom >= 0 ? '+' : ''}${summaryStats.fillMom.toFixed(1)} pts`,
      changeType: (summaryStats.fillMom ?? 0) >= 0 ? 'positive' as const : 'negative' as const,
      details: [
        { label: 'Total Capacity', value: formatNumber(summaryStats.totalCapacity) },
        { label: 'Attendees', value: formatNumber(summaryStats.totalCustomers) }
      ]
    },
    {
      title: 'Avg Class Size',
      value: summaryStats.avgClassSize.toFixed(1),
      subtitle: 'Attendees per session',
      icon: Users,
      change: summaryStats.sizeMom === null ? '—' : `${summaryStats.sizeMom >= 0 ? '+' : ''}${summaryStats.sizeMom.toFixed(1)}`,
      changeType: (summaryStats.sizeMom ?? 0) >= 0 ? 'positive' as const : 'negative' as const,
      details: [
        { label: 'Total Sessions', value: formatNumber(summaryStats.totalSessions) },
        { label: 'Total Attendees', value: formatNumber(summaryStats.totalCustomers) }
      ]
    },
    {
      title: 'Empty Sessions',
      value: `${summaryStats.emptySessionRate.toFixed(1)}%`,
      subtitle: `${formatNumber(summaryStats.totalEmptySessions)} sessions with zero turnout`,
      icon: CalendarX,
      change: summaryStats.emptyMom === null ? '—' : `${summaryStats.emptyMom >= 0 ? '+' : ''}${summaryStats.emptyMom.toFixed(1)} pts`,
      changeType: (summaryStats.emptyMom ?? 0) <= 0 ? 'positive' as const : 'negative' as const,
      details: [
        { label: 'Empty Sessions', value: formatNumber(summaryStats.totalEmptySessions) },
        { label: 'Total Sessions', value: formatNumber(summaryStats.totalSessions) }
      ]
    },
    {
      title: 'Late-Cancel Rate',
      value: `${summaryStats.lateCancelRate.toFixed(1)}%`,
      subtitle: 'Late cancels of booked seats',
      icon: AlarmClock,
      change: summaryStats.lateMom === null ? '—' : `${summaryStats.lateMom >= 0 ? '+' : ''}${summaryStats.lateMom.toFixed(1)} pts`,
      changeType: (summaryStats.lateMom ?? 0) <= 0 ? 'positive' as const : 'negative' as const,
      details: [
        { label: 'Scoped Sessions', value: formatNumber(summaryStats.scopedSessionCount) },
        { label: 'Booked Seats', value: formatNumber(summaryStats.scopedBooked) }
      ]
    },
    {
      title: 'No-Show Rate',
      value: `${summaryStats.noShowRate.toFixed(1)}%`,
      subtitle: 'Booked but never checked in',
      icon: UserX,
      change: summaryStats.noShowMom === null ? '—' : `${summaryStats.noShowMom >= 0 ? '+' : ''}${summaryStats.noShowMom.toFixed(1)} pts`,
      changeType: (summaryStats.noShowMom ?? 0) <= 0 ? 'positive' as const : 'negative' as const,
      details: [
        { label: 'Scoped Sessions', value: formatNumber(summaryStats.scopedSessionCount) },
        { label: 'Booked Seats', value: formatNumber(summaryStats.scopedBooked) }
      ]
    }
  ];

  return (
    <MetricGrid cols={4}>
      {metricCards.map((card) => {
        const Icon = card.icon;
        const hasDelta = 'change' in card && (card as { change: string }).change !== '—';
        const delta = hasDelta
          ? {
              value: (card as { change: string }).change,
              tone: ((card as { changeType: string }).changeType === 'positive' ? 'up' : 'down') as
                | 'up'
                | 'down',
            }
          : undefined;
        return (
          <MetricCard
            key={card.title}
            label={card.title}
            value={card.value}
            sub={card.subtitle}
            icon={Icon}
            delta={delta}
            details={
              <span className="space-y-1">
                {(card.details as Array<{ label: string; value: string }>).map((detail) => (
                  <span key={detail.label} className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">{detail.label}</span>
                    <strong>{detail.value}</strong>
                  </span>
                ))}
              </span>
            }
            detailsTitle="Breakdown"
            onSelect={
              onCardClick ? () => onCardClick(card.title, { ...summaryStats, metric: card.title }) : undefined
            }
          />
        );
      })}
    </MetricGrid>
  );
};
