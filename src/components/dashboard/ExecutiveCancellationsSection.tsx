import React from 'react';
import { Clock } from 'lucide-react';
import { ExecutiveSectionCard } from './ExecutiveSectionCard';
import { LateCancellationsMetricCards } from './LateCancellationsMetricCards';
import { LateCancellationsMonthOnMonthTable } from './LateCancellationsMonthOnMonthTable';
import { useLateCancellationsData } from '@/hooks/useLateCancellationsData';
import { BrandSpinner } from '@/components/ui/BrandSpinner';

interface ExecutiveCancellationsSectionProps {
  onMetricClick?: (metricData: any) => void;
}

export const ExecutiveCancellationsSection: React.FC<ExecutiveCancellationsSectionProps> = ({
  onMetricClick,
}) => {
  const { data: cancellationsData, loading: cancellationsLoading } = useLateCancellationsData();

  if (cancellationsLoading) {
    return (
      <ExecutiveSectionCard
        title="Late Cancellations"
        icon={Clock}
        borderColor="rose"
        description="Cancellation trends, patterns, and recovery opportunities"
      >
        <div className="flex items-center justify-center py-12">
          <BrandSpinner />
        </div>
      </ExecutiveSectionCard>
    );
  }

  return (
    <ExecutiveSectionCard
      title="Late Cancellations"
      icon={Clock}
      borderColor="rose"
      description="Cancellation trends, patterns, and recovery opportunities"
      contentClassName="space-y-6"
    >
      {/* Metric Cards */}
      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-4">Key Metrics</h4>
        <LateCancellationsMetricCards data={cancellationsData} />
      </div>

      {/* Cancellations Table */}
      {cancellationsData && cancellationsData.length > 0 && (
        <div className="pt-4 border-t border-slate-100">
          <h4 className="text-sm font-semibold text-slate-700 mb-4">Cancellations by Time Period</h4>
          <LateCancellationsMonthOnMonthTable data={cancellationsData} />
        </div>
      )}
    </ExecutiveSectionCard>
  );
};

export default ExecutiveCancellationsSection;
