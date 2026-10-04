import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { AnalyticsPageShell } from '@/components/ui/AnalyticsPageShell';
import { SectionTabs } from '@/components/ui/SectionTabs';
import { METRIC_DEFINITIONS } from '@/data/metricDefinitions';
import { useLeadsData } from '@/hooks/useLeadsData';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';
import { countConvertedLeads, calculateConversionRate } from '@/utils/leadConversions';

// Import components
import { FunnelLeadsFilterSection } from '@/components/dashboard/FunnelLeadsFilterSection';
import { FunnelMetricCards } from '@/components/dashboard/FunnelMetricCards';
import { FunnelInteractiveCharts } from '@/components/dashboard/FunnelInteractiveCharts';
import FunnelMonthOnMonthTable from '@/components/dashboard/FunnelMonthOnMonthTable';
import { FunnelYearOnYearTable } from '@/components/dashboard/FunnelYearOnYearTable';
import { EnhancedFunnelRankings } from '@/components/dashboard/EnhancedFunnelRankings';
import { FunnelHealthMetricsTable } from '@/components/dashboard/FunnelHealthMetricsTable';
import { FunnelAnalyticsTables } from '@/components/dashboard/FunnelAnalyticsTables';
import { DataScienceInsightsPanel } from '@/components/dashboard/DataScienceInsightsPanel';
import { LazyFunnelDrillDownModal } from '@/components/lazy/LazyModals';
import { ModalSuspense } from '@/components/lazy/ModalSuspense';
import { LeadsFilterOptions } from '@/types/leads';
import { StudioLocationTabs } from '@/components/ui/StudioLocationTabs';
import { getActiveConsolidatedExportPreset } from '@/utils/consolidatedExportPreset';
import { getDashboardDefaultDateRange } from '@/utils/dateUtils';
import { useUrlParamState } from '@/hooks/useUrlParamState';
type FunnelTableView = 'analytics' | 'mom' | 'yoy' | 'health';

const FUNNEL_TABLE_VIEWS: Array<{ key: FunnelTableView; label: string; description: string }> = [
  { key: 'analytics', label: 'Analytics', description: 'Source, stage and associate performance for the filtered period.' },
  { key: 'mom', label: 'Month-on-Month', description: 'Monthly lead movement across all reporting months; the date filter is ignored.' },
  { key: 'yoy', label: 'Year-on-Year', description: 'Year comparison across all reporting months; the date filter is ignored.' },
  { key: 'health', label: 'Health Metrics', description: 'Funnel health signals for the filtered period.' },
];

