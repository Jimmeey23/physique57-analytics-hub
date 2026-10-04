import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { SectionTabs } from '@/components/ui/SectionTabs';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { useSalesData } from '@/hooks/useSalesData';
import { useLeadsData } from '@/hooks/useLeadsData';
import { useNewClientData } from '@/hooks/useNewClientData';
import { usePayrollData } from '@/hooks/usePayrollData';
import { useSessionsData } from '@/hooks/useSessionsData';
import { useLateCancellationsData } from '@/hooks/useLateCancellationsData';
import { useExpirationsData } from '@/hooks/useExpirationsData';
import { useCheckinsData } from '@/hooks/useCheckinsData';
import { filterByOverviewFilters } from '@/components/dashboard/overview/filtering';
import { overviewModules, overviewModulesById } from '@/components/dashboard/overview/registry';
import type { OverviewDataBundle, OverviewModuleId } from '@/components/dashboard/overview/types';
import { useUrlParamState } from '@/hooks/useUrlParamState';

/** Raw + filtered bundles for the overview modules, keyed off the global filters. */
export const useOverviewData = () => {
  const { filters } = useGlobalFilters();

  const { data: salesData = [] } = useSalesData();
  const { data: leadsData = [] } = useLeadsData();
  const { data: newClientsData = [] } = useNewClientData();
  const { data: payrollData = [] } = usePayrollData();
  const { data: sessionsData = [] } = useSessionsData();
  const { data: lateCancellationsData = [] } = useLateCancellationsData();
  const { data: expirationsData = [] } = useExpirationsData();
  const { data: checkinsData = [] } = useCheckinsData();

  const scope = React.useMemo(
    () => ({ dateRange: filters.dateRange, location: filters.location }),
    [filters.dateRange, filters.location]
  );

  const raw = React.useMemo<OverviewDataBundle>(
    () => ({
      sales: salesData,
      leads: leadsData,
      newClients: newClientsData,
      payroll: payrollData,
      sessions: sessionsData,
      lateCancellations: lateCancellationsData,
      expirations: expirationsData,
      checkins: checkinsData,
      filters: scope,
    }),
    [salesData, leadsData, newClientsData, payrollData, sessionsData, lateCancellationsData, expirationsData, checkinsData, scope]
  );

  const filtered = React.useMemo<OverviewDataBundle>(
    () => ({
      sales: filterByOverviewFilters(salesData, filters, {
        getDate: (item) => item.paymentDate,
        getLocation: (item) => item.calculatedLocation,
      }),
      leads: filterByOverviewFilters(leadsData, filters, {
        getDate: (item) => item.createdAt || item.period,
        getLocation: (item) => item.center,
      }),
      newClients: filterByOverviewFilters(newClientsData, filters, {
        getDate: (item) => item.firstVisitDate || item.monthYear,
        getLocation: (item) => item.homeLocation || item.firstVisitLocation,
      }),
      payroll: filterByOverviewFilters(payrollData, filters, {
        getDate: (item) => item.monthYear,
        getLocation: (item) => item.location,
      }),
      sessions: filterByOverviewFilters(sessionsData, filters, {
        getDate: (item) => item.date,
        getLocation: (item) => item.location,
      }),
      lateCancellations: filterByOverviewFilters(lateCancellationsData, filters, {
        getDate: (item) => item.dateIST,
        getLocation: (item) => item.location,
      }),
      expirations: filterByOverviewFilters(expirationsData, filters, {
        getDate: (item) => item.endDate || item.orderAt,
        getLocation: (item) => item.homeLocation,
      }),
      checkins: filterByOverviewFilters(checkinsData, filters, {
        getDate: (item) => item.dateIST,
        getLocation: (item) => item.location,
      }),
      filters: scope,
    }),
    [salesData, leadsData, newClientsData, payrollData, sessionsData, lateCancellationsData, expirationsData, checkinsData, filters, scope]
  );

  return { raw, filtered };
};

const MODULE_OPTIONS = overviewModules.map((module) => ({
  key: module.id,
  label: module.label,
  description: module.description,
  icon: module.icon,
}));

/**
 * Module switcher for the overview canvas. Filters, hero and ticker belong to
 * the host page, so this renders only the switcher and the active module.
 */
export const OverviewModulesView: React.FC<{ data: OverviewDataBundle }> = ({ data }) => {
  const [activeModuleId, setActiveModuleId] = useUrlParamState<OverviewModuleId>('module', 'sales-analytics', {
    isValid: (value): value is OverviewModuleId => value in overviewModulesById,
  });

  const ActiveAdapter = overviewModulesById[activeModuleId].adapter;

  return (
    <div className="space-y-6">
      <SectionTabs
        ariaLabel="Overview modules"
        heading="Module canvas"
        options={MODULE_OPTIONS}
        value={activeModuleId}
        onChange={setActiveModuleId}
      />

      <React.Suspense
        fallback={
          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardContent className="flex min-h-[420px] items-center justify-center p-8 text-sm text-slate-500">
              Loading overview module...
            </CardContent>
          </Card>
        }
      >
        <ActiveAdapter data={data} />
      </React.Suspense>
    </div>
  );
};

export default OverviewModulesView;
