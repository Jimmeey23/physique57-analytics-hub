import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Clock3, IndianRupee, MapPin, TimerReset, UserX, Users, Zap } from 'lucide-react';
import { LateCancellationsData } from '@/types/dashboard';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { MetricCard, MetricGrid } from '@/components/ui/MetricCard';

interface LateCancellationsMetricCardsProps {
  data: LateCancellationsData[];
  onMetricClick?: (metricData: any) => void;
}

const getNumericValues = (values: Array<number | undefined>) =>
  values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

export const LateCancellationsMetricCards: React.FC<LateCancellationsMetricCardsProps> = ({
  data,
  onMetricClick,
}) => {
  const metrics = useMemo(() => {
    if (!data.length) return [];

    const totalCancellations = data.length;
    const uniqueMembers = new Set(data.map((item) => item.memberId || item.email || item.customerName).filter(Boolean)).size;
    const uniqueLocations = new Set(data.map((item) => item.location).filter(Boolean)).size;
    const sameDayCount = data.filter((item) => item.isSameDayCancellation).length;
    const withinOneHourCount = data.filter((item) => (item.timeBeforeClassMinutes ?? Infinity) < 60).length;
    const leadMinutes = getNumericValues(data.map((item) => item.timeBeforeClassMinutes));
    const sortedLeadMinutes = [...leadMinutes].sort((a, b) => a - b);
    const averageLeadHours = leadMinutes.length ? leadMinutes.reduce((sum, value) => sum + value, 0) / leadMinutes.length / 60 : 0;
    const medianLeadHours = sortedLeadMinutes.length
      ? sortedLeadMinutes[Math.floor(sortedLeadMinutes.length / 2)] / 60
      : 0;
    const totalPenalties = data.reduce((sum, item) => sum + (item.chargedPenaltyAmount || 0), 0);
    const penaltyCount = data.filter((item) => item.hasPenalty).length;
    const penaltyRate = totalCancellations ? penaltyCount / totalCancellations : 0;

    const windowCounts = data.reduce((acc, item) => {
      const window = item.cancellationWindow || 'Unknown';
      acc[window] = (acc[window] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topWindow = Object.entries(windowCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';

    return [
      {
        title: 'Late Cancellations',
        value: formatNumber(totalCancellations),
        detail: `${formatNumber(uniqueLocations)} locations impacted`,
        icon: AlertTriangle,
      },
      {
        title: 'Affected Members',
        value: formatNumber(uniqueMembers),
        detail: `${formatNumber(totalCancellations / Math.max(uniqueMembers, 1))} avg cancels per member`,
        icon: Users,
      },
      {
        title: 'Avg Lead Time',
        value: `${averageLeadHours.toFixed(1)} hrs`,
        detail: 'Average gap between cancel and class',
        icon: Clock3,
      },
      {
        title: 'Median Lead Time',
        value: `${medianLeadHours.toFixed(1)} hrs`,
        detail: 'Better read on the typical window',
        icon: TimerReset,
      },
      {
        title: 'Same-Day Share',
        value: formatPercentage((sameDayCount / Math.max(totalCancellations, 1)) * 100),
        detail: `${formatNumber(sameDayCount)} same-day cancellations`,
        icon: Zap,
      },
      {
        title: 'Under 1 Hour',
        value: formatPercentage((withinOneHourCount / Math.max(totalCancellations, 1)) * 100),
        detail: `${formatNumber(withinOneHourCount)} cancellations very close to class`,
        icon: UserX,
      },
      {
        title: 'Penalties Charged',
        value: formatCurrency(totalPenalties),
        detail: `${formatPercentage(penaltyRate * 100)} of cancellations incurred a fee`,
        icon: IndianRupee,
      },
      {
        title: 'Peak Risk Window',
        value: topWindow,
        detail: 'Most common cancellation lead-time bucket',
        icon: MapPin,
      },
    ];
  }, [data]);

  if (!metrics.length) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Card key={index} className="border border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <MetricGrid cols={4}>
      {metrics.map((metric) => (
        <MetricCard
          key={metric.title}
          label={metric.title}
          value={metric.value}
          icon={metric.icon}
          details={metric.detail}
          detailsTitle="Detail"
          onSelect={
            onMetricClick
              ? () => onMetricClick({ title: metric.title, rawData: data, type: 'metric-card' })
              : undefined
          }
        />
      ))}
    </MetricGrid>
  );
};
