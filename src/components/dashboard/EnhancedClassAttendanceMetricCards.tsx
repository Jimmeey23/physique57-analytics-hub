import React, { useMemo } from 'react';
import { Users, Calendar, Target, DollarSign, TrendingUp, BarChart3 } from 'lucide-react';
import { SessionData } from '@/hooks/useSessionsData';
import { useSessionsFilters } from '@/contexts/SessionsFiltersContext';
import { parseDate } from '@/utils/dateUtils';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { MetricCard, MetricGrid } from '@/components/ui/MetricCard';

interface EnhancedClassAttendanceMetricCardsProps {
  data: SessionData[];
  comparisonData?: SessionData[];
}

const iconMap = {
  DollarSign,
  Users,
  Calendar,
  Target,
  BarChart3,
  TrendingUp
};

export const EnhancedClassAttendanceMetricCards: React.FC<EnhancedClassAttendanceMetricCardsProps> = ({ data, comparisonData }) => {
  const { filters } = useSessionsFilters();

  const metrics = useMemo(() => {
    if (!data || data.length === 0) return null;

    const baseComparisonData = comparisonData && comparisonData.length > 0 ? comparisonData : data;

    const normalizeDate = (value?: string) => {
      const parsed = value ? parseDate(value) : null;
      return parsed ? new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()) : null;
    };

    const currentDates = data
      .map((session) => normalizeDate(session.date))
      .filter((value): value is Date => value instanceof Date);

    const inferredStart = currentDates.length > 0
      ? new Date(Math.min(...currentDates.map((date) => date.getTime())))
      : null;
    const inferredEnd = currentDates.length > 0
      ? new Date(Math.max(...currentDates.map((date) => date.getTime())))
      : null;

    const currentStart = filters.dateRange.start
      ? new Date(filters.dateRange.start.getFullYear(), filters.dateRange.start.getMonth(), filters.dateRange.start.getDate())
      : inferredStart;
    const currentEnd = filters.dateRange.end
      ? new Date(filters.dateRange.end.getFullYear(), filters.dateRange.end.getMonth(), filters.dateRange.end.getDate())
      : inferredEnd;

    const lastYearStart = currentStart
      ? new Date(currentStart.getFullYear() - 1, currentStart.getMonth(), currentStart.getDate())
      : null;
    const lastYearEnd = currentEnd
      ? new Date(currentEnd.getFullYear() - 1, currentEnd.getMonth(), currentEnd.getDate())
      : null;

    const matchesNonDateFilters = (session: SessionData) => {
      if (filters.trainers.length > 0 && !filters.trainers.includes(session.trainerName)) {
        return false;
      }

      if (filters.classTypes.length > 0 && !filters.classTypes.includes(session.cleanedClass)) {
        return false;
      }

      if (filters.dayOfWeek.length > 0 && !filters.dayOfWeek.includes(session.dayOfWeek)) {
        return false;
      }

      if (filters.timeSlots.length > 0 && !filters.timeSlots.includes(session.time)) {
        return false;
      }

      return true;
    };

    const currentPeriodData = data;
    const lastYearData = baseComparisonData.filter((session) => {
      if (!matchesNonDateFilters(session)) {
        return false;
      }

      const sessionDate = normalizeDate(session.date);
      if (!sessionDate) {
        return false;
      }

      if (lastYearStart && sessionDate < lastYearStart) {
        return false;
      }

      if (lastYearEnd && sessionDate > lastYearEnd) {
        return false;
      }

      return true;
    });

    const totalSessions = currentPeriodData.length;
    const totalAttendance = currentPeriodData.reduce((sum, session) => sum + (session.checkedInCount || 0), 0);
    const totalCapacity = currentPeriodData.reduce((sum, session) => sum + (session.capacity || 0), 0);
    const totalRevenue = currentPeriodData.reduce((sum, session) => sum + (session.totalPaid || 0), 0);
    const totalBooked = currentPeriodData.reduce((sum, session) => sum + (session.bookedCount || 0), 0);
    const totalLateCancelled = currentPeriodData.reduce((sum, session) => sum + (session.lateCancelledCount || 0), 0);
    
    // Last year metrics
    const lastYearSessions = lastYearData.length;
    const lastYearAttendance = lastYearData.reduce((sum, session) => sum + (session.checkedInCount || 0), 0);
    const lastYearRevenue = lastYearData.reduce((sum, session) => sum + (session.totalPaid || 0), 0);
    const lastYearCapacity = lastYearData.reduce((sum, session) => sum + (session.capacity || 0), 0);
    
    const uniqueClasses = [...new Set(currentPeriodData.map(session => session.cleanedClass || session.classType).filter(Boolean))];
    const uniqueTrainers = [...new Set(currentPeriodData.map(session => session.trainerName).filter(Boolean))];
    const uniqueLocations = [...new Set(currentPeriodData.map(session => session.location).filter(Boolean))];
    
    const avgAttendance = totalSessions > 0 ? Number((totalAttendance / totalSessions).toFixed(1)) : 0;
    const fillRate = totalCapacity > 0 ? Number(((totalAttendance / totalCapacity) * 100).toFixed(1)) : 0;
    const avgRevenue = totalSessions > 0 ? Number((totalRevenue / totalSessions).toFixed(0)) : 0;
    const bookingRate = totalCapacity > 0 ? Number(((totalBooked / totalCapacity) * 100).toFixed(1)) : 0;
    const cancellationRate = totalBooked > 0 ? Number(((totalLateCancelled / totalBooked) * 100).toFixed(1)) : 0;
    const noShowRate = totalBooked > 0 ? Number((((totalBooked - totalAttendance - totalLateCancelled) / totalBooked) * 100).toFixed(1)) : 0;
    
    // Last year metrics for comparison
    const lastYearAvgAttendance = lastYearSessions > 0 ? lastYearAttendance / lastYearSessions : 0;
    const lastYearFillRate = lastYearCapacity > 0 ? (lastYearAttendance / lastYearCapacity) * 100 : 0;
    const lastYearAvgRevenue = lastYearSessions > 0 ? lastYearRevenue / lastYearSessions : 0;
    
    // Calculate YoY changes
    const calculateYoYChange = (current: number, lastYear: number) => {
      if (lastYear === 0) return current > 0 ? 100 : 0;
      return Number((((current - lastYear) / lastYear) * 100).toFixed(1));
    };
    
    const sessionsYoY = calculateYoYChange(totalSessions, lastYearSessions);
    const attendanceYoY = calculateYoYChange(totalAttendance, lastYearAttendance);
    const avgAttendanceYoY = calculateYoYChange(avgAttendance, lastYearAvgAttendance);
    const fillRateYoY = calculateYoYChange(fillRate, lastYearFillRate);
    const revenueYoY = calculateYoYChange(totalRevenue, lastYearRevenue);
    const avgRevenueYoY = calculateYoYChange(avgRevenue, lastYearAvgRevenue);

    // Peak hours analysis
    const hourlyData = currentPeriodData.reduce((acc, session) => {
      const hour = session.time?.split(':')[0] || 'Unknown';
      if (!acc[hour]) acc[hour] = { sessions: 0, attendance: 0 };
      acc[hour].sessions += 1;
      acc[hour].attendance += session.checkedInCount || 0;
      return acc;
    }, {} as Record<string, { sessions: number; attendance: number }>);

    const peakHour = Object.entries(hourlyData)
      .sort(([,a], [,b]) => b.attendance - a.attendance)[0];

    // Day of week analysis
    const dayData = currentPeriodData.reduce((acc, session) => {
      const day = session.dayOfWeek || 'Unknown';
      if (!acc[day]) acc[day] = { sessions: 0, attendance: 0 };
      acc[day].sessions += 1;
      acc[day].attendance += session.checkedInCount || 0;
      return acc;
    }, {} as Record<string, { sessions: number; attendance: number }>);

    const peakDay = Object.entries(dayData)
      .sort(([,a], [,b]) => b.attendance - a.attendance)[0];

    // Best performing class by average attendance
    const classPerformance = currentPeriodData.reduce((acc, session) => {
      const className = session.cleanedClass || session.classType || 'Unknown';
      if (!acc[className]) {
        acc[className] = { totalAttendance: 0, sessionCount: 0, revenue: 0 };
      }
      acc[className].totalAttendance += session.checkedInCount || 0;
      acc[className].sessionCount += 1;
      acc[className].revenue += session.totalPaid || 0;
      return acc;
    }, {} as Record<string, { totalAttendance: number; sessionCount: number; revenue: number }>);

    const bestClass = Object.entries(classPerformance)
      .map(([name, stats]) => ({
        name,
        avgAttendance: Number((stats.totalAttendance / stats.sessionCount).toFixed(1)),
        totalRevenue: stats.revenue
      }))
      .sort((a, b) => b.avgAttendance - a.avgAttendance)[0];

    // Trainer performance
    const trainerPerformance = currentPeriodData.reduce((acc, session) => {
      const trainer = session.trainerName || 'Unknown';
      if (!acc[trainer]) {
        acc[trainer] = { sessions: 0, attendance: 0, revenue: 0 };
      }
      acc[trainer].sessions += 1;
      acc[trainer].attendance += session.checkedInCount || 0;
      acc[trainer].revenue += session.totalPaid || 0;
      return acc;
    }, {} as Record<string, { sessions: number; attendance: number; revenue: number }>);

    const topTrainer = Object.entries(trainerPerformance)
      .map(([name, stats]) => ({
        name,
        avgAttendance: Number((stats.attendance / stats.sessions).toFixed(1)),
        totalSessions: stats.sessions
      }))
      .sort((a, b) => b.avgAttendance - a.avgAttendance)[0];

    const periodLabel = currentStart && currentEnd
      ? `${currentStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} – ${currentEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
      : 'Selected Period';

    return {
      totalSessions,
      totalAttendance,
      avgAttendance,
      fillRate,
      avgRevenue,
      totalRevenue,
      bookingRate,
      cancellationRate,
      noShowRate,
      uniqueClasses: uniqueClasses.length,
      uniqueTrainers: uniqueTrainers.length,
      uniqueLocations: uniqueLocations.length,
      peakHour: peakHour ? { hour: peakHour[0], attendance: peakHour[1].attendance } : null,
      peakDay: peakDay ? { day: peakDay[0], attendance: peakDay[1].attendance } : null,
      bestClass,
      topTrainer,
      // YoY changes
      sessionsYoY,
      attendanceYoY,
      avgAttendanceYoY,
      fillRateYoY,
      revenueYoY,
      avgRevenueYoY,
      // Last year values
      lastYearSessions,
      lastYearAttendance,
      lastYearRevenue,
      lastYearAvgAttendance,
      lastYearFillRate,
      lastYearAvgRevenue,
      periodLabel
    };
  }, [comparisonData, data, filters]);

  if (!metrics) return null;

  // Define metrics to display (8 cards to match Sales layout)
  const displayMetrics = [
    {
      title: 'Total Sessions',
      value: formatNumber(metrics.totalSessions),
      previousValue: formatNumber(metrics.lastYearSessions),
      change: metrics.sessionsYoY,
      yoyChange: metrics.sessionsYoY,
      yoyPreviousValue: formatNumber(metrics.lastYearSessions),
      description: 'Total class sessions conducted in the last 30 days',
      icon: 'Calendar' as keyof typeof iconMap,
      comparison: { difference: metrics.totalSessions - metrics.lastYearSessions },
      changeDetails: { 
        trend: metrics.sessionsYoY > 5 ? 'Strong Growth' : metrics.sessionsYoY > 0 ? 'Growing' : metrics.sessionsYoY < -5 ? 'Declining' : 'Stable',
        isSignificant: Math.abs(metrics.sessionsYoY) > 5
      },
      yoyChangeDetails: {
        trend: metrics.sessionsYoY > 5 ? 'Strong YoY Growth' : metrics.sessionsYoY > 0 ? 'YoY Growth' : metrics.sessionsYoY < 0 ? 'YoY Decline' : 'YoY Stable'
      }
    },
    {
      title: 'Total Attendance',
      value: formatNumber(metrics.totalAttendance),
      previousValue: formatNumber(metrics.lastYearAttendance),
      change: metrics.attendanceYoY,
      yoyChange: metrics.attendanceYoY,
      yoyPreviousValue: formatNumber(metrics.lastYearAttendance),
      description: 'Total participants across all sessions',
      icon: 'Users' as keyof typeof iconMap,
      comparison: { difference: metrics.totalAttendance - metrics.lastYearAttendance },
      changeDetails: { 
        trend: metrics.attendanceYoY > 5 ? 'Strong Growth' : metrics.attendanceYoY > 0 ? 'Growing' : metrics.attendanceYoY < -5 ? 'Declining' : 'Stable',
        isSignificant: Math.abs(metrics.attendanceYoY) > 5
      },
      yoyChangeDetails: {
        trend: metrics.attendanceYoY > 5 ? 'Strong YoY Growth' : metrics.attendanceYoY > 0 ? 'YoY Growth' : metrics.attendanceYoY < 0 ? 'YoY Decline' : 'YoY Stable'
      }
    },
    {
      title: 'Average Attendance',
      value: metrics.avgAttendance.toString(),
      previousValue: metrics.lastYearAvgAttendance.toFixed(1),
      change: metrics.avgAttendanceYoY,
      yoyChange: metrics.avgAttendanceYoY,
      yoyPreviousValue: metrics.lastYearAvgAttendance.toFixed(1),
      description: 'Average attendees per session',
      icon: 'BarChart3' as keyof typeof iconMap,
      comparison: { difference: metrics.avgAttendance - metrics.lastYearAvgAttendance },
      changeDetails: { 
        trend: metrics.avgAttendanceYoY > 5 ? 'Strong Growth' : metrics.avgAttendanceYoY > 0 ? 'Growing' : metrics.avgAttendanceYoY < -5 ? 'Declining' : 'Stable',
        isSignificant: Math.abs(metrics.avgAttendanceYoY) > 5
      },
      yoyChangeDetails: {
        trend: metrics.avgAttendanceYoY > 5 ? 'Strong YoY Growth' : metrics.avgAttendanceYoY > 0 ? 'YoY Growth' : metrics.avgAttendanceYoY < 0 ? 'YoY Decline' : 'YoY Stable'
      }
    },
    {
      title: 'Fill Rate',
      value: `${metrics.fillRate}%`,
      previousValue: `${metrics.lastYearFillRate.toFixed(1)}%`,
      change: metrics.fillRateYoY,
      yoyChange: metrics.fillRateYoY,
      yoyPreviousValue: `${metrics.lastYearFillRate.toFixed(1)}%`,
      description: 'Capacity utilization rate',
      icon: 'Target' as keyof typeof iconMap,
      comparison: { difference: metrics.fillRate - metrics.lastYearFillRate },
      changeDetails: { 
        trend: metrics.fillRateYoY > 5 ? 'Strong Growth' : metrics.fillRateYoY > 0 ? 'Growing' : metrics.fillRateYoY < -5 ? 'Declining' : 'Stable',
        isSignificant: Math.abs(metrics.fillRateYoY) > 5
      },
      yoyChangeDetails: {
        trend: metrics.fillRateYoY > 5 ? 'Strong YoY Growth' : metrics.fillRateYoY > 0 ? 'YoY Growth' : metrics.fillRateYoY < 0 ? 'YoY Decline' : 'YoY Stable'
      }
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(metrics.totalRevenue),
      previousValue: formatCurrency(metrics.lastYearRevenue),
      change: metrics.revenueYoY,
      yoyChange: metrics.revenueYoY,
      yoyPreviousValue: formatCurrency(metrics.lastYearRevenue),
      description: 'Total revenue generated',
      icon: 'DollarSign' as keyof typeof iconMap,
      comparison: { difference: metrics.totalRevenue - metrics.lastYearRevenue },
      changeDetails: { 
        trend: metrics.revenueYoY > 5 ? 'Strong Growth' : metrics.revenueYoY > 0 ? 'Growing' : metrics.revenueYoY < -5 ? 'Declining' : 'Stable',
        isSignificant: Math.abs(metrics.revenueYoY) > 5
      },
      yoyChangeDetails: {
        trend: metrics.revenueYoY > 5 ? 'Strong YoY Growth' : metrics.revenueYoY > 0 ? 'YoY Growth' : metrics.revenueYoY < 0 ? 'YoY Decline' : 'YoY Stable'
      }
    },
    {
      title: 'Avg Revenue per Session',
      value: formatCurrency(metrics.avgRevenue),
      previousValue: formatCurrency(metrics.lastYearAvgRevenue),
      change: metrics.avgRevenueYoY,
      yoyChange: metrics.avgRevenueYoY,
      yoyPreviousValue: formatCurrency(metrics.lastYearAvgRevenue),
      description: 'Average revenue per session',
      icon: 'TrendingUp' as keyof typeof iconMap,
      comparison: { difference: metrics.avgRevenue - metrics.lastYearAvgRevenue },
      changeDetails: { 
        trend: metrics.avgRevenueYoY > 5 ? 'Strong Growth' : metrics.avgRevenueYoY > 0 ? 'Growing' : metrics.avgRevenueYoY < -5 ? 'Declining' : 'Stable',
        isSignificant: Math.abs(metrics.avgRevenueYoY) > 5
      },
      yoyChangeDetails: {
        trend: metrics.avgRevenueYoY > 5 ? 'Strong YoY Growth' : metrics.avgRevenueYoY > 0 ? 'YoY Growth' : metrics.avgRevenueYoY < 0 ? 'YoY Decline' : 'YoY Stable'
      }
    },
    {
      title: 'Booking Rate',
      value: `${metrics.bookingRate}%`,
      previousValue: 'N/A',
      change: 0,
      description: 'Percentage of capacity booked',
      icon: 'Target' as keyof typeof iconMap,
      comparison: { difference: 0 },
      changeDetails: { 
        trend: 'Current Period',
        isSignificant: false
      }
    },
    {
      title: 'No-Show Rate',
      value: `${metrics.noShowRate}%`,
      previousValue: 'N/A',
      change: 0,
      description: 'Percentage of bookings not attended',
      icon: 'Users' as keyof typeof iconMap,
      comparison: { difference: 0 },
      changeDetails: { 
        trend: 'Current Period',
        isSignificant: false
      }
    }
  ];

  return (
    <MetricGrid cols={4}>
      {displayMetrics.map((metric) => {
        const IconComponent = iconMap[metric.icon] || Calendar;
        return (
          <MetricCard
            key={metric.title}
            label={metric.title}
            value={metric.value}
            sub={metric.description}
            icon={IconComponent}
            delta={{
              value: `${metric.change > 0 ? '+' : ''}${metric.change.toFixed(1)}%`,
              tone: metric.change > 0 ? 'up' : metric.change < 0 ? 'down' : 'flat',
            }}
            details={
              <span className="space-y-1">
                <span className="block">
                  Last year: <strong>{metric.yoyPreviousValue}</strong> ({metric.yoyChange > 0 ? '+' : ''}
                  {metric.yoyChange.toFixed(1)}%)
                </span>
                <span className="block text-muted-foreground">
                  Trend: {metric.changeDetails.trend} · Δ {Math.abs(metric.comparison.difference)}
                </span>
              </span>
            }
            detailsTitle="Year over year"
          />
        );
      })}
    </MetricGrid>
  );
};
