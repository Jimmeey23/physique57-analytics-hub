import React, { useEffect, useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardMotionHero from '@/components/ui/DashboardMotionHero';
import { Footer } from '@/components/ui/footer';
import { AdvancedExportButton } from '@/components/ui/AdvancedExportButton';
import { useSessionsData } from '@/hooks/useSessionsData';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';
import { SessionsFiltersProvider } from '@/contexts/SessionsFiltersContext';
import { SessionsFilterSection } from '@/components/dashboard/SessionsFilterSection';
import { useFilteredSessionsData } from '@/hooks/useFilteredSessionsData';
import { FormatComparisonSummaryCards } from '@/components/dashboard/FormatComparisonSummaryCards';
import { ComprehensiveClassFormatComparison } from '@/components/dashboard/ComprehensiveClassFormatComparison';
import { ImprovedSessionsTopBottomLists } from '@/components/dashboard/ImprovedSessionsTopBottomLists';
import { formatCurrency } from '@/utils/formatters';
import { useLateCancellationsData } from '@/hooks/useLateCancellationsData';
import ClassFormatsMoMTable from '@/components/dashboard/ClassFormatsMoMTable';
import ClassFormatsYoYTable from '@/components/dashboard/ClassFormatsYoYTable';
import ClassFormatsMoMDetails from '@/components/dashboard/ClassFormatsMoMDetails';
import ClassFormatsYoYDetails from '@/components/dashboard/ClassFormatsYoYDetails';
import ClassTypePerformanceMetrics from '@/components/dashboard/ClassTypePerformanceMetrics';
import type { SessionData } from '@/hooks/useSessionsData';
import { useSessionsFilters } from '@/contexts/SessionsFiltersContext';
import { ModernDrillDownModal } from '@/components/dashboard/ModernDrillDownModal';
import { usePayrollData } from '@/hooks/usePayrollData';
import { PowerCycleBarreStrengthDetailedAnalytics } from '@/components/dashboard/PowerCycleBarreStrengthDetailedAnalytics';
import { PowerCycleVsBarreSection } from '@/components/dashboard/PowerCycleVsBarreSection';
import { InfoPopover } from '@/components/ui/InfoPopover';
import { FormatPerformanceHeatMap } from '@/components/dashboard/FormatPerformanceHeatMap';
import { AdvancedFormatMetrics } from '@/components/dashboard/AdvancedFormatMetrics';
import { SmartInsightsPanel } from '@/components/dashboard/SmartInsightsPanel';
import { FormatProfitabilityMatrix } from '@/components/dashboard/FormatProfitabilityMatrix';

const locations = [
  { id: 'all', name: 'All Locations, ', fullName: 'All Locations' },
  { id: 'kwality', name: 'Kwality House, Kemps Corner', fullName: 'Kwality House, Kemps Corner' },
  { id: 'supreme', name: 'Supreme HQ, Bandra', fullName: 'Supreme HQ, Bandra' },
  { id: 'kenkere', name: 'Kenkere House, Bengaluru', fullName: 'Kenkere House' }
];

const ClassFormatsComparison: React.FC = () => {
  const { data, loading } = useSessionsData();
  const { allCheckins, loading: checkinsLoading } = useLateCancellationsData();
  const { data: payrollData = [], isLoading: payrollLoading } = usePayrollData();
  const { setLoading } = useGlobalLoading();
  const [activeLocation, setActiveLocation] = useState('kwality');
  const [selectedFormats, setSelectedFormats] = useState<string[]>(['Barre', 'PowerCycle', 'Strength']);
  const [compareWithTrainer, setCompareWithTrainer] = useState(false);
  const exportRef = React.useRef<{ open: () => void }>(null);
  const [drill, setDrill] = useState<any | null>(null);

  useEffect(() => {
    setLoading(loading || checkinsLoading || payrollLoading, 'Loading class format comparison data...');
  }, [loading, checkinsLoading, payrollLoading, setLoading, data, allCheckins, payrollData]);

  // NOTE: We must read filters within the provider. We'll render an inner component below.
  // Global drilldown event bridge
  useEffect(() => {
    const handler = (e: any) => {
      const detail = e?.detail || {};
      setDrill((prev: any) => ({ type: 'class', ...detail }));
    };
    window.addEventListener('open-drilldown', handler as any);
    return () => window.removeEventListener('open-drilldown', handler as any);
  }, []);

  // Inner section that can read filters from context (lives under provider)
  const FormatTrendsSection: React.FC<{ sessions: SessionData[]; checkins: any[]; activeLocation: string }>
    = ({ sessions, checkins, activeLocation }) => {
    const { filters } = useSessionsFilters();
    const filteredSessionsByFilters = useFilteredSessionsData(sessions || []);
    const filteredSessionsByLocation = React.useMemo(() => {
      if (activeLocation === 'all') return filteredSessionsByFilters;
      return filteredSessionsByFilters.filter(s => {
        const sl = String(s.location || '').toLowerCase();
        if (activeLocation === 'kwality') return sl.includes('kwality');
        if (activeLocation === 'supreme') return sl.includes('supreme');
        if (activeLocation === 'kenkere') return sl.includes('kenkere');
        return true;
      });
    }, [filteredSessionsByFilters, activeLocation]);
    const filteredCheckinsByLocation = React.useMemo(() => {
      const rows = Array.isArray(checkins) ? checkins : [];
      const passesFilters = (row: any) => {
        const name = String(row.sessionName || '').toLowerCase();
        if (name.includes('test') || name.includes('demo')) return false;
        if (!filters) return true;
        if (filters.trainers.length > 0 && !filters.trainers.includes(row.teacherName)) return false;
        if (filters.classTypes.length > 0 && !filters.classTypes.includes(row.cleanedClass)) return false;
        if (filters.dayOfWeek.length > 0 && !filters.dayOfWeek.includes(row.dayOfWeek)) return false;
        if (filters.timeSlots.length > 0 && !filters.timeSlots.includes(row.time)) return false;
        // Intentionally ignore dateRange for MoM/YoY tables per request
        return true;
      };
      const byLoc = rows.filter(r => {
        if (!passesFilters(r)) return false;
        if (activeLocation === 'all') return true;
        const rl = String(r.location || '').toLowerCase();
        if (activeLocation === 'kwality') return rl.includes('kwality');
        if (activeLocation === 'supreme') return rl.includes('supreme');
        if (activeLocation === 'kenkere') return rl.includes('kenkere');
        return true;
      });
      return byLoc;
    }, [checkins, filters, activeLocation]);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ClassFormatsMoMTable sessions={sessions as any} checkins={filteredCheckinsByLocation} />
        <ClassFormatsYoYTable sessions={sessions as any} checkins={filteredCheckinsByLocation} />
        <div className="lg:col-span-2 grid grid-cols-1 gap-6">
          <ClassFormatsMoMDetails sessions={filteredSessionsByLocation as any} />
          <ClassFormatsYoYDetails sessions={filteredSessionsByLocation as any} />
        </div>
      </div>
    );
  };

  // Inner body rendered under SessionsFiltersProvider so filtering applies globally within page
  const ClassFormatsBody: React.FC<{ sessions: SessionData[]; allCheckins: any[] }>
    = ({ sessions, allCheckins }) => {
    const filteredAll = useFilteredSessionsData(sessions || []);
    const filteredByLocation = useMemo(() => {
      if (activeLocation === 'all') return filteredAll;
      const loc = locations.find(l => l.id === activeLocation);
      if (!loc) return filteredAll;
      return filteredAll.filter(s => {
        const sl = (s.location || '').toLowerCase();
        if (activeLocation === 'kwality') return sl.includes('kwality');
        if (activeLocation === 'supreme') return sl.includes('supreme');
        if (activeLocation === 'kenkere') return sl.includes('kenkere');
        return s.location === loc.fullName;
      });
    }, [filteredAll, activeLocation]);

    // Filter payroll by location for Detailed tab
    const filteredPayrollByLocation = useMemo(() => {
      if (activeLocation === 'all') return payrollData;
      const loc = (activeLocation || '').toLowerCase();
      return (payrollData || []).filter((p: any) => {
        const pl = String(p.location || '').toLowerCase();
        if (loc === 'kwality') return pl.includes('kwality');
        if (loc === 'supreme') return pl.includes('supreme');
        if (loc === 'kenkere') return pl.includes('kenkere');
        return true;
      });
    }, [payrollData, activeLocation]);

    const heroTotals = useMemo(() => {
      // Use FILTERED data (includes global filters AND location filters)
      const baseData = filteredByLocation;
      
      const sessionsCount = baseData.length;
      const capacity = baseData.reduce((sum, s) => sum + (s.capacity || 0), 0);
      const checkIns = baseData.reduce((sum, s) => sum + (s.checkedInCount || 0), 0);
      const revenue = baseData.reduce((sum, s) => sum + (s.totalPaid || 0), 0);
      const fill = capacity > 0 ? (checkIns / capacity) * 100 : 0;
      return { sessions: sessionsCount, revenue, fill };
    }, [filteredByLocation]);

    const exportButton = (
      <AdvancedExportButton 
        sessionsData={filteredByLocation as any}
        defaultFileName={`class-formats-${activeLocation}`}
        size="sm"
        variant="ghost"
        buttonClassName="rounded-xl border border-white/30 text-white hover:border-white/50"
      />
    );

    // Build drilldown payload data based on current state
    const buildDrillData = useMemo(() => {
      if (!drill) return null;
      const scope = drill.scope as string | undefined;
      const row = drill.row || {};
      const groupBy = drill.groupBy as string | undefined;
      const item = drill.item;

      // Focused handling for Detailed Format Analytics (payroll-driven)
      if (scope === 'detailed-format') {
        const trainerName = item?.trainer?.teacherName as string | undefined;
        const rawType = String(item?.type || ''); // e.g., powercycle-trainer
        const formatKey = rawType.split('-')[0];
        const map: Record<string, string> = { powercycle: 'PowerCycle', barre: 'Barre', strength: 'Strength' };
        const targetClassType = map[formatKey];

        const sessionsFiltered = filteredByLocation.filter(s => {
          const trainerOk = trainerName ? (s.trainerName === trainerName || (s as any).instructor === trainerName) : true;
          const classOk = targetClassType ? (s.classType === targetClassType || s.cleanedClass === targetClassType) : true;
          return trainerOk && classOk;
        });

        const checkinsFiltered = (allCheckins || []).filter((c: any) => {
          const loc = String(c.location || '').toLowerCase();
          if (activeLocation === 'kwality' && !loc.includes('kwality')) return false;
          if (activeLocation === 'supreme' && !loc.includes('supreme')) return false;
          if (activeLocation === 'kenkere' && !loc.includes('kenkere')) return false;
          const cls = c.cleanedClass || c['Cleaned Class'];
          const t = c.teacherName || c['Teacher Name'];
          const trainerOk = trainerName ? (t === trainerName) : true;
          const classOk = targetClassType ? (cls === targetClassType) : true;
          return trainerOk && classOk;
        });

        return { scope, trainerName, targetClassType, sessionsFiltered, checkinsFiltered, payrollItem: item };
      }

      // Filter sessions by group and row context
      const sessionsFiltered = filteredByLocation.filter(s => {
        const matchesGroup = groupBy === 'uniqueId1' ? (s.uniqueId1 === row.group)
          : groupBy === 'uniqueId2' ? (s.uniqueId2 === row.group)
          : (s.classType === row.group || row.group === undefined);
        const matchesRow = (
          (!row.day || s.dayOfWeek === row.day) &&
          (!row.time || s.time === row.time) &&
          (!row.cls || s.cleanedClass === row.cls || s.classType === row.cls) &&
          (!row.trainer || s.trainerName === row.trainer)
        );
        return matchesGroup && matchesRow;
      });

      // Filter checkins similarly (respect active location) when needed
      const checkinsFiltered = (allCheckins || []).filter((c: any) => {
        const loc = String(c.location || '').toLowerCase();
        if (activeLocation === 'kwality' && !loc.includes('kwality')) return false;
        if (activeLocation === 'supreme' && !loc.includes('supreme')) return false;
        if (activeLocation === 'kenkere' && !loc.includes('kenkere')) return false;
        // match class and trainer broadly
        const cls = c.cleanedClass || c['Cleaned Class'];
        const t = c.teacherName || c['Teacher Name'];
        const day = c.dayOfWeek || c['Day of Week'];
        const time = c.time || c['Time'];
        const groupMatch = groupBy === 'uniqueId1' ? sessionsFiltered.some(s => s.uniqueId1 === (drill?.row?.group))
          : groupBy === 'uniqueId2' ? sessionsFiltered.some(s => s.uniqueId2 === (drill?.row?.group))
          : sessionsFiltered.length > 0;
        const rowMatch = (!row.cls || (cls === row.cls)) && (!row.trainer || (t === row.trainer)) && (!row.day || (day === row.day)) && (!row.time || (time === row.time));
        return groupMatch && rowMatch;
      });

      return { scope, row, groupBy, sessionsFiltered, checkinsFiltered };
    }, [drill, filteredByLocation, allCheckins, activeLocation]);

    return (
      <>
        <DashboardMotionHero 
          title="Class Formats & Performance Analysis"
          subtitle="Comprehensive PowerCycle vs Barre vs Strength comparison with performance metrics and analytics"
          metrics={[
            { label: 'Total Sessions', value: heroTotals.sessions.toLocaleString() },
            { label: 'Avg Fill', value: `${heroTotals.fill.toFixed(1)}%` },
            { label: 'Total Revenue', value: formatCurrency(heroTotals.revenue) },
          ]}
          extra={exportButton}
        />

        <div className="container mx-auto px-6 py-10">
          {/* Filters Section - Above Location Tabs */}
          <div className="mb-8">
            <SessionsFilterSection data={sessions} />
          </div>

          {/* Location Tabs - Styled EXACTLY like Sales page */}
          <div className="flex justify-center mb-8" id="location-tabs">
            <div className="w-full max-w-4xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1"></div>
                <InfoPopover context="class-formats-overview" locationId={activeLocation} />
              </div>
              <div className="grid grid-cols-4 location-tabs">
                {locations.map(location => {
                  const parts = location.name.split(',').map(s => s.trim());
                  const mainName = parts[0] || location.name;
                  const subName = parts[1] || '';
                  
                  // Calculate count for this location
                  const locationData = location.id === 'all' ? sessions : sessions.filter(s => {
                    const sl = (s.location || '').toLowerCase();
                    if (location.id === 'kwality') return sl.includes('kwality');
                    if (location.id === 'supreme') return sl.includes('supreme');
                    if (location.id === 'kenkere') return sl.includes('kenkere');
                    return false;
                  });
                  const count = locationData.length;
                  
                  return (
                    <button
                      key={location.id}
                      onClick={() => setActiveLocation(location.id)}
                      className={`location-tab-trigger group ${activeLocation === location.id ? 'data-[state=active]:[--tab-accent:var(--hero-accent)]' : ''}`}
                      data-state={activeLocation === location.id ? 'active' : 'inactive'}
                      style={activeLocation === location.id ? { '--tab-accent': 'var(--hero-accent, #3b82f6)' } as React.CSSProperties : undefined}
                    >
                      <span className="relative z-10 flex flex-col items-center leading-tight">
                        <span className="flex items-center gap-2 font-extrabold text-base sm:text-lg">{mainName}</span>
                        <span className="text-xs sm:text-sm opacity-90">{subName} ({count})</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Location Tab Content */}
          <div className="space-y-8">{locations.map(location => {
            // Calculate filtered data specific to THIS location tab
            const locationFilteredData = location.id === 'all' ? filteredAll : filteredAll.filter(s => {
              const sl = (s.location || '').toLowerCase();
              if (location.id === 'kwality') return sl.includes('kwality');
              if (location.id === 'supreme') return sl.includes('supreme');
              if (location.id === 'kenkere') return sl.includes('kenkere');
              return false;
            });

            // Filter payroll data for this specific location
            const locationPayrollData = location.id === 'all' ? payrollData : (payrollData || []).filter((p: any) => {
              const pl = String(p.location || '').toLowerCase();
              if (location.id === 'kwality') return pl.includes('kwality');
              if (location.id === 'supreme') return pl.includes('supreme');
              if (location.id === 'kenkere') return pl.includes('kenkere');
              return false;
            });

            return (
            <div key={location.id} style={{ display: activeLocation === location.id ? 'block' : 'none' }}>
              {/* Enhanced Sub-tabs: Overview | Trends | Performance | Advanced | Detailed */}
              <Tabs defaultValue="overview" className="w-full">
                <div className="flex justify-center mb-8">
                  <TabsList className="bg-gradient-to-r from-white/95 via-white/90 to-white/95 backdrop-blur-lg p-3 rounded-3xl shadow-2xl border border-white/20 grid grid-cols-5 gap-2 w-full max-w-5xl">
                    <TabsTrigger value="overview" className="relative rounded-2xl px-6 py-4 font-bold text-sm md:text-base w-full justify-center min-h-[56px] transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-indigo-600 data-[state=active]:via-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-2xl data-[state=active]:shadow-indigo-500/50 data-[state=active]:scale-105 hover:bg-gradient-to-br hover:from-gray-100 hover:to-gray-50 hover:scale-102 text-gray-700">
                      <span className="relative z-10">Overview</span>
                    </TabsTrigger>
                    <TabsTrigger value="trends" className="relative rounded-2xl px-6 py-4 font-bold text-sm md:text-base w-full justify-center min-h-[56px] transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-indigo-600 data-[state=active]:via-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-2xl data-[state=active]:shadow-indigo-500/50 data-[state=active]:scale-105 hover:bg-gradient-to-br hover:from-gray-100 hover:to-gray-50 hover:scale-102 text-gray-700">
                      <span className="relative z-10">Trends</span>
                    </TabsTrigger>
                    <TabsTrigger value="performance" className="relative rounded-2xl px-6 py-4 font-bold text-sm md:text-base w-full justify-center min-h-[56px] transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-indigo-600 data-[state=active]:via-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-2xl data-[state=active]:shadow-indigo-500/50 data-[state=active]:scale-105 hover:bg-gradient-to-br hover:from-gray-100 hover:to-gray-50 hover:scale-102 text-gray-700">
                      <span className="relative z-10">Performance</span>
                    </TabsTrigger>
                    <TabsTrigger value="advanced" className="relative rounded-2xl px-6 py-4 font-bold text-sm md:text-base w-full justify-center min-h-[56px] transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-indigo-600 data-[state=active]:via-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-2xl data-[state=active]:shadow-indigo-500/50 data-[state=active]:scale-105 hover:bg-gradient-to-br hover:from-gray-100 hover:to-gray-50 hover:scale-102 text-gray-700">
                      <span className="relative z-10">Advanced</span>
                    </TabsTrigger>
                    <TabsTrigger value="detailed" className="relative rounded-2xl px-6 py-4 font-bold text-sm md:text-base w-full justify-center min-h-[56px] transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-indigo-600 data-[state=active]:via-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-2xl data-[state=active]:shadow-indigo-500/50 data-[state=active]:scale-105 hover:bg-gradient-to-br hover:from-gray-100 hover:to-gray-50 hover:scale-102 text-gray-700">
                      <span className="relative z-10">Detailed</span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                  <TabsContent value="overview" className="space-y-10 mt-8">
                    {/* Enhanced Debug info */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-indigo-200/50 rounded-3xl p-8 mb-10 shadow-xl">
                      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
                      <h3 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 text-lg mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Data Debug Info
                      </h3>
                      <div className="relative grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-indigo-100">
                          <p className="text-indigo-600 font-semibold">Sessions</p>
                          <p className="text-2xl font-bold text-indigo-900">{locationFilteredData?.length || 0}</p>
                        </div>
                        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-purple-100">
                          <p className="text-purple-600 font-semibold">All Sessions</p>
                          <p className="text-2xl font-bold text-purple-900">{data?.length || 0}</p>
                        </div>
                        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-pink-100">
                          <p className="text-pink-600 font-semibold">Location</p>
                          <p className="text-lg font-bold text-pink-900 capitalize">{location.id}</p>
                        </div>
                        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-blue-100">
                          <p className="text-blue-600 font-semibold">Status</p>
                          <p className="text-xs font-medium text-blue-900 space-y-1">
                            <span className={`inline-block px-2 py-1 rounded-full ${loading ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                              Sessions: {loading ? 'Loading' : 'Ready'}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {locationFilteredData && locationFilteredData.length > 0 ? (
                      <div className="space-y-10">
                        {/* Summary cards per format */}
                        <div className="animate-fade-in">
                          <FormatComparisonSummaryCards data={locationFilteredData} />
                        </div>

                        {/* Interactive charts and tables with metric selector */}
                        <div className="animate-fade-in delay-100">
                          <ComprehensiveClassFormatComparison 
                            data={locationFilteredData}
                            selectedFormats={selectedFormats}
                            onFormatsChange={setSelectedFormats}
                            compareWithTrainer={compareWithTrainer}
                            onCompareWithTrainerChange={setCompareWithTrainer}
                          />
                        </div>

                        {/* Class Type Performance Metrics */}
                        <div className="animate-fade-in delay-200">
                          <ClassTypePerformanceMetrics 
                            data={locationFilteredData as any}
                            defaultGroupBy="classType"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-20">
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-12 shadow-2xl border border-gray-200 max-w-2xl mx-auto">
                          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
                            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                          </div>
                          <h3 className="text-2xl font-bold text-gray-800 mb-3">No Data Available</h3>
                          <p className="text-gray-600 mb-6 text-lg">
                            {loading || checkinsLoading || payrollLoading 
                              ? 'Loading data...' 
                              : 'No session data found for the selected location and filters.'
                            }
                          </p>
                          <p className="text-sm text-gray-500">
                            Raw data: {data?.length || 0} sessions, {allCheckins?.length || 0} checkins
                          </p>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="trends" className="space-y-10 mt-8">
                    {/* MoM and YoY tables (independent of date filters; still respects location) */}
                    <div className="animate-fade-in">
                      <FormatTrendsSection sessions={data || []} checkins={allCheckins} activeLocation={location.id} />
                    </div>

                    {/* Top and Bottom classes */}
                    <div className="animate-fade-in delay-100">
                      <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-6">Class Performance Rankings</h2>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <ImprovedSessionsTopBottomLists 
                          data={locationFilteredData}
                          title="Top Classes by Performance"
                          type="classes"
                          variant="top"
                          initialCount={10}
                        />
                        <ImprovedSessionsTopBottomLists 
                          data={locationFilteredData}
                          title="Bottom Classes by Performance"
                          type="classes"
                          variant="bottom"
                          initialCount={10}
                        />
                      </div>
                    </div>

                    {/* Top and Bottom trainers */}
                    <div className="animate-fade-in delay-200">
                      <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-6">Trainer Performance Rankings</h2>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <ImprovedSessionsTopBottomLists 
                          data={locationFilteredData}
                          title="Top Trainers by Performance"
                          type="trainers"
                          variant="top"
                          initialCount={10}
                        />
                        <ImprovedSessionsTopBottomLists 
                          data={locationFilteredData}
                          title="Bottom Trainers by Performance"
                          type="trainers"
                          variant="bottom"
                          initialCount={10}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="performance" className="space-y-10 mt-8">
                    <div className="animate-fade-in">
                      <PowerCycleVsBarreSection data={locationPayrollData as any} />
                    </div>
                  </TabsContent>

                  <TabsContent value="advanced" className="space-y-10 mt-8">
                    {/* Smart Insights Panel */}
                    <div className="animate-fade-in">
                      <SmartInsightsPanel data={locationFilteredData} />
                    </div>

                    {/* Enhanced Format-Specific Tabs */}
                    <div className="animate-fade-in delay-100">
                      <Tabs defaultValue="all" className="w-full">
                        <div className="flex justify-center mb-8">
                          <TabsList className="bg-white/90 backdrop-blur-lg p-2 rounded-2xl shadow-xl border border-indigo-100/50 grid grid-cols-4 gap-2 w-full max-w-3xl">
                            <TabsTrigger value="all" className="rounded-xl px-4 py-3 font-semibold text-sm transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-indigo-50">
                              All Formats
                            </TabsTrigger>
                            <TabsTrigger value="barre" className="rounded-xl px-4 py-3 font-semibold text-sm transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-rose-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-pink-50">
                              Barre
                            </TabsTrigger>
                            <TabsTrigger value="powercycle" className="rounded-xl px-4 py-3 font-semibold text-sm transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-blue-50">
                              PowerCycle
                            </TabsTrigger>
                            <TabsTrigger value="strength" className="rounded-xl px-4 py-3 font-semibold text-sm transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-emerald-50">
                              Strength Lab
                            </TabsTrigger>
                          </TabsList>
                        </div>

                        <TabsContent value="all" className="space-y-10">
                          {/* Heat Map Visualization */}
                          <FormatPerformanceHeatMap data={locationFilteredData} />

                          {/* Advanced Metrics Dashboard */}
                          <AdvancedFormatMetrics data={locationFilteredData} />

                          {/* BCG Matrix - Profitability Analysis */}
                          <FormatProfitabilityMatrix data={locationFilteredData} />
                        </TabsContent>

                        <TabsContent value="barre" className="space-y-10">
                          {/* Heat Map for Barre */}
                          <FormatPerformanceHeatMap 
                            data={locationFilteredData.filter(s => s.classType === 'Barre' || s.cleanedClass === 'Barre')} 
                            selectedFormat="Barre"
                          />

                          {/* Advanced Metrics for Barre */}
                          <AdvancedFormatMetrics 
                            data={locationFilteredData.filter(s => s.classType === 'Barre' || s.cleanedClass === 'Barre')} 
                            singleFormat={true}
                          />
                        </TabsContent>

                        <TabsContent value="powercycle" className="space-y-10">
                          {/* Heat Map for PowerCycle */}
                          <FormatPerformanceHeatMap 
                            data={locationFilteredData.filter(s => s.classType === 'PowerCycle' || s.cleanedClass === 'PowerCycle')} 
                          selectedFormat="PowerCycle"
                        />

                        {/* Advanced Metrics for PowerCycle */}
                        <AdvancedFormatMetrics 
                          data={locationFilteredData.filter(s => s.classType === 'PowerCycle' || s.cleanedClass === 'PowerCycle')} 
                          singleFormat={true}
                        />
                      </TabsContent>

                      <TabsContent value="strength" className="space-y-10">
                        {/* Heat Map for Strength */}
                        <FormatPerformanceHeatMap 
                          data={locationFilteredData.filter(s => s.classType === 'Strength' || s.cleanedClass === 'Strength')} 
                          selectedFormat="Strength"
                        />

                        {/* Advanced Metrics for Strength */}
                        <AdvancedFormatMetrics 
                          data={locationFilteredData.filter(s => s.classType === 'Strength' || s.cleanedClass === 'Strength')} 
                          singleFormat={true}
                        />
                      </TabsContent>
                    </Tabs>
                    </div>
                  </TabsContent>

                  <TabsContent value="detailed" className="space-y-10 mt-8">
                    <div className="animate-fade-in">
                      <PowerCycleBarreStrengthDetailedAnalytics 
                        data={locationPayrollData as any}
                        onItemClick={(item) => setDrill({ scope: 'detailed-format', item })}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            );
          })}</div>
        </div>
        {drill && (
          <ModernDrillDownModal
            isOpen={!!drill}
            onClose={() => setDrill(null)}
            data={buildDrillData || drill}
            type="class"
          />
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-pink-50/40 relative overflow-hidden">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 -left-20 w-96 h-96 bg-gradient-to-r from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 -right-20 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-gradient-to-r from-cyan-400/15 to-blue-400/15 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>
      
      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]"></div>
      
      <div className="relative z-10">
      <SessionsFiltersProvider>
        <ClassFormatsBody sessions={data || []} allCheckins={allCheckins || []} />
      </SessionsFiltersProvider>
      <Footer />
      </div>
    </div>
  );
};

export default ClassFormatsComparison;
