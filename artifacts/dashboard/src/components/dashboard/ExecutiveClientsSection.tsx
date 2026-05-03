import React, { useMemo, useState } from 'react';
import { Users } from 'lucide-react';
import { ExecutiveSectionCard } from './ExecutiveSectionCard';
import { ExecutiveDrillDownModal } from './ExecutiveDrillDownModal';
import { ClientConversionMetricCards } from './ClientConversionMetricCards';
import { ClientRetentionMonthByTypePivot } from './ClientRetentionMonthByTypePivot';
import { useNewClientData } from '@/hooks/useNewClientData';
import { BrandSpinner } from '@/components/ui/BrandSpinner';
import { formatNumber } from '@/utils/formatters';

interface ExecutiveClientsSectionProps {
  onMetricClick?: (metricData: any) => void;
}

export const ExecutiveClientsSection: React.FC<ExecutiveClientsSectionProps> = ({
  onMetricClick,
}) => {
  const { data: clientData, loading: clientLoading } = useNewClientData();
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const safeClientData = useMemo(() => clientData || [], [clientData]);
  const hasClientData = safeClientData.length > 0;

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
    <>
      <ExecutiveSectionCard
        title="Client Acquisition & Retention"
        icon={Users}
        borderColor="purple"
        description="New clients, retention rates, and LTV metrics"
        contentClassName="space-y-6"
      >
        {/* Metric Cards */}
        <div
          className="cursor-pointer"
          onClick={() => setDrillDownOpen(true)}
        >
          <h4 className="text-sm font-semibold text-slate-700 mb-4">Key Metrics</h4>
          <ClientConversionMetricCards data={safeClientData} />
        </div>

        {/* Retention Table */}
        {hasClientData && (
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-sm font-semibold text-slate-700 mb-4">Retention by Client Type</h4>
            <ClientRetentionMonthByTypePivot data={safeClientData} />
          </div>
        )}
      </ExecutiveSectionCard>

      {/* Drill-Down Modal */}
      <ExecutiveDrillDownModal
        open={drillDownOpen}
        onOpenChange={setDrillDownOpen}
        title="Client Acquisition & Retention Analysis"
        metric="Total Clients"
        currentValue={formatNumber(safeClientData.length)}
        description="Detailed breakdown of client acquisition, retention, and lifetime value metrics"
        borderColor="purple"
        breakdownData={
          safeClientData
            ?.slice(0, 5)
            .map((client: any, idx: number) => ({
              label: client.membershipType || `Client ${idx + 1}`,
              value: formatNumber(
                safeClientData.filter((c: any) => c.membershipType === client.membershipType).length
              ),
              percentage: (
                (safeClientData.filter((c: any) => c.membershipType === client.membershipType).length /
                  (safeClientData.length || 1)) *
                100
              ),
              color: 'bg-purple-500',
            }))
            .slice(0, 3) || []
        }
        analyticsText="Client metrics track new acquisitions, retention rates, and lifetime value to optimize marketing spend and predict revenue."
        rawData={safeClientData.slice(0, 20)}
        rawDataColumns={[
          { key: 'memberName', label: 'Name', format: 'text' },
          { key: 'membershipType', label: 'Type', format: 'text' },
          { key: 'firstVisitDate', label: 'Join Date', format: 'text' },
          { key: 'status', label: 'Status', format: 'text' },
        ]}
      />
    </>
  );
};

export default ExecutiveClientsSection;
