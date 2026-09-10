import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrainerNameCell } from '@/components/ui/TrainerAvatar';
import { 
  Users, 
  Activity, 
  DollarSign, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Zap,
  Award,
  Calendar,
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
import { cn } from '@/lib/utils';

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
      gradient: 'from-blue-500 to-cyan-600',
      bgGradient: 'from-blue-50 to-cyan-50',
      borderColor: 'border-blue-200',
      change: '+5.2%',
      changeType: 'positive' as const,
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
      gradient: 'from-green-500 to-emerald-600',
      bgGradient: 'from-green-50 to-emerald-50',
      borderColor: 'border-green-200',
      change: '+12.8%',
      changeType: 'positive' as const,
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
      gradient: 'from-purple-500 to-violet-600',
      bgGradient: 'from-purple-50 to-violet-50',
      borderColor: 'border-purple-200',
      change: '+8.7%',
      changeType: 'positive' as const,
      details: [
        { label: 'Revenue/Session', value: formatCurrency(summaryStats.avgRevenuePerSession) },
        { label: 'Revenue/Customer', value: formatCurrency(summaryStats.totalRevenue / summaryStats.totalCustomers) }
      ]
    },
    {
      title: 'Total Members',
      value: formatNumber(summaryStats.totalCustomers),
      subtitle: 'Class attendees',
      icon: Target,
      gradient: 'from-orange-500 to-red-500',
      bgGradient: 'from-orange-50 to-red-50',
      borderColor: 'border-orange-200',
      change: '+15.3%',
      changeType: 'positive' as const,
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
      gradient: 'from-indigo-500 to-purple-600',
      bgGradient: 'from-indigo-50 to-purple-50',
      borderColor: 'border-indigo-200',
      change: '+3.2%',
      changeType: 'positive' as const,
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
      gradient: 'from-teal-500 to-green-600',
      bgGradient: 'from-teal-50 to-green-50',
      borderColor: 'border-teal-200',
      change: '+2.1%',
      changeType: 'positive' as const,
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
      gradient: 'from-fuchsia-500 to-pink-600',
      bgGradient: 'from-fuchsia-50 to-pink-50',
      borderColor: 'border-fuchsia-200',
      change: '+1.2%',
      changeType: 'positive' as const,
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
      gradient: 'from-sky-500 to-blue-600',
      bgGradient: 'from-sky-50 to-blue-50',
      borderColor: 'border-sky-200',
      change: '+0.8%',
      changeType: 'positive' as const,
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
      gradient: 'from-cyan-500 to-blue-600',
      bgGradient: 'from-cyan-50 to-blue-50',
      borderColor: 'border-cyan-200',
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
      gradient: 'from-lime-500 to-green-600',
      bgGradient: 'from-lime-50 to-green-50',
      borderColor: 'border-lime-200',
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
      gradient: 'from-amber-500 to-orange-600',
      bgGradient: 'from-amber-50 to-orange-50',
      borderColor: 'border-amber-200',
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
      gradient: 'from-rose-500 to-red-600',
      bgGradient: 'from-rose-50 to-red-50',
      borderColor: 'border-rose-200',
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
      gradient: 'from-slate-500 to-gray-700',
      bgGradient: 'from-slate-50 to-gray-50',
      borderColor: 'border-slate-200',
      change: summaryStats.noShowMom === null ? '—' : `${summaryStats.noShowMom >= 0 ? '+' : ''}${summaryStats.noShowMom.toFixed(1)} pts`,
      changeType: (summaryStats.noShowMom ?? 0) <= 0 ? 'positive' as const : 'negative' as const,
      details: [
        { label: 'Scoped Sessions', value: formatNumber(summaryStats.scopedSessionCount) },
        { label: 'Booked Seats', value: formatNumber(summaryStats.scopedBooked) }
      ]
    }
  ];

  // Get top trainers for each metric (for avatars)
  const topTrainers = React.useMemo(() => {
    if (!data.length) return [];
    
    // Get top 3 trainers by revenue
    const trainerRevenue = new Map<string, number>();
    data.forEach(d => {
      const current = trainerRevenue.get(d.trainerName) || 0;
      trainerRevenue.set(d.trainerName, current + d.totalPaid);
    });
    
    return Array.from(trainerRevenue.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name);
  }, [data]);

  // Helper to get trainer initials
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {metricCards.map((card, index) => {
        const Icon = card.icon;
        const isPositive = card.changeType === 'positive';
        
        return (
          <Card
            key={card.title}
            onClick={() => onCardClick?.(card.title, { ...summaryStats, metric: card.title })}
            className={cn(
              "group relative overflow-hidden cursor-pointer transition-all duration-700",
              "bg-white hover:bg-gradient-to-br hover:from-gray-900 hover:via-slate-900 hover:to-slate-900",
              index % 4 === 0 && "border-t-4 border-blue-700 hover:border-blue-700 shadow-lg",
              index % 4 === 1 && "border-t-4 border-green-700 hover:border-green-700 shadow-lg",
              index % 4 === 2 && "border-t-4 border-purple-700 hover:border-purple-700 shadow-lg",
              index % 4 === 3 && "border-t-4 border-amber-700 hover:border-amber-700 shadow-lg",
              "hover:shadow-2xl hover:shadow-slate-900/30",
              "hover:-translate-y-2 hover:scale-[1.02]"
            )}
          >
            <CardContent className="p-6 relative">
              {/* Background Icon */}
              <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-all duration-700">
                <Icon className={cn(
                  "w-12 h-12 transition-all duration-700",
                  index % 4 === 0 && "text-blue-700",
                  index % 4 === 1 && "text-green-700",
                  index % 4 === 2 && "text-purple-700",
                  index % 4 === 3 && "text-amber-700",
                  "group-hover:text-white/40"
                )} />
              </div>
              
              <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-6">
                    <div className={cn(
                      "p-4 rounded-2xl transition-all duration-700 border-1 shadow-md",
                      index % 4 === 0 && "bg-gradient-to-br from-blue-700 to-blue-600 border-blue-900 text-white shadow-blue-200",
                      index % 4 === 1 && "bg-gradient-to-br from-green-700 to-green-600 border-green-900 text-white shadow-green-200",
                      index % 4 === 2 && "bg-gradient-to-br from-purple-700 to-purple-600 border-purple-900 text-white shadow-purple-200",
                      index % 4 === 3 && "bg-gradient-to-br from-amber-700 to-amber-600 border-amber-900 text-white shadow-amber-200",
                      "group-hover:bg-white/20 group-hover:border-white/40 group-hover:text-white group-hover:shadow-white/20"
                    )}>
                      <Icon className="w-6 h-6 drop-shadow-sm" />
                    </div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg text-slate-900 group-hover:text-white/95 transition-colors duration-700">
                        {card.title}
                      </h3>
                    </div>
                  </div>
                  
                  {/* Change Badge */}
                  <div className={cn(
                    "flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-700",
                    isPositive
                      ? "bg-green-50 text-green-700 group-hover:bg-green-400/30 group-hover:text-green-100"
                      : "bg-red-50 text-red-700 group-hover:bg-red-400/30 group-hover:text-red-100"
                  )}>
                    {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span>{card.change}</span>
                  </div>
                </div>

                {/* Value */}
                <div className="space-y-2 mb-4">
                  <p className={cn(
                    "text-[28px] font-bold transition-all duration-700 text-slate-900 group-hover:text-white"
                  )}>
                    {card.value}
                  </p>
                  <p className={cn(
                    "text-xs text-slate-500 group-hover:text-slate-200 transition-colors"
                  )}>
                    {card.subtitle}
                  </p>
                </div>

                {/* Top Trainers */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex -space-x-2">
                    {topTrainers.slice(0, 3).map((trainer, idx) => (
                      <div 
                        key={trainer}
                        className={cn(
                          "border-2 border-white group-hover:border-slate-800 transition-all duration-500",
                          "hover:z-10 hover:scale-110"
                        )}
                      >
                        <TrainerNameCell 
                          name={trainer} 
                          className="w-8 h-8 text-xs"
                          showName={false}
                        />
                      </div>
                    ))}
                  </div>
                  <span className="text-xs text-slate-600 group-hover:text-slate-300 transition-colors">
                    Top {topTrainers.length} Trainers
                  </span>
                </div>
              </div>
              
              {/* Details Footer */}
              <div className={cn(
                "mt-4 p-3 border-t border-l-4 transition-all duration-700",
                "bg-slate-50 group-hover:bg-slate-800/50 border-t-slate-200 group-hover:border-t-white/10",
                index % 4 === 0 && "border-l-blue-700",
                index % 4 === 1 && "border-l-green-700",
                index % 4 === 2 && "border-l-purple-700",
                index % 4 === 3 && "border-l-amber-700"
              )}>
                <div className="space-y-1.5">
                  {card.details.map((detail, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 group-hover:text-slate-300 transition-colors duration-700">
                        {detail.label}
                      </span>
                      <span className="font-semibold text-slate-900 group-hover:text-white transition-colors duration-700">
                        {detail.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};