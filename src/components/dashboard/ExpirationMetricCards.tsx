import React from 'react';
import { Users, AlertTriangle, Clock, CheckCircle, TrendingUp } from 'lucide-react';
import { ExpirationData } from '@/types/dashboard';
import { useExpirationMetrics } from '@/hooks/useExpirationMetrics';
import { MetricCard, MetricGrid } from '@/components/ui/MetricCard';

interface ExpirationMetricCardsProps {
  data: ExpirationData[];
  historicalData?: ExpirationData[];
  dateRange?: { start?: string | Date; end?: string | Date };
  onMetricClick?: (data: ExpirationData[], type: string) => void;
}

const iconMap = {
  Users,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
};

export const ExpirationMetricCards: React.FC<ExpirationMetricCardsProps> = ({ 
  data,
  historicalData,
  dateRange,
  onMetricClick 
}) => {
  const { metrics } = useExpirationMetrics(data, historicalData, { dateRange });

  const getFilteredData = (metric: any) => {
    if (metric.title === 'Active Members') return data.filter(item => item.status === 'Active');
    if (metric.title === 'Churned Members') return data.filter(item => item.status === 'Churned');
    if (metric.title === 'Frozen Members') return data.filter(item => item.status === 'Frozen');
    return data;
  };

  // Take the first 8 metrics for the cards (matching Sales tab layout)
  const displayMetrics = metrics.slice(0, 8);

  return (
    <MetricGrid cols={4}>
      {displayMetrics.map((metric) => {
        const IconComponent = iconMap[metric.icon as keyof typeof iconMap] || Users;
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
              <span>
                {metric.periodLabel || 'vs previous month'}: <strong>{metric.previousValue}</strong>
              </span>
            }
            detailsTitle="Previous period"
            onSelect={
              onMetricClick
                ? () => onMetricClick(getFilteredData(metric), metric.title.toLowerCase())
                : undefined
            }
          />
        );
      })}
    </MetricGrid>
  );
};
