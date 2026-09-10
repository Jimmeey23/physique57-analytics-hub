import React from 'react';
import { MetricCard, MetricGrid } from '@/components/ui/MetricCard';
import { DollarSign, ShoppingCart, CreditCard, Target, Users, Calendar, ArrowDownRight, Activity, UserPlus } from 'lucide-react';
import { SalesData } from '@/types/dashboard';
import { useSalesMetrics } from '@/hooks/useSalesMetrics';
import { shallowEqual } from '@/utils/performanceUtils';

interface SalesAnimatedMetricCardsProps {
  data: SalesData[];
  historicalData?: SalesData[];
  dateRange?: { start: string | Date; end: string | Date };
  onMetricClick?: (metricData: any) => void;
  locationId?: string;
}

const iconMap = {
  DollarSign,
  ShoppingCart,
  CreditCard,
  Target,
  Users,
  Calendar,
  ArrowDownRight,
  Activity,
  UserPlus,
};

export const SalesAnimatedMetricCardsComponent: React.FC<SalesAnimatedMetricCardsProps> = ({ 
  data,
  historicalData,
  dateRange,
  onMetricClick,
  locationId
}) => {
  const { metrics } = useSalesMetrics(data, historicalData, { dateRange });

  // Take the first 8 metrics for the cards (was 4, now 8)
  const displayMetrics = metrics;

  return (
    <MetricGrid cols={4}>
      {displayMetrics.map((metric) => {
        const IconComponent = iconMap[metric.icon as keyof typeof iconMap] || DollarSign;
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
                Previous: <strong>{metric.previousValue ?? '—'}</strong>
              </span>
            }
            detailsTitle="Month over month"
            onSelect={
              onMetricClick
                ? () => onMetricClick({
                    ...metric,
                    metricType: metric.title.toLowerCase().replace(/\s+/g, '-'),
                    specificData: metric,
                    drillDownType: 'metric',
                  })
                : undefined
            }
          />
        );
      })}
    </MetricGrid>
  );
};

// Memoized export with custom comparison function
export const SalesAnimatedMetricCards = React.memo(
  SalesAnimatedMetricCardsComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.data === nextProps.data &&
      shallowEqual(prevProps.historicalData, nextProps.historicalData) &&
      shallowEqual(prevProps.dateRange, nextProps.dateRange) &&
      prevProps.onMetricClick === nextProps.onMetricClick &&
      prevProps.locationId === nextProps.locationId
    );
  }
);

export default SalesAnimatedMetricCards;
