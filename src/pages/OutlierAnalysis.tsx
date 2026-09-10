import React, { useEffect, useMemo } from 'react';
import DashboardMotionHero from '@/components/ui/DashboardMotionHero';
import { KpiTicker } from '@/components/ui/KpiTicker';
import { MetricDefinitions } from '@/components/ui/MetricDefinitions';
import { METRIC_DEFINITIONS } from '@/data/metricDefinitions';
import { useGoogleSheets } from '@/hooks/useGoogleSheets';
import { useSessionsData } from '@/hooks/useSessionsData';
import { useCheckinsData } from '@/hooks/useCheckinsData';
import { useLeadsData } from '@/hooks/useLeadsData';
import { useNewClientData } from '@/hooks/useNewClientData';
import { usePayrollData } from '@/hooks/usePayrollData';
import { formatNumber } from '@/utils/formatters';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { GlobalFiltersProvider } from '@/contexts/GlobalFiltersContext';
import { DataLabWorkspace } from '@/components/dashboard/DataLabWorkspace';

const DataLabPageContent = () => {
  const { data: salesData, loading: salesLoading, error: salesError, refetch } = useGoogleSheets();
  const { data: sessionsData, loading: sessionsLoading } = useSessionsData();
  const { data: checkinsData, loading: checkinsLoading } = useCheckinsData();
  const { data: leadsData, loading: leadsLoading } = useLeadsData();
  const { data: newClientData, loading: newClientLoading } = useNewClientData();
  const { data: payrollData, isLoading: payrollLoading } = usePayrollData();
  const { setLoading } = useGlobalLoading();

  const loading =
    salesLoading || sessionsLoading || checkinsLoading || leadsLoading || newClientLoading || payrollLoading;

  useEffect(() => {
    setLoading(loading, 'Loading custom Data Lab sources...');
  }, [loading, setLoading]);

  const heroMetrics = useMemo(() => {
    return [
      {
        location: 'Sales',
        label: 'Rows',
        value: formatNumber((salesData || []).length),
      },
      {
        location: 'Sessions',
        label: 'Rows',
        value: formatNumber((sessionsData || []).length),
      },
      {
        location: 'Leads',
        label: 'Rows',
        value: formatNumber((leadsData || []).length),
      },
      {
        location: 'Payroll',
        label: 'Rows',
        value: formatNumber((payrollData || []).length),
      },
    ];
  }, [salesData, sessionsData, leadsData, payrollData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white relative overflow-hidden">

        <div className="relative z-10 container mx-auto px-6 py-10">
          <LoadingSkeleton type="full-page" />
        </div>
      </div>
    );
  }

  if (salesError) {
    return (
      <div className="min-h-screen bg-white relative overflow-hidden">

        <div className="relative z-10 container mx-auto px-6 py-10">
          <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-2xl shadow-sm">
            <div className="font-semibold text-lg mb-1">Failed to load Data Lab sources</div>
            <div className="text-sm opacity-90 mb-4">{String(salesError)}</div>
            <button
              onClick={refetch}
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const dataSources = {
    Sales: salesData || [],
    Sessions: sessionsData || [],
    Checkins: checkinsData || [],
    Leads: leadsData || [],
    NewClients: newClientData || [],
    Payroll: payrollData || [],
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">

      <div className="relative z-10">
        <div className="bg-white text-slate-800 slide-in-from-left">
          <DashboardMotionHero
            title="Custom Data Lab"
            subtitle="Build advanced pivot tables and chart models across any source, define source relationships, style outputs, and auto-save views."
            metrics={heroMetrics}
            onExportClick={() => {}}
          />

          <div className="container mx-auto px-6 pt-2">
            <KpiTicker items={heroMetrics} />
          </div>

          <div className="container mx-auto px-6 py-8">
            <DataLabWorkspace dataSources={dataSources} />
            <div className="pt-2">
              <MetricDefinitions items={METRIC_DEFINITIONS.outlierLab} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const OutlierAnalysis = () => {
  return (
    <GlobalFiltersProvider>
      <DataLabPageContent />
    </GlobalFiltersProvider>
  );
};

export default OutlierAnalysis;