export default function FunnelLeads() {
  const {
    data: allLeadsData,
    loading,
    error
  } = useLeadsData();
  const { setLoading } = useGlobalLoading();
  
  useEffect(() => {
    setLoading(loading, 'Loading funnel and lead conversion data...');
  }, [loading, setLoading]);
  const exportPreset = useMemo(() => (typeof window !== 'undefined' ? getActiveConsolidatedExportPreset(window.location.search) : null), []);
  const defaultDateRange = useMemo(() => getDashboardDefaultDateRange(), []);
  const [activeLocation, setActiveLocation] = useUrlParamState<string>('location', exportPreset?.studioId || 'all');
  const [activeTableView, setActiveTableView] = useUrlParamState<FunnelTableView>('view', 'analytics', {
    isValid: (value): value is FunnelTableView => FUNNEL_TABLE_VIEWS.some((option) => option.key === value),
  });
  const [filtersCollapsed, setFiltersCollapsed] = useState(true);
  const [chartsCollapsed, setChartsCollapsed] = useState(true);
  const [drillDownModal, setDrillDownModal] = useState<{
    isOpen: boolean;
    title: string;
    data: any[];
    type: string;
  }>({
    isOpen: false,
    title: '',
    data: [],
    type: ''
  });

  const [filters, setFilters] = useState<LeadsFilterOptions>(() => {
    return {
      dateRange: {
        start: exportPreset?.startDate || defaultDateRange.start,
        end: exportPreset?.endDate || defaultDateRange.end,
      },
      location: [],
      source: [],
      stage: [],
      status: [],
      associate: [],
      channel: [],
      trialStatus: [],
      conversionStatus: [],
      retentionStatus: [],
      minLTV: undefined,
      maxLTV: undefined
    };
  });

  // Filter data by location
  const locationFilteredData = useMemo(() => {
    if (!allLeadsData || activeLocation === 'all') return allLeadsData || [];
    return allLeadsData.filter(lead => {
      const leadCenter = lead.center?.toLowerCase() || '';
      switch (activeLocation) {
        case 'kwality':
          return leadCenter.includes('kwality') || leadCenter.includes('kemps');
        case 'supreme':
          return leadCenter.includes('supreme') || leadCenter.includes('bandra');
        case 'kenkere':
          return leadCenter.includes('kenkere');
        case 'popup':
          return leadCenter.includes('pop') || leadCenter.includes('popup') || leadCenter.includes('pop-up');
        default:
          return true;
      }
    });
  }, [allLeadsData, activeLocation]);

  // Apply additional filters to location-filtered data
  const filteredData = useMemo(() => {
    if (!locationFilteredData) return [];
    return locationFilteredData.filter(lead => {
      // Date range filter
      if (filters.dateRange.start || filters.dateRange.end) {
        const leadDate = new Date(lead.createdAt);
        if (filters.dateRange.start && leadDate < new Date(filters.dateRange.start)) return false;
        if (filters.dateRange.end && leadDate > new Date(filters.dateRange.end)) return false;
      }

      // Multi-select filters
      if (filters.location.length > 0 && !filters.location.some(loc => lead.center?.toLowerCase().includes(loc.toLowerCase()))) return false;
      if (filters.source.length > 0 && !filters.source.includes(lead.source)) return false;
      if (filters.stage.length > 0 && !filters.stage.includes(lead.stage)) return false;
      if (filters.status.length > 0 && !filters.status.includes(lead.status)) return false;
      if (filters.associate.length > 0 && !filters.associate.includes(lead.associate)) return false;
      if (filters.channel.length > 0 && !filters.channel.includes(lead.channel)) return false;
      if (filters.trialStatus.length > 0 && !filters.trialStatus.includes(lead.trialStatus)) return false;
      if (filters.conversionStatus.length > 0 && !filters.conversionStatus.includes(lead.conversionStatus)) return false;
      if (filters.retentionStatus.length > 0 && !filters.retentionStatus.includes(lead.retentionStatus)) return false;

      // LTV range filters
      if (filters.minLTV && lead.ltv < filters.minLTV) return false;
      if (filters.maxLTV && lead.ltv > filters.maxLTV) return false;
      return true;
    });
  }, [locationFilteredData, filters]);

  // Extract unique values for filter options
  const uniqueValues = useMemo(() => {
    if (!allLeadsData) return {
      locations: [],
      sources: [],
      stages: [],
      statuses: [],
      associates: [],
      channels: [],
      trialStatuses: [],
      conversionStatuses: [],
      retentionStatuses: []
    };
    return {
      locations: [...new Set(allLeadsData.map(lead => lead.center).filter(Boolean))],
      sources: [...new Set(allLeadsData.map(lead => lead.source).filter(Boolean))],
      stages: [...new Set(allLeadsData.map(lead => lead.stage).filter(Boolean))],
      statuses: [...new Set(allLeadsData.map(lead => lead.status).filter(Boolean))],
      associates: [...new Set(allLeadsData.map(lead => lead.associate).filter(Boolean))],
      channels: [...new Set(allLeadsData.map(lead => lead.channel).filter(Boolean))],
      trialStatuses: [...new Set(allLeadsData.map(lead => lead.trialStatus).filter(Boolean))],
      conversionStatuses: [...new Set(allLeadsData.map(lead => lead.conversionStatus).filter(Boolean))],
      retentionStatuses: [...new Set(allLeadsData.map(lead => lead.retentionStatus).filter(Boolean))]
    };
  }, [allLeadsData]);

  const handleFiltersChange = (newFilters: LeadsFilterOptions) => {
    setFilters(newFilters);
  };

  const resetAllFilters = () => {
    setActiveLocation('all');
    setFilters({
      dateRange: { start: defaultDateRange.start, end: defaultDateRange.end },
      location: [],
      source: [],
      stage: [],
      status: [],
      associate: [],
      channel: [],
      trialStatus: [],
      conversionStatus: [],
      retentionStatus: [],
      minLTV: undefined,
      maxLTV: undefined,
    });
  };
  const handleDrillDown = (title: string, data: any[], type: string) => {
    setDrillDownModal({
      isOpen: true,
      title,
      data,
      type
    });
  };
  
  // Remove individual loader - rely on global loader only
  
  const heroMetrics = [
    { label: 'Total Leads', value: filteredData.length.toLocaleString() },
    { label: 'Converted', value: countConvertedLeads(filteredData).toString() },
    { label: 'Conversion Rate', value: `${calculateConversionRate(filteredData).toFixed(1)}%` },
  ];

  return (
    <AnalyticsPageShell
      title="Funnel & Leads Analytics"
      subtitle="Analyze your marketing funnel, lead quality, source effectiveness, and conversion patterns to improve acquisition and retention."
      heroMetrics={heroMetrics}
      definitions={METRIC_DEFINITIONS.funnelLeads}
      error={error ? String(error) : null}
      errorTitle="Connection error"
      className="funnel-leads-unified"
      locationTabs={
        <StudioLocationTabs
          activeLocation={activeLocation}
          onLocationChange={setActiveLocation}
          showInfoPopover={true}
          infoPopoverContext="funnel-leads-overview"
        />
      }
    >
        {/* Content Sections */}
        <div className="space-y-8">
                  {!loading && allLeadsData.length === 0 && (
                    <Card className="bg-slate-50 border border-slate-200 shadow-sm">
                      <CardContent className="p-4">
                        <p className="text-sm text-slate-700">
                          No lead rows were returned from the data source. Please check the Leads sheet data and refresh.
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {!loading && allLeadsData.length > 0 && filteredData.length === 0 && (
                    <Card className="bg-amber-50/80 border border-amber-200 shadow-sm">
                      <CardContent className="p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <p className="text-sm text-amber-900">
                          No leads match the current filters. Reset filters to repopulate metric cards, tables, and rankings.
                        </p>
                        <Button variant="outline" className="border-amber-300 text-amber-900 hover:bg-amber-100" onClick={resetAllFilters}>
                          Reset Filters
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {/* Collapsible Filters Section */}
                  <Card className="bg-white/90 backdrop-blur-sm shadow-sm border border-gray-200 w-full">
                    <CardContent className="p-6 w-full">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Advanced Filters</h3>
                        <Button variant="ghost" size="sm" onClick={() => setFiltersCollapsed(!filtersCollapsed)} className="gap-2">
                          {filtersCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                          {filtersCollapsed ? 'Show Filters' : 'Hide Filters'}
                        </Button>
                      </div>
                      {!filtersCollapsed && <div className="w-full"><FunnelLeadsFilterSection filters={filters} onFiltersChange={handleFiltersChange} uniqueValues={uniqueValues} /></div>}
                    </CardContent>
                  </Card>

                  {/* Metric Cards */}
                  <FunnelMetricCards data={filteredData} onCardClick={handleDrillDown} />

                  <DataScienceInsightsPanel
                    title="Leads Data Science Toolkit"
                    description="Monitor distribution skew, outliers, and momentum shifts to prioritize high-quality lead segments."
                    data={filteredData}
                    initiallyCollapsed={true}
                    metricOptions={[
                      {
                        key: 'ltv',
                        label: 'Lead LTV',
                        accessor: (row: any) => Number(row?.ltv || 0),
                      },
                      {
                        key: 'convertedFlag',
                        label: 'Converted Leads (0/1)',
                        accessor: (row: any) => {
                          const status = String(row?.conversionStatus || row?.stage || '').toLowerCase();
                          return status.includes('convert') ? 1 : 0;
                        },
                      },
                      {
                        key: 'responseTimeDays',
                        label: 'Response Time (Days)',
                        accessor: (row: any) =>
                          Number(row?.responseDays || row?.daysToRespond || row?.daysToConversion || 0),
                      },
                    ]}
                    dateAccessor={(row: any) => {
                      const raw = row?.createdAt || row?.leadDate || row?.date;
                      if (!raw) return null;
                      const parsed = new Date(raw);
                      return Number.isNaN(parsed.getTime()) ? null : parsed;
                    }}
                  />

                  {/* Interactive Charts - Collapsible */}
                  <Card className="bg-white/90 backdrop-blur-sm shadow-sm border border-gray-200 w-full">
                    <CardContent className="p-6 w-full">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Interactive Charts</h3>
                        <Button variant="ghost" size="sm" onClick={() => setChartsCollapsed(!chartsCollapsed)} className="gap-2">
                          {chartsCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                          {chartsCollapsed ? 'Show Charts' : 'Hide Charts'}
                        </Button>
                      </div>
                      {!chartsCollapsed && (
                        <div className="w-full">
                          <FunnelInteractiveCharts data={filteredData} />
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Enhanced Rankings Section */}
                  <EnhancedFunnelRankings data={filteredData} />

                  {/* Tables Sub-Tabs */}
          <div className="space-y-4">
            <SectionTabs
              ariaLabel="Funnel table views"
              heading="Funnel tables"
              meta={`${filteredData.length.toLocaleString()} leads`}
              options={FUNNEL_TABLE_VIEWS}
              value={activeTableView}
              onChange={setActiveTableView}
            />

            {activeTableView === 'analytics' && <FunnelAnalyticsTables data={filteredData} onDrillDown={handleDrillDown} />}
            {/* MoM and YoY use all location data, independent of the page date filter. */}
            {activeTableView === 'mom' && <FunnelMonthOnMonthTable data={locationFilteredData} onDrillDown={handleDrillDown} />}
            {activeTableView === 'yoy' && <FunnelYearOnYearTable allData={locationFilteredData} onDrillDown={handleDrillDown} />}
            {activeTableView === 'health' && <FunnelHealthMetricsTable data={filteredData} />}
          </div>
      </div>

      {/* Drill Down Modal - Lazy loaded */}
      <ModalSuspense>
        {drillDownModal.isOpen && (
          <LazyFunnelDrillDownModal
            isOpen={drillDownModal.isOpen}
            onClose={() => setDrillDownModal(prev => ({ ...prev, isOpen: false }))}
            title={drillDownModal.title}
            data={drillDownModal.data}
            type={drillDownModal.type}
          />
        )}
      </ModalSuspense>
    </AnalyticsPageShell>
  );
}
