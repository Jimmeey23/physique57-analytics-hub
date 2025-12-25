import React, { useMemo } from 'react';
import { ShoppingCart } from 'lucide-react';
import { ExecutiveSectionCard } from './ExecutiveSectionCard';
import { SalesAnimatedMetricCardsComponent } from './SalesAnimatedMetricCards';
import { ModernSalesTable } from './ModernSalesTable';
import { useSalesData } from '@/hooks/useSalesData';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { BrandSpinner } from '@/components/ui/BrandSpinner';

interface ExecutiveSalesSectionProps {
  locationId?: string;
  onMetricClick?: (metricData: any) => void;
}

export const ExecutiveSalesSection: React.FC<ExecutiveSalesSectionProps> = ({
  locationId,
  onMetricClick,
}) => {
  const { filters } = useGlobalFilters();
  const { data: salesData, loading: salesLoading } = useSalesData();

  // Get previous period data for comparison (same data for now - can be enhanced)
  const { data: previousSalesData } = useSalesData();

  // Prepare table data - top products/categories
  const tableData = useMemo(() => {
    if (!salesData || salesData.length === 0) return [];

    return salesData
      .slice(0, 8) // Top 8 items
      .map((item: any, index: number) => ({
        ...item,
        name: item.name || item.product || `Item ${index + 1}`,
        revenue: item.paymentValue || 0,
        transactions: 1, // Each row is one transaction
        discountAmount: item.paymentDiscount || 0,
        atv: item.paymentValue || 0,
        category: item.product || item.productCategory || 'General',
        previousRevenue: 0,
        previousTransactions: 0,
      }));
  }, [salesData]);

  if (salesLoading) {
    return (
      <ExecutiveSectionCard
        title="Sales Overview"
        icon={ShoppingCart}
        borderColor="emerald"
        description="Revenue, transactions, and ATV metrics"
      >
        <div className="flex items-center justify-center py-12">
          <BrandSpinner />
        </div>
      </ExecutiveSectionCard>
    );
  }

  return (
    <ExecutiveSectionCard
      title="Sales Overview"
      icon={ShoppingCart}
      borderColor="emerald"
      description="Revenue, transactions, and ATV metrics"
      contentClassName="space-y-6"
    >
      {/* Metric Cards */}
      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-4">Key Metrics</h4>
        <SalesAnimatedMetricCardsComponent
          data={salesData}
          historicalData={previousSalesData}
          dateRange={filters.dateRange}
          onMetricClick={onMetricClick}
          locationId={locationId}
        />
      </div>

      {/* Sales Table */}
      {tableData.length > 0 && (
        <div className="pt-4 border-t border-slate-100">
          <h4 className="text-sm font-semibold text-slate-700 mb-4">Top Products & Categories</h4>
          <ModernSalesTable
            data={tableData}
            loading={salesLoading}
            title=""
            maxHeight="400px"
            showFooter={true}
            footerData={{
              name: 'TOTAL',
              revenue: tableData.reduce((sum: number, item: any) => sum + item.revenue, 0),
              transactions: tableData.reduce((sum: number, item: any) => sum + item.transactions, 0),
              discountAmount: tableData.reduce((sum: number, item: any) => sum + item.discountAmount, 0),
              atv: tableData.reduce((sum: number, item: any) => sum + item.atv, 0) / tableData.length,
            }}
          />
        </div>
      )}
    </ExecutiveSectionCard>
  );
};

export default ExecutiveSalesSection;
