import { SectionLayout } from '@/components/layout/SectionLayout';
import { KpiTicker } from '@/components/ui/KpiTicker';
import { MetricDefinitions } from '@/components/ui/MetricDefinitions';
import { METRIC_DEFINITIONS } from '@/data/metricDefinitions';
import React, { Suspense } from 'react';
import Rankings from '@/components/dashboard/Rankings';
// Below-the-fold table (pulls in framer-motion) — deferred out of the initial chunk.
const DataTableEnhanced = React.lazy(() =>
  import('@/components/dashboard/DataTableEnhanced').then((m) => ({ default: m.DataTableEnhanced })),
);
import { MetricsCardsEnhanced } from '@/components/dashboard/MetricsCardsEnhanced';
import { ExecutiveFilterSection } from '@/components/dashboard/ExecutiveFilterSection';
import { useSessionsData } from '@/hooks/useSessionsData';
import { useFilteredSessions } from '@/hooks/useFilteredSessions';
import { useMemo } from 'react';

export default function MainDashboard() {
  const { data: sessions = [] } = useSessionsData();
  const filteredSessions = useFilteredSessions(sessions);

  // Get unique locations for filter
  const availableLocations = useMemo(() => {
    const locations = new Set(sessions.map(s => s.location).filter(Boolean));
    return Array.from(locations).sort();
  }, [sessions]);

  return (
    <SectionLayout title="Main Dashboard">
      <div className="space-y-8">
        {/* Filter Section */}
        <ExecutiveFilterSection availableLocations={availableLocations} />
        <KpiTicker
          items={[
            { label: 'Sessions', value: filteredSessions.length.toLocaleString() },
            {
              label: 'Check-ins',
              value: filteredSessions.reduce((sum, s) => sum + (s.checkedInCount || 0), 0).toLocaleString(),
            },
            { label: 'Locations', value: availableLocations.length.toLocaleString() },
          ]}
        />
        
        {/* Metrics Cards Section */}
        <MetricsCardsEnhanced sessions={filteredSessions} />
        
        {/* Rankings Section */}
        <Rankings sessions={filteredSessions} />
        
        {/* Data Table Section */}
        <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-slate-100" />}>
          <DataTableEnhanced sessions={filteredSessions} />
        </Suspense>

        <MetricDefinitions items={METRIC_DEFINITIONS.mainDashboard} />
      </div>
    </SectionLayout>
  );
}
