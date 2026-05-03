import React, { useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import { ExecutiveSectionCard } from './ExecutiveSectionCard';
import { ExpirationMetricCards } from './ExpirationMetricCards';
import { ExpirationDataTables } from './ExpirationDataTables';
import { ExpirationChartsGrid } from './ExpirationChartsGrid';
import { useExpirationsData } from '@/hooks/useExpirationsData';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { BrandSpinner } from '@/components/ui/BrandSpinner';
import { parseDate } from '@/utils/dateUtils';

interface ExecutiveExpirationsSectionProps {
  onMetricClick?: (metricData: any) => void;
}

export const ExecutiveExpirationsSection: React.FC<ExecutiveExpirationsSectionProps> = ({
  onMetricClick,
}) => {
  const { data: expirationsData, loading: expirationsLoading } = useExpirationsData();
  const { filters } = useGlobalFilters();

  // Filter expirations by date range and location
  const filteredExpirations = useMemo(() => {
    if (!expirationsData) return [];

    return expirationsData.filter(expiration => {
      // Apply date range filter — only exclude when date is known AND outside range
      if (filters.dateRange?.start && filters.dateRange?.end) {
        const expirationDate = parseDate(expiration.endDate);
        if (expirationDate) {
          const filterStart = new Date(filters.dateRange.start);
          const filterEnd = new Date(filters.dateRange.end);
          filterEnd.setHours(23, 59, 59, 999);
          if (expirationDate < filterStart || expirationDate > filterEnd) return false;
        }
      }

      // Apply location filter — normalise IDs to display names (case-insensitive)
      if (filters.location && filters.location.length > 0) {
        const locations = Array.isArray(filters.location) ? filters.location : [filters.location];
        const locStr = (expiration.homeLocation || '').toLowerCase();
        if (!locations.includes('all') && !locations.some(loc => {
          const l = loc.toLowerCase();
          if (l === 'kwality') return locStr.includes('kwality') || locStr.includes('kemps');
          if (l === 'supreme') return locStr.includes('supreme') || locStr.includes('bandra');
          if (l === 'kenkere') return locStr.includes('kenkere') || locStr.includes('bengaluru') || locStr.includes('bangalore');
          return locStr.includes(l) || l.includes(locStr);
        })) {
          return false;
        }
      }

      return true;
    });
  }, [expirationsData, filters.dateRange, filters.location]);

  if (expirationsLoading) {
    return (
      <ExecutiveSectionCard
        title="Membership Expirations"
        icon={AlertCircle}
        borderColor="sky"
        description="Upcoming expirations and retention opportunities"
      >
        <div className="flex items-center justify-center py-12">
          <BrandSpinner />
        </div>
      </ExecutiveSectionCard>
    );
  }

  return (
    <ExecutiveSectionCard
      title="Membership Expirations"
      icon={AlertCircle}
      borderColor="sky"
      description="Upcoming expirations and retention opportunities"
      contentClassName="space-y-8"
    >
      <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-4 shadow-sm">
        <h4 className="text-sm font-semibold text-slate-700 mb-4">Key Metrics</h4>
        <ExpirationMetricCards data={filteredExpirations} />
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm">
        <h4 className="text-sm font-semibold text-slate-700 mb-4">Expiration Trends</h4>
        <ExpirationChartsGrid data={filteredExpirations} />
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm">
        <h4 className="text-sm font-semibold text-slate-700 mb-4">Expiration Details</h4>
        <ExpirationDataTables data={filteredExpirations} />
      </div>
    </ExecutiveSectionCard>
  );
};

export default ExecutiveExpirationsSection;
