import React, { useMemo } from 'react';
import { Activity } from 'lucide-react';
import { ExecutiveSectionCard } from './ExecutiveSectionCard';
import { SessionsMetricCards } from './SessionsMetricCards';
import { SessionsGroupedTable } from './SessionsGroupedTable';
import { useSessionsData } from '@/hooks/useSessionsData';
import { BrandSpinner } from '@/components/ui/BrandSpinner';

interface ExecutiveSessionsSectionProps {
  onMetricClick?: (metricData: any) => void;
}

export const ExecutiveSessionsSection: React.FC<ExecutiveSessionsSectionProps> = ({
  onMetricClick,
}) => {
  const { data: sessionsData, loading: sessionsLoading } = useSessionsData();

  if (sessionsLoading) {
    return (
      <ExecutiveSectionCard
        title="Sessions Overview"
        icon={Activity}
        borderColor="blue"
        description="Total sessions, fill rates, and attendance metrics"
      >
        <div className="flex items-center justify-center py-12">
          <BrandSpinner />
        </div>
      </ExecutiveSectionCard>
    );
  }

  return (
    <ExecutiveSectionCard
      title="Sessions Overview"
      icon={Activity}
      borderColor="blue"
      description="Total sessions, fill rates, and attendance metrics"
      contentClassName="space-y-6"
    >
      {/* Metric Cards */}
      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-4">Key Metrics</h4>
        <SessionsMetricCards data={sessionsData} />
      </div>

      {/* Sessions Table */}
      {sessionsData && sessionsData.length > 0 && (
        <div className="pt-4 border-t border-slate-100">
          <h4 className="text-sm font-semibold text-slate-700 mb-4">Class Schedule & Attendance</h4>
          <SessionsGroupedTable data={sessionsData} />
        </div>
      )}
    </ExecutiveSectionCard>
  );
};

export default ExecutiveSessionsSection;
