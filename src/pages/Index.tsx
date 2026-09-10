import React, { memo, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';
import { useGoogleSheets } from '@/hooks/useGoogleSheets';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';
import { PageHero } from '@/components/ui/PageHero';
import { KpiTicker } from '@/components/ui/KpiTicker';
import { MetricDefinitions } from '@/components/ui/MetricDefinitions';
import { METRIC_DEFINITIONS } from '@/data/metricDefinitions';
import { MetricCard, MetricGrid } from '@/components/ui/MetricCard';
import { ErrorState } from '@/components/ui/States';
import { OPEN_CONSOLIDATED_REPORT_EVENT } from '@/components/ui/consolidatedReportEvents';
import { FileBarChart } from 'lucide-react';

const Index = memo(() => {
  const navigate = useNavigate();
  const { setLoading } = useGlobalLoading();
  const { data, loading, error, refetch } = useGoogleSheets();

  const memoizedData = useMemo(() => data, [data]);
  const totalRecords = memoizedData.length;

  const totalRevenue = useMemo(
    () => memoizedData.reduce((sum, d) => sum + (d.grossRevenue || 0), 0),
    [memoizedData]
  );
  const uniqueMembers = useMemo(
    () => new Set(memoizedData.map(d => d.memberId).filter(Boolean)).size,
    [memoizedData]
  );

  const formatRevenue = (val: number): string => {
    if (val >= 1e7) return `₹${(val / 1e7).toFixed(1)}Cr`;
    if (val >= 1e5) return `₹${(val / 1e5).toFixed(1)}L`;
    if (val > 0) return `₹${val.toLocaleString('en-IN')}`;
    return '—';
  };

  useEffect(() => {
    setLoading(loading, 'Loading dashboard overview...');
  }, [loading, setLoading]);

  const handleSectionClick = useCallback((sectionId: string) => {
    if (sectionId === 'class-performance-series') {
      window.open('https://class-performance-series-001.vercel.app/', '_blank');
    } else if (sectionId === 'late-cancellations') {
      navigate('/late-cancellations');
    } else {
      navigate(`/${sectionId}`);
    }
  }, [navigate]);

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  if (loading) return null;

  if (error) {
    return (
      <ErrorState
        title="Connection error"
        description={String(error)}
        onRetry={handleRetry}
      />
    );
  }

  return (
    <div className="space-y-5 p57-stagger">
      <PageHero
        eyebrow="Physique 57 · India"
        title="Business Intelligence Dashboard"
        description="Revenue, attendance, retention and studio performance — live across every location."
        stats={[
          { value: formatRevenue(totalRevenue), label: 'Total revenue' },
          { value: uniqueMembers.toLocaleString(), label: 'Unique members' },
          { value: totalRecords.toLocaleString(), label: 'Records synced' },
        ]}
        actions={
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.dispatchEvent(new Event(OPEN_CONSOLIDATED_REPORT_EVENT))}
              className="gap-2"
            >
              <FileBarChart className="h-4 w-4" />
              Consolidated report
            </Button>
            <Button size="sm" onClick={handleRetry} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </>
        }
      />

      <KpiTicker
        items={[
          { label: 'Total revenue', value: formatRevenue(totalRevenue) },
          { label: 'Unique members', value: uniqueMembers.toLocaleString() },
          { label: 'Records synced', value: totalRecords.toLocaleString() },
          {
            label: 'Avg revenue / member',
            value: uniqueMembers > 0 ? formatRevenue(totalRevenue / uniqueMembers) : '—',
          },
        ]}
      />

      <MetricGrid cols={3} className="p57-stagger">
        <MetricCard label="Total revenue" value={formatRevenue(totalRevenue)} sub="Across all locations" accent="#0e9f6e" />
        <MetricCard label="Unique members" value={uniqueMembers.toLocaleString()} sub={`${totalRecords.toLocaleString()} records`} accent="#005eed" />
        <MetricCard label="Data status" value="Live" sub="Auto-sync enabled" accent="#7c5cf0" />
      </MetricGrid>

      <DashboardGrid onButtonClick={handleSectionClick} />

      <MetricDefinitions items={METRIC_DEFINITIONS.home} />
    </div>
  );
});

export default Index;
