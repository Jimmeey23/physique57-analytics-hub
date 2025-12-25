import React from 'react';
import { Users } from 'lucide-react';
import { ExecutiveSectionCard } from './ExecutiveSectionCard';
import { ClientConversionMetricCards } from './ClientConversionMetricCards';
import { ClientRetentionMonthByTypePivot } from './ClientRetentionMonthByTypePivot';
import { useNewClientData } from '@/hooks/useNewClientData';
import { BrandSpinner } from '@/components/ui/BrandSpinner';

interface ExecutiveClientsSectionProps {
  onMetricClick?: (metricData: any) => void;
}

export const ExecutiveClientsSection: React.FC<ExecutiveClientsSectionProps> = ({
  onMetricClick,
}) => {
  const { data: clientData, loading: clientLoading } = useNewClientData();

  if (clientLoading) {
    return (
      <ExecutiveSectionCard
        title="Client Acquisition & Retention"
        icon={Users}
        borderColor="purple"
        description="New clients, retention rates, and LTV metrics"
      >
        <div className="flex items-center justify-center py-12">
          <BrandSpinner />
        </div>
      </ExecutiveSectionCard>
    );
  }

  return (
    <ExecutiveSectionCard
      title="Client Acquisition & Retention"
      icon={Users}
      borderColor="purple"
      description="New clients, retention rates, and LTV metrics"
      contentClassName="space-y-6"
    >
      {/* Metric Cards */}
      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-4">Key Metrics</h4>
        <ClientConversionMetricCards data={clientData} />
      </div>

      {/* Retention Table */}
      {clientData && clientData.length > 0 && (
        <div className="pt-4 border-t border-slate-100">
          <h4 className="text-sm font-semibold text-slate-700 mb-4">Retention by Client Type</h4>
          <ClientRetentionMonthByTypePivot data={clientData} />
        </div>
      )}
    </ExecutiveSectionCard>
  );
};

export default ExecutiveClientsSection;
