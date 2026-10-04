import React, { useEffect } from 'react';
import { ExpirationAnalyticsSection } from '@/components/dashboard/ExpirationAnalyticsSection';
import { useExpirationsData } from '@/hooks/useExpirationsData';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';
import { AnalyticsPageShell } from '@/components/ui/AnalyticsPageShell';
import { METRIC_DEFINITIONS } from '@/data/metricDefinitions';
import type { TickerItem } from '@/components/ui/KpiTicker';
import { formatNumber, formatPercentage } from '@/utils/formatters';

const ExpirationAnalytics = () => {
  const { data, loading, error } = useExpirationsData();
  const { setLoading } = useGlobalLoading();

  useEffect(() => {
    setLoading(loading, 'Loading expirations and churn data...');
  }, [loading, setLoading]);

  const rows = data || [];
  const total = rows.length;
  const churned = rows.filter((item) => item.status === 'Churned').length;
  const churnRate = total > 0 ? (churned / total) * 100 : 0;

  const tickerItems: TickerItem[] = [
    { label: 'Memberships', value: formatNumber(total) },
    { label: 'Active', value: formatNumber(rows.filter((item) => item.status === 'Active').length) },
    { label: 'Churned', value: formatNumber(churned), delta: formatPercentage(churnRate), tone: 'down' },
    { label: 'Frozen', value: formatNumber(rows.filter((item) => item.status === 'Frozen').length) },
  ];

  return (
    <AnalyticsPageShell
      title="Expirations & Churn"
      subtitle="Comprehensive analysis of membership expirations and customer retention insights"
      heroMetrics={tickerItems.map((item) => ({ label: item.label, value: item.value }))}
      tickerItems={tickerItems}
      definitions={METRIC_DEFINITIONS.expirations}
      error={error}
    >
      <ExpirationAnalyticsSection data={rows} />
    </AnalyticsPageShell>
  );
};

export default ExpirationAnalytics;
