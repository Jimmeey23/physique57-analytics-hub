import React, { useEffect, useMemo, useState } from 'react';
import { useSalesData } from '@/hooks/useSalesData';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';
import { EnhancedDiscountsDashboardV2 } from '@/components/dashboard/EnhancedDiscountsDashboardV2';
import { AnalyticsPageShell } from '@/components/ui/AnalyticsPageShell';
import { METRIC_DEFINITIONS } from '@/data/metricDefinitions';
import { formatCurrency } from '@/utils/formatters';
import { AdvancedExportButton } from '@/components/ui/AdvancedExportButton';
import { getDashboardDefaultDateRange, getPreviousMonthDisplay, parseDate } from '@/utils/dateUtils';

const DiscountsPromotions: React.FC = () => {
  const { setLoading } = useGlobalLoading();
  const { data: salesData, loading, error } = useSalesData();

  const discountData = useMemo(
    () => (salesData || []).map((item) => ({
      ...item,
      soldBy: item.soldBy === '-' ? 'Online/System' : (item.soldBy || 'Unknown'),
    })),
    [salesData],
  );

  const heroMetrics = useMemo(() => {
    if (!discountData || discountData.length === 0) return [];

    const defaultDateRange = getDashboardDefaultDateRange();
    const firstDayOfMonth = new Date(defaultDateRange.start);
    const lastDayOfMonth = new Date(`${defaultDateRange.end}T23:59:59.999`);

    // Filter data for that month
    const monthData = discountData.filter(item => {
      if (!item.paymentDate) return false;
      const itemDate = parseDate(item.paymentDate);
      return itemDate && itemDate >= firstDayOfMonth && itemDate <= lastDayOfMonth;
    });

    const locations = [
      { key: 'Kwality House, Kemps Corner', name: 'Kwality' },
      { key: 'Supreme HQ, Bandra', name: 'Supreme' },
      { key: 'Kenkere House', name: 'Kenkere' }
    ];

    return locations.map(location => {
      const locationData = monthData.filter(item => 
        location.key === 'Kenkere House' 
          ? item.calculatedLocation?.includes('Kenkere') || item.calculatedLocation === 'Kenkere House'
          : item.calculatedLocation === location.key
      );
      
      const totalDiscounts = locationData.reduce((sum, item) => sum + (item.discountAmount || 0), 0);
      
      return {
        location: location.name,
        label: `${getPreviousMonthDisplay()} Discounts`,
        value: formatCurrency(totalDiscounts)
      };
    });
  }, [discountData]);

  useEffect(() => {
    setLoading(loading, 'Loading discount and promotional analysis...');
  }, [loading, setLoading]);

  const exportButton = (
    <AdvancedExportButton 
      discountData={discountData}
      defaultFileName="discounts-promotions-export"
      size="sm"
      variant="ghost"
      buttonClassName="rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-white/30 dark:bg-transparent dark:text-white dark:hover:border-white/50 dark:hover:bg-white/10"
    />
  );

  return (
    <AnalyticsPageShell
      title="Discounts & Promotions"
      subtitle="Comprehensive analysis of discount strategies, promotional effectiveness, and customer savings patterns"
      heroMetrics={heroMetrics.map((metric) => ({ label: `${metric.location} · ${metric.label}`, value: metric.value }))}
      actions={exportButton}
      definitions={METRIC_DEFINITIONS.discounts}
      error={error}
      errorTitle="Connection error"
      className="discounts-promotions-unified"
    >
      <EnhancedDiscountsDashboardV2 data={discountData} />
    </AnalyticsPageShell>
  );
};

export default DiscountsPromotions;
