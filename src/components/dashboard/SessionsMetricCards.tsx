
import React, { useMemo } from 'react';
import { Users, Target, Calendar, Clock, DollarSign, AlertTriangle, Gift, Star } from 'lucide-react';
import { SessionData } from '@/hooks/useSessionsData';
import { formatNumber, formatCurrency } from '@/utils/formatters';
import { MetricCard, MetricGrid } from '@/components/ui/MetricCard';

interface SessionsMetricCardsProps {
  data: SessionData[];
}

export const SessionsMetricCards: React.FC<SessionsMetricCardsProps> = ({ data }) => {
  const metrics = useMemo(() => {
    // Filter out unwanted sessions
    const filteredData = data.filter(session => {
      const className = session.cleanedClass || '';
      const excludeKeywords = ['Hosted', 'P57', 'X'];
      
      const hasExcludedKeyword = excludeKeywords.some(keyword => 
        className.toLowerCase().includes(keyword.toLowerCase())
      );
      
      return !hasExcludedKeyword;
    });

    const totalSessions = filteredData.length;
    const totalCapacity = filteredData.reduce((sum, session) => sum + session.capacity, 0);
    const totalCheckedIn = filteredData.reduce((sum, session) => sum + session.checkedInCount, 0);
    const totalRevenue = filteredData.reduce((sum, session) => sum + session.totalPaid, 0);
    const totalLateCancellations = filteredData.reduce((sum, session) => sum + session.lateCancelledCount, 0);
    const totalComplimentary = filteredData.reduce((sum, session) => sum + session.complimentaryCount, 0);
    const totalNonPaid = filteredData.reduce((sum, session) => sum + session.nonPaidCount, 0);
    const totalBooked = filteredData.reduce((sum, session) => sum + session.bookedCount, 0);
    const totalMemberships = filteredData.reduce((sum, session) => sum + session.checkedInsWithMemberships, 0);
    const totalPackages = filteredData.reduce((sum, session) => sum + session.checkedInsWithPackages, 0);
    
    const avgFillRate = totalCapacity > 0 ? (totalCheckedIn / totalCapacity) * 100 : 0;
    const avgRevenuePerSession = totalSessions > 0 ? totalRevenue / totalSessions : 0;
    const lateCancellationRate = totalSessions > 0 ? (totalLateCancellations / totalSessions) : 0;
    const avgClassSize = totalSessions > 0 ? totalCheckedIn / totalSessions : 0;
    const membershipUtilization = totalCheckedIn > 0 ? (totalMemberships / totalCheckedIn) * 100 : 0;
    const packageUtilization = totalCheckedIn > 0 ? (totalPackages / totalCheckedIn) * 100 : 0;
    
    // Popular time slots
    const timeSlotCounts = filteredData.reduce((acc, session) => {
      acc[session.time] = (acc[session.time] || 0) + session.checkedInCount;
      return acc;
    }, {} as Record<string, number>);
    
    const mostPopularTime = Object.entries(timeSlotCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';

    return [
      {
        title: "Total Sessions",
        value: formatNumber(totalSessions),
        description: "Active class sessions tracked (excluding hosted, P57, X)",
        detailDescription: `Total capacity: ${formatNumber(totalCapacity)} seats across all sessions. Includes all regular classes and excludes special events.`,
        icon: Calendar,
      },
      {
        title: "Average Class Size",
        value: avgClassSize.toFixed(1),
        description: "Average attendees per session",
        detailDescription: `Calculated from ${formatNumber(totalCheckedIn)} total attendees across ${totalSessions} sessions. This metric helps track class popularity and capacity optimization.`,
        icon: Users,
      },
      {
        title: "Average Fill Rate",
        value: `${avgFillRate.toFixed(1)}%`,
        description: "Average capacity utilization",
        detailDescription: `${formatNumber(totalCheckedIn)} attendees out of ${formatNumber(totalCapacity)} total capacity. Higher fill rates indicate better demand-capacity matching.`,
        icon: Target,
      },
      {
        title: "Total Revenue",
        value: formatCurrency(totalRevenue),
        description: "Revenue from class attendance",
        detailDescription: `Generated from ${totalSessions} sessions with an average of ${formatCurrency(avgRevenuePerSession)} per session. Includes all paid attendees.`,
        icon: DollarSign,
      },
      {
        title: "Late Cancellations",
        value: formatNumber(totalLateCancellations),
        description: `Avg ${lateCancellationRate.toFixed(1)} per session`,
        detailDescription: `Total late cancellations across all sessions. This impacts revenue and class planning. Lower is better for studio operations.`,
        icon: AlertTriangle,
      },
      {
        title: "Complimentary Attendees",
        value: formatNumber(totalComplimentary),
        description: "Free class attendees",
        detailDescription: `Students attending on complimentary passes or promotional offers. Represents ${((totalComplimentary / totalCheckedIn) * 100).toFixed(1)}% of total attendance.`,
        icon: Gift,
      },
      {
        title: "Membership Usage",
        value: `${membershipUtilization.toFixed(1)}%`,
        description: "Classes attended using memberships",
        detailDescription: `${formatNumber(totalMemberships)} out of ${formatNumber(totalCheckedIn)} attendees used memberships. Higher percentage indicates strong membership engagement.`,
        icon: Star,
      },
      {
        title: "Most Popular Time",
        value: mostPopularTime,
        description: "Peak attendance time slot",
        detailDescription: `Time slot with highest total attendance: ${timeSlotCounts[mostPopularTime] || 0} attendees. Use this data for scheduling and resource allocation.`,
        icon: Clock,
      }
    ];
  }, [data]);

  return (
    <MetricGrid cols={4}>
      {metrics.map((metric) => (
        <MetricCard
          key={metric.title}
          label={metric.title}
          value={metric.value}
          sub={metric.description}
          icon={metric.icon}
          details={metric.detailDescription}
          detailsTitle="Breakdown"
        />
      ))}
    </MetricGrid>
  );
};
