import React from 'react';
import { Download, FileText, Gauge, LayoutDashboard, Radar } from 'lucide-react';

import { AnalyticsPageShell } from '@/components/ui/AnalyticsPageShell';
import { SectionTabs } from '@/components/ui/SectionTabs';
import { Button } from '@/components/ui/button';
import { AdvancedExportButton } from '@/components/ui/AdvancedExportButton';
import { ExecutiveFilterSection } from '@/components/dashboard/ExecutiveFilterSection';
import { ExecutiveSummarySection } from '@/components/dashboard/ExecutiveSummarySection';
import { OverviewModulesView, useOverviewData } from '@/components/dashboard/overview/OverviewModulesView';
import { OverviewPDFExportButton } from '@/components/dashboard/overview/OverviewPDFExportButton';
import {
  PerformanceCommandCenterView,
  usePerformanceCommandCenterModel,
} from '@/pages/PerformanceCommandCenter';
import { OVERVIEW_LOCATION_OPTIONS, getOverviewLocationLabel } from '@/components/dashboard/overview/filtering';
import { GlobalFiltersProvider, useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';
import { useDynamicHeroMetrics } from '@/hooks/useDynamicHeroMetrics';
import { useUrlParamState } from '@/hooks/useUrlParamState';
import { useSalesData } from '@/hooks/useSalesData';
import { useSessionsData } from '@/hooks/useSessionsData';
import { usePayrollData } from '@/hooks/usePayrollData';
import { useNewClientData } from '@/hooks/useNewClientData';
import { useLeadsData } from '@/hooks/useLeadsData';
import { useDiscountAnalysis } from '@/hooks/useDiscountAnalysis';
import { METRIC_DEFINITIONS } from '@/data/metricDefinitions';
import { getDashboardDefaultDateRange } from '@/utils/dateUtils';

type ExecutiveView = 'summary' | 'command' | 'modules';

const EXECUTIVE_VIEWS: Array<{ key: ExecutiveView; label: string; description: string; icon: React.ElementType }> = [
  {
    key: 'summary',
    label: 'Executive Summary',
    description: 'Revenue, attendance and growth headlines across every location.',
    icon: Gauge,
  },
  {
    key: 'command',
    label: 'Command Center',
    description: 'Consolidated operating view: metrics, trend, tables and rankings across six sections.',
    icon: Radar,
  },
  {
    key: 'modules',
    label: 'Module Canvas',
    description: 'Switch across the core analytics modules on one filtered canvas.',
    icon: LayoutDashboard,
  },
];

const ExecutiveCommandCenterContent: React.FC = () => {
  const [view, setView] = useUrlParamState<ExecutiveView>('view', 'summary', {
    isValid: (value): value is ExecutiveView => EXECUTIVE_VIEWS.some((option) => option.key === value),
  });

  const { filters, updateFilters } = useGlobalFilters();
  const { setLoading } = useGlobalLoading();
  const exportRef = React.useRef<{ open: () => void; close: () => void }>(null);

  const { data: salesData = [], loading: salesLoading } = useSalesData();
  const { data: sessionsData = [], loading: sessionsLoading } = useSessionsData();
  const { data: payrollData = [], isLoading: payrollLoading } = usePayrollData();
  const { data: newClientData = [], loading: clientsLoading } = useNewClientData();
  const { data: leadsData = [], loading: leadsLoading } = useLeadsData();
  const { data: discountData = [] } = useDiscountAnalysis();

  const { model, isLoading: commandLoading } = usePerformanceCommandCenterModel();
  const overview = useOverviewData();

  React.useEffect(() => {
    const isLoading = salesLoading || sessionsLoading || payrollLoading || clientsLoading || leadsLoading;
    setLoading(isLoading, 'Loading executive command center...');
  }, [salesLoading, sessionsLoading, payrollLoading, clientsLoading, leadsLoading, setLoading]);

  const heroMetrics = useDynamicHeroMetrics({
    salesData,
    sessionsData,
    leadsData,
    newClientsData: newClientData,
  });

  // One ticker for the page: headline metrics on the summary, the command
  // centre's own KPI row when that view is active.
  const tickerItems = React.useMemo(() => {
    if (view === 'command') {
      return model.metricCards.map((card) => ({
        label: card.label,
        value: card.formattedValue,
        delta: `${card.changePercent.toFixed(1)}%`,
        tone: card.trend,
      }));
    }
    if (view === 'modules') {
      const dateLabel =
        filters.dateRange.start || filters.dateRange.end
          ? `${filters.dateRange.start || 'Start'} to ${filters.dateRange.end || 'Now'}`
          : 'All dates';
      return [
        { label: 'Date Window', value: dateLabel },
        { label: 'Location', value: getOverviewLocationLabel(filters.location) },
      ];
    }
    return heroMetrics.map((metric) => ({ label: metric.label, value: metric.value }));
  }, [view, model.metricCards, filters.dateRange, filters.location, heroMetrics]);

  const clearToDefault = React.useCallback(() => {
    updateFilters({ dateRange: getDashboardDefaultDateRange(), location: ['Kwality House'] });
  }, [updateFilters]);

  const actions = (
    <div className="flex items-center gap-2">
      <Button
        onClick={() => exportRef.current?.open()}
        className="rounded-xl border border-white/30 bg-transparent px-4 py-2 text-sm font-semibold text-white hover:border-white/50"
        variant="ghost"
      >
        <Download className="mr-2 h-4 w-4" />
        Export All Data
      </Button>
      <Button
        onClick={() => document.getElementById('exec-pdf-trigger')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))}
        className="rounded-xl border border-white/30 bg-transparent px-4 py-2 text-sm font-semibold text-white hover:border-white/50"
        variant="ghost"
      >
        <FileText className="mr-2 h-4 w-4" />
        PDF Reports
      </Button>
    </div>
  );

  return (
    <AnalyticsPageShell
      title="Executive Command Center"
      subtitle="One canvas for the executive summary, the consolidated operating view, and every analytics module — on a single filter state."
      heroMetrics={heroMetrics}
      tickerItems={tickerItems}
      actions={actions}
      definitions={[
        ...METRIC_DEFINITIONS.executiveSummary,
        ...METRIC_DEFINITIONS.commandCenter,
        ...METRIC_DEFINITIONS.overview,
      ]}
      filters={
        <ExecutiveFilterSection
          availableLocations={OVERVIEW_LOCATION_OPTIONS}
          showExportButton={false}
          headerActions={<OverviewPDFExportButton data={overview.raw} filters={overview.raw.filters} />}
          onClearFilters={clearToDefault}
        />
      }
      sectionTabs={
        <SectionTabs
          ariaLabel="Executive views"
          heading="Executive views"
          options={EXECUTIVE_VIEWS}
          value={view}
          onChange={setView}
        />
      }
    >
      {view === 'summary' && <ExecutiveSummarySection />}
      {view === 'command' && <PerformanceCommandCenterView model={model} isLoading={commandLoading} />}
      {view === 'modules' && <OverviewModulesView data={overview.filtered} />}

      {/* Hidden export dialog wired for programmatic open */}
      <div className="hidden">
        <AdvancedExportButton
          renderTrigger={false}
          openRef={exportRef}
          salesData={salesData}
          sessionsData={sessionsData as never}
          newClientData={newClientData}
          payrollData={payrollData}
          lateCancellationsData={[]}
          discountData={discountData as never}
          defaultFileName="executive-command-center-export"
        />
      </div>
    </AnalyticsPageShell>
  );
};

const ExecutiveCommandCenter: React.FC = () => (
  <GlobalFiltersProvider>
    <ExecutiveCommandCenterContent />
  </GlobalFiltersProvider>
);

export default ExecutiveCommandCenter;
