import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import DashboardMotionHero from '@/components/ui/DashboardMotionHero';
import { useLeadsData } from '@/hooks/useLeadsData';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';
import { useNavigate } from 'react-router-dom';

// Import components
import { FunnelLeadsFilterSection } from '@/components/dashboard/FunnelLeadsFilterSection';
import { FunnelMetricCards } from '@/components/dashboard/FunnelMetricCards';
import { FunnelInteractiveCharts } from '@/components/dashboard/FunnelInteractiveCharts';
import FunnelMonthOnMonthTable from '@/components/dashboard/FunnelMonthOnMonthTable';
import { FunnelYearOnYearTable } from '@/components/dashboard/FunnelYearOnYearTable';
import { EnhancedFunnelRankings } from '@/components/dashboard/EnhancedFunnelRankings';
import { FunnelHealthMetricsTable } from '@/components/dashboard/FunnelHealthMetricsTable';
import { FunnelAnalyticsTables } from '@/components/dashboard/FunnelAnalyticsTables';
import { FunnelDrillDownModal } from '@/components/dashboard/FunnelDrillDownModal';
import { LeadsFilterOptions } from '@/types/leads';
import { getPreviousMonthDateRange } from '@/utils/dateUtils';
export default function FunnelLeads() {
  const {
    data: allLeadsData,
    loading,
    error
  } = useLeadsData();
  const { setLoading } = useGlobalLoading();
  const navigate = useNavigate();
  
  useEffect(() => {
    setLoading(loading, 'Loading funnel and lead conversion data...');
  }, [loading, setLoading]);
  const [activeLocation, setActiveLocation] = useState('all');
  const [filtersCollapsed, setFiltersCollapsed] = useState(true);
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

  // Get previous month date range function
  const getPreviousMonthRange = () => {
    const now = new Date();
    const firstDayPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    return {
      start: formatDate(firstDayPreviousMonth),
      end: formatDate(lastDayPreviousMonth)
    };
  };
  const [filters, setFilters] = useState<LeadsFilterOptions>(() => {
    const previousMonth = getPreviousMonthRange();
    return {
      dateRange: previousMonth,
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

  // Define locations
  const locations = useMemo(() => {
    const predefinedLocations = [{
      id: 'all',
      name: 'All Locations',
      fullName: 'All Locations'
    }, {
      id: 'kwality',
      name: 'Kwality House',
      fullName: 'Kwality House, Kemps Corner'
    }, {
      id: 'supreme',
      name: 'Supreme HQ',
      fullName: 'Supreme HQ, Bandra'
    }, {
      id: 'kenkere',
      name: 'Kenkere House',
      fullName: 'Kenkere House'
    }];
    return predefinedLocations;
  }, []);

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
  const handleDrillDown = (title: string, data: any[], type: string) => {
    setDrillDownModal({
      isOpen: true,
      title,
      data,
      type
    });
  };
  
  // Remove individual loader - rely on global loader only
  
  if (error) {
    return <div className="min-h-screen bg-gray-50/30 flex items-center justify-center p-4">
        <Card className="p-8 bg-white shadow-lg max-w-md">
          <CardContent className="text-center space-y-4">
            <RefreshCw className="w-12 h-12 text-red-600 mx-auto" />
            <div>
              <p className="text-lg font-semibold text-gray-800">Connection Error</p>
              <p className="text-sm text-gray-600 mt-2">{error?.toString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
      <DashboardMotionHero
        title="Funnel & Leads Analytics"
        subtitle="Analyze your marketing funnel, lead quality, source effectiveness, and conversion patterns to improve acquisition and retention."
        metrics={[
          { label: 'Total Leads', value: filteredData.length.toLocaleString() },
          { label: 'Converted', value: filteredData.filter(lead => lead.conversionStatus === 'Converted').length.toString() },
          { label: 'Conversion Rate', value: `${(filteredData.length ? (filteredData.filter(lead => lead.conversionStatus === 'Converted').length / filteredData.length * 100) : 0).toFixed(1)}%` },
        ]}
      />

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Location Tabs */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 overflow-hidden">
          <CardContent className="p-2">
            <Tabs value={activeLocation} onValueChange={setActiveLocation} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-slate-100 to-slate-200 p-2 rounded-2xl h-auto gap-2">
                {locations.map(location => <TabsTrigger key={location.id} value={location.id} className="rounded-xl px-6 py-4 font-semibold text-sm transition-all duration-300">
                    <div className="text-center">
                      <div className="font-bold">{location.name}</div>
                      <div className="text-xs opacity-75">{location.fullName}</div>
                    </div>
                  </TabsTrigger>)}
              </TabsList>

              {/* Tab Content */}
              {locations.map(location => <TabsContent key={location.id} value={location.id} className="space-y-8 mt-8">
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

                  {/* Interactive Charts */}
                  <FunnelInteractiveCharts data={filteredData} />

                  {/* Enhanced Rankings Section */}
                  <EnhancedFunnelRankings data={filteredData} />

                  {/* Tables Sub-Tabs */}
                  <Card className="bg-white/90 backdrop-blur-sm shadow-sm border border-gray-200 w-full">
                    <CardContent className="p-4 w-full">
                      <Tabs defaultValue="analytics" className="w-full">
                        <TabsList className="flex flex-wrap gap-2 bg-slate-100 p-2 rounded-xl">
                          <TabsTrigger value="analytics" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">Analytics</TabsTrigger>
                          <TabsTrigger value="mom" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">Month-on-Month</TabsTrigger>
                          <TabsTrigger value="yoy" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">Year-on-Year</TabsTrigger>
                          <TabsTrigger value="health" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">Health Metrics</TabsTrigger>
                        </TabsList>

                        <TabsContent value="analytics" className="mt-4">
                          <FunnelAnalyticsTables data={filteredData} onDrillDown={handleDrillDown} />
                        </TabsContent>

                        <TabsContent value="mom" className="mt-4">
                          {/* Uses ALL location data, independent from page date filters */}
                          <FunnelMonthOnMonthTable data={locationFilteredData} />
                        </TabsContent>

                        <TabsContent value="yoy" className="mt-4">
                          {/* Uses ALL location data, independent from page date filters */}
                          <FunnelYearOnYearTable allData={locationFilteredData} onDrillDown={handleDrillDown} />
                        </TabsContent>

                        <TabsContent value="health" className="mt-4">
                          <FunnelHealthMetricsTable data={filteredData} />
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>

                </TabsContent>)}
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Drill Down Modal */}
      <FunnelDrillDownModal isOpen={drillDownModal.isOpen} onClose={() => setDrillDownModal(prev => ({
      ...prev,
      isOpen: false
    }))} title={drillDownModal.title} data={drillDownModal.data} type={drillDownModal.type} />
    </div>;
}