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
  const [activeLocation, setActiveLocation] = useState('all');
  const [selectedFormats, setSelectedFormats] = useState<string[]>(['Barre', 'PowerCycle', 'Strength']);
  const [compareWithTrainer, setCompareWithTrainer] = useState(false);
  const exportRef = React.useRef<{ open: () => void }>(null);
  const [drill, setDrill] = useState<any | null>(null);

  useEffect(() => {
    setLoading(loading || checkinsLoading || payrollLoading, 'Loading class format comparison data...');
    console.log('ClassFormatsComparison - Data Status:', {
      sessionsData: data?.length || 0,
      sessionsLoading: loading,
      checkins: allCheckins?.length || 0,
      checkinsLoading,
      payrollData: payrollData?.length || 0,
      payrollLoading
    });
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
      const sessions = filteredByLocation.length;
      const capacity = filteredByLocation.reduce((sum, s) => sum + (s.capacity || 0), 0);
      const checkIns = filteredByLocation.reduce((sum, s) => sum + (s.checkedInCount || 0), 0);
      const revenue = filteredByLocation.reduce((sum, s) => sum + (s.totalPaid || 0), 0);
      const fill = capacity > 0 ? (checkIns / capacity) * 100 : 0;
      return { sessions, revenue, fill };
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

        <div className="container mx-auto px-6 py-8">
          {/* Location Tabs */}
          <Tabs value={activeLocation} onValueChange={setActiveLocation} className="w-full mb-8">
            <div className="flex justify-center mb-8">
              <TabsList className="location-tabs grid w-full max-w-4xl overflow-visible" style={{ gridTemplateColumns: `repeat(${locations.length}, 1fr)` }}>
                {locations.map(location => {
                  const parts = location.name.split(',').map(s => s.trim());
                  const mainName = parts[0] || location.name;
                  const subName = parts[1] || '';
                  return (
                    <TabsTrigger
                      key={location.id}
                      value={location.id}
                      className="location-tab-trigger group data-[state=active]:[--tab-accent:var(--hero-accent)]"
                    >
                      <span className="relative z-10 flex flex-col items-center leading-tight">
                        <span className="flex items-center gap-2 font-extrabold text-base sm:text-lg">
                          {mainName}
                        </span>
                        {subName && (
                          <span className="text-xs sm:text-sm opacity-90">{subName}</span>
                        )}
                      </span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            {locations.map(location => (
              <TabsContent key={location.id} value={location.id} className="space-y-8">
                {/* Sub-tabs: Overview | Trends | Detailed */}
                <Tabs defaultValue="overview" className="w-full">
                  <div className="flex justify-center">
                    <TabsList className="grid w-full max-w-3xl grid-cols-4">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="trends">Trends</TabsTrigger>
                      <TabsTrigger value="performance">Performance</TabsTrigger>
                      <TabsTrigger value="detailed">Detailed</TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="overview" className="space-y-8 mt-6">
                    {/* Debug info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <h3 className="font-semibold text-blue-800">Data Debug Info</h3>
                      <div className="text-blue-700 text-sm mt-2">
                        <p>Sessions data: {filteredByLocation?.length || 0} items</p>
                        <p>All sessions: {data?.length || 0} items</p>
                        <p>Active location: {activeLocation}</p>
                        <p>Loading states: Sessions({loading ? 'loading' : 'loaded'}), Checkins({checkinsLoading ? 'loading' : 'loaded'}), Payroll({payrollLoading ? 'loading' : 'loaded'})</p>
                      </div>
                    </div>

                    {filteredByLocation && filteredByLocation.length > 0 ? (
                      <>
                        {/* Filters */}
                        <SessionsFilterSection data={filteredByLocation} />

                        {/* Summary cards per format */}
                        <FormatComparisonSummaryCards data={filteredByLocation} />

                        {/* Interactive charts and tables with metric selector */}
                        <ComprehensiveClassFormatComparison 
                          data={filteredByLocation}
                          selectedFormats={selectedFormats}
                          onFormatsChange={setSelectedFormats}
                          compareWithTrainer={compareWithTrainer}
                          onCompareWithTrainerChange={setCompareWithTrainer}
                        />

                        {/* Class Type Performance Metrics */}
                        <ClassTypePerformanceMetrics 
                          data={filteredByLocation as any}
                          defaultGroupBy="classType"
                        />
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <div className="bg-gray-50 rounded-xl p-8">
                          <h3 className="text-lg font-semibold text-gray-800 mb-2">No Data Available</h3>
                          <p className="text-gray-600 mb-4">
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

                  <TabsContent value="trends" className="space-y-8 mt-6">
                    {/* MoM and YoY tables (independent of date filters; still respects location) */}
                    <FormatTrendsSection sessions={data || []} checkins={allCheckins} activeLocation={activeLocation} />

                    {/* Top and Bottom classes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <ImprovedSessionsTopBottomLists 
                        data={filteredByLocation}
                        title="Top Classes by Performance"
                        type="classes"
                        variant="top"
                        initialCount={10}
                      />
                      <ImprovedSessionsTopBottomLists 
                        data={filteredByLocation}
                        title="Bottom Classes by Performance"
                        type="classes"
                        variant="bottom"
                        initialCount={10}
                      />
                    </div>

                    {/* Top and Bottom trainers */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <ImprovedSessionsTopBottomLists 
                        data={filteredByLocation}
                        title="Top Trainers by Performance"
                        type="trainers"
                        variant="top"
                        initialCount={10}
                      />
                      <ImprovedSessionsTopBottomLists 
                        data={filteredByLocation}
                        title="Bottom Trainers by Performance"
                        type="trainers"
                        variant="bottom"
                        initialCount={10}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="performance" className="space-y-8 mt-6">
                    <PowerCycleVsBarreSection data={filteredPayrollByLocation as any} />
                  </TabsContent>

                  <TabsContent value="detailed" className="space-y-8 mt-6">
                    <PowerCycleBarreStrengthDetailedAnalytics 
                      data={filteredPayrollByLocation as any}
                      onItemClick={(item) => setDrill({ scope: 'detailed-format', item })}
                    />
                  </TabsContent>
                </Tabs>
              </TabsContent>
            ))}
          </Tabs>
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
    <div className="min-h-screen bg-gradient-to-br from-cyan-50/40 via-blue-50/30 to-purple-50/20 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-transparent to-white/50 backdrop-blur-[0.5px]"></div>
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
