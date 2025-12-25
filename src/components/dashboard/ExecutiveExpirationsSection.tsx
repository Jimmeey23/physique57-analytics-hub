import React from 'react';
import { AlertCircle } from 'lucide-react';
import { ExecutiveSectionCard } from './ExecutiveSectionCard';
import { ExpirationMetricCards } from './ExpirationMetricCards';
import { ExpirationDataTables } from './ExpirationDataTables';
import { useExpirationsData } from '@/hooks/useExpirationsData';
import { BrandSpinner } from '@/components/ui/BrandSpinner';

interface ExecutiveExpirationsSectionProps {
  onMetricClick?: (metricData: any) => void;
}

export const ExecutiveExpirationsSection: React.FC<ExecutiveExpirationsSectionProps> = ({
  onMetricClick,
}) => {
  const { data: expirationsData, loading: expirationsLoading } = useExpirationsData();

  if (expirationsLoading) {
    return (
      <ExecutiveSectionCard
        title="Membership Expirations"
        icon={AlertCircle}
        borderColor="sky"
        description="Upcoming expirations and retention opportunities"
      >
        <div className="flex items-center justify-center py-12">
          <BrandSpinner />
        </div>
      </ExecutiveSectionCard>
    );
  }

  return (
    <ExecutiveSectionCard
      title="Membership Expirations"
      icon={AlertCircle}
      borderColor="sky"
      description="Upcoming expirations and retention opportunities"
      contentClassName="space-y-6"
    >
      {/* Metric Cards */}
      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-4">Key Metrics</h4>
        <ExpirationMetricCards data={expirationsData} />
      </div>

      {/* Expirations Table */}
      {expirationsData && expirationsData.length > 0 && (
        <div className="pt-4 border-t border-slate-100">
          <h4 className="text-sm font-semibold text-slate-700 mb-4">Expiration Details</h4>
          <ExpirationDataTables data={expirationsData} />
        </div>
      )}
    </ExecutiveSectionCard>
  );
};

export default ExecutiveExpirationsSection;
