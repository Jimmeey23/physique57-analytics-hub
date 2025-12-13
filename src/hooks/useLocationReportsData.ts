import { useMemo } from 'react';
import { useSalesData } from '@/hooks/useSalesData';
import { useSessionsData } from '@/hooks/useSessionsData';
import { usePayrollData } from '@/hooks/usePayrollData';
import { useNewClientData } from '@/hooks/useNewClientData';
import { useLeadsData } from '@/hooks/useLeadsData';
import { useDiscountAnalysis } from '@/hooks/useDiscountAnalysis';
import { useLateCancellationsData } from '@/hooks/useLateCancellationsData';
import { useExpirationsData } from '@/hooks/useExpirationsData';
import { getPreviousMonthDateRange, parseDate } from '@/utils/dateUtils';
import type { LocationReportData, LocationReportMetrics } from '@/hooks/useLocationReportData';

type CanonicalLocation = 'All Locations' | 'Kwality House, Kemps Corner' | 'Supreme HQ, Bandra' | 'Kenkere House, Bengaluru';

const CANONICAL_LOCATIONS: CanonicalLocation[] = [
  'Kwality House, Kemps Corner',
  'Supreme HQ, Bandra',
  'Kenkere House, Bengaluru',
];

const ALL_REPORTS_ORDER: CanonicalLocation[] = ['All Locations', ...CANONICAL_LOCATIONS];

const monthNameFromRange = (startISO: string) => {
  const start = new Date(startISO);
  return start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const getItemLocation = (item: any): string => {
  return (
    item?.location ||
    item?.calculatedLocation ||
    item?.studio ||
    item?.Location ||
    item?.CalculatedLocation ||
    ''
  );
};

const matchesCanonicalLocation = (item: any, canonical: CanonicalLocation): boolean => {
  if (canonical === 'All Locations') return true;
  const loc = String(getItemLocation(item) || '').toLowerCase();
  if (!loc) return false;

  if (canonical === 'Kwality House, Kemps Corner') {
    return loc.includes('kwality') || loc.includes('kemps');
  }
  if (canonical === 'Supreme HQ, Bandra') {
    return loc.includes('supreme') || loc.includes('bandra');
  }
  if (canonical === 'Kenkere House, Bengaluru') {
    return loc.includes('kenkere') || loc.includes('bengaluru') || loc.includes('bangalore');
  }
  return false;
};

const getItemDate = (item: any): Date | null => {
  const raw = item?.date || item?.timestamp || item?.createdAt || item?.paymentDate;
  return raw ? parseDate(String(raw)) : null;
};

const inRange = (item: any, start: Date, end: Date): boolean => {
  const d = getItemDate(item);
  if (!d) return false;
  return d >= start && d <= end;
};

const num = (value: any): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const cleaned = String(value).replace(/[^0-9.-]/g, '');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

const computeMetrics = (input: {
  sales: any[];
  sessions: any[];
  payroll: any[];
  newClients: any[];
  leads: any[];
  discounts: any[];
  lateCancellations: any[];
  expirations: any[];
}): LocationReportMetrics => {
  const { sales, sessions, payroll, newClients, leads, discounts, lateCancellations, expirations } = input;

  // Revenue & Sales Performance
  const totalRevenue = sales.reduce((sum, item) => sum + num(item.paymentValue ?? item.grossRevenue ?? item.totalPaid ?? item.totalPaidAmount), 0);
  const vatAmount = sales.reduce((sum, item) => sum + num(item.paymentVAT ?? item.vat ?? item.vatAmount), 0);
  const netRevenue = sales.reduce((sum, item) => sum + num(item.netRevenue), 0) || (totalRevenue - vatAmount);

  const totalTransactions = sales.length;
  const uniqueMembers = new Set(sales.map((item) => item.memberId || item.customerId || item.MemberId || item['Member ID']).filter(Boolean)).size;
  const avgTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
  const avgSpendPerMember = uniqueMembers > 0 ? totalRevenue / uniqueMembers : 0;

  // Discounts
  const totalDiscounts = discounts.reduce((sum, item) => sum + num(item.discountAmount ?? item.totalDiscount ?? item.discountValue), 0);
  const discountRate = totalRevenue > 0 ? (totalDiscounts / totalRevenue) * 100 : 0;

  // Session & Class Performance
  const totalSessions = sessions.length;
  const totalCheckIns = sessions.reduce((sum, item) => sum + num(item.checkedInCount ?? item.checkIns ?? item.attendance), 0);
  const totalCapacity = sessions.reduce((sum, item) => sum + num(item.capacity), 0);
  const fillRate = totalCapacity > 0 ? (totalCheckIns / totalCapacity) * 100 : 0;
  const capacityUtilization = fillRate;

  const powerCycleSessions = sessions.filter((item) => {
    const name = String(item.sessionName ?? item.classType ?? '').toLowerCase();
    return name.includes('powercycle');
  }).length;
  const barreSessions = sessions.filter((item) => {
    const name = String(item.sessionName ?? item.classType ?? '').toLowerCase();
    return name.includes('barre');
  }).length;
  const strengthSessions = sessions.filter((item) => {
    const name = String(item.sessionName ?? item.classType ?? '').toLowerCase();
    return name.includes('strength');
  }).length;

  const lateCancellationCount = lateCancellations.length;
  const lateCancellationRevenueLoss = lateCancellations.reduce((sum, item) => sum + num(item.revenueImpact ?? item.revenueLoss ?? item.amount), 0);

  // Trainer Performance
  const trainerStats = payroll.reduce((acc, item) => {
    const trainerId = item.trainerId || item.trainerName || item.name;
    if (!trainerId) return acc;
    if (!acc[trainerId]) {
      acc[trainerId] = {
        name: item.trainerName || item.name || trainerId,
        sessions: 0,
        revenue: 0,
        customersServed: 0,
      };
    }
    acc[trainerId].sessions += 1;
    acc[trainerId].revenue += num(item.revenueGenerated ?? item.totalPaid ?? item.payout);
    acc[trainerId].customersServed += num(item.customersServed);
    return acc;
  }, {} as Record<string, any>);

  const trainerArray = Object.values(trainerStats);
  const totalTrainers = trainerArray.length;
  const sessionsPerTrainer = totalTrainers > 0 ? totalSessions / totalTrainers : 0;
  const avgClassSize = totalSessions > 0 ? totalCheckIns / totalSessions : 0;
  const revenuePerTrainer = totalTrainers > 0 ? totalRevenue / totalTrainers : 0;
  const topTrainer = trainerArray.reduce((top: any, trainer: any) => (trainer.revenue > (top?.revenue || 0) ? trainer : top), null);

  // Client Acquisition & Retention
  const newClientsAcquired = newClients.length;
  const trialClients = leads.filter((item) => String(item.status ?? '').toLowerCase().includes('trial')).length;
  const convertedClients = leads.filter((item) => String(item.status ?? '').toLowerCase().includes('converted')).length;
  const conversionRate = trialClients > 0 ? (convertedClients / trialClients) * 100 : 0;
  const averageLTV = newClients.reduce((sum, item) => sum + num(item.estimatedLTV ?? item.ltv), 0) / (newClients.length || 1);

  const churnedMembers = expirations.length;
  const churnRate = uniqueMembers > 0 ? (churnedMembers / uniqueMembers) * 100 : 0;
  const retentionRate = 100 - churnRate;

  // Lead Funnel
  const totalLeads = leads.length;
  const leadsConverted = convertedClients;
  const leadConversionRate = totalLeads > 0 ? (leadsConverted / totalLeads) * 100 : 0;

  const conversionTimes = leads
    .filter((lead) => lead.convertedDate && lead.createdAt)
    .map((lead) => {
      const created = parseDate(lead.createdAt);
      const converted = parseDate(lead.convertedDate);
      return created && converted ? Math.abs(converted.getTime() - created.getTime()) / (1000 * 60 * 60 * 24) : 0;
    });
  const avgConversionDays = conversionTimes.length > 0 ? conversionTimes.reduce((sum, days) => sum + days, 0) / conversionTimes.length : 0;

  const leadsBySource = leads.reduce((acc, lead) => {
    const source = String(lead.source || 'Unknown');
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Performance Indicators
  const sessionUtilization = fillRate;
  const overallScore =
    (0 /* revenueGrowth placeholder */ > 0 ? 25 : 0) +
    (sessionUtilization > 70 ? 25 : sessionUtilization > 50 ? 15 : 0) +
    (retentionRate > 80 ? 25 : retentionRate > 60 ? 15 : 0) +
    (conversionRate > 20 ? 25 : conversionRate > 10 ? 15 : 0);

  return {
    totalRevenue,
    netRevenue,
    vatAmount,
    totalTransactions,
    uniqueMembers,
    avgTransactionValue,
    avgSpendPerMember,
    revenueGrowth: 0,
    totalDiscounts,
    discountRate,
    totalSessions,
    totalCheckIns,
    fillRate,
    capacityUtilization,
    powerCycleSessions,
    barreSessions,
    strengthSessions,
    lateCancellations: lateCancellationCount,
    lateCancellationRevenueLoss,
    totalTrainers,
    sessionsPerTrainer,
    avgClassSize,
    revenuePerTrainer,
    topTrainerName: topTrainer?.name || '',
    topTrainerRevenue: topTrainer?.revenue || 0,
    newClientsAcquired,
    conversionRate,
    retentionRate,
    averageLTV,
    churnRate,
    churnedMembers,
    totalLeads,
    leadsConverted,
    leadConversionRate,
    avgConversionDays,
    leadsBySource,
    sessionUtilization,
    overallScore,
  };
};

export const useLocationReportsData = () => {
  const { data: salesData = [], loading: salesLoading } = useSalesData();
  const { data: sessionsData = [], loading: sessionsLoading } = useSessionsData();
  const { data: payrollData = [], isLoading: payrollLoading } = usePayrollData();
  const { data: newClientData = [], loading: clientsLoading } = useNewClientData();
  const { data: leadsData = [], loading: leadsLoading } = useLeadsData();
  const { data: discountData = [] } = useDiscountAnalysis();
  const { data: lateCancellationsData = [], loading: lateCancellationsLoading } = useLateCancellationsData();
  const { data: expirationsData = [], loading: expirationsLoading } = useExpirationsData();

  const isLoading =
    salesLoading ||
    sessionsLoading ||
    payrollLoading ||
    clientsLoading ||
    leadsLoading ||
    lateCancellationsLoading ||
    expirationsLoading;

  const reports = useMemo((): LocationReportData[] => {
    const previousMonth = getPreviousMonthDateRange();
    const start = parseDate(previousMonth.start);
    const end = parseDate(previousMonth.end);
    if (!start || !end) return [];

    const monthName = monthNameFromRange(previousMonth.start);

    const buildOne = (location: CanonicalLocation): LocationReportData => {
      const filter = (arr: any[]) =>
        arr.filter((item) => matchesCanonicalLocation(item, location) && inRange(item, start, end));

      const filtered = {
        sales: filter(salesData),
        sessions: filter(sessionsData),
        payroll: filter(payrollData),
        newClients: filter(newClientData),
        leads: filter(leadsData),
        discounts: filter(discountData),
        lateCancellations: filter(lateCancellationsData),
        expirations: filter(expirationsData),
      };

      const metrics = computeMetrics(filtered);

      return {
        reportPeriod: {
          startDate: previousMonth.start,
          endDate: previousMonth.end,
          monthName,
        },
        location,
        metrics,
        insights: {
          highlights: [],
          concerns: [],
          recommendations: [],
        },
        comparisons: {
          monthOverMonth: {},
          yearOverYear: {},
        },
      };
    };

    return ALL_REPORTS_ORDER.map(buildOne);
  }, [
    salesData,
    sessionsData,
    payrollData,
    newClientData,
    leadsData,
    discountData,
    lateCancellationsData,
    expirationsData,
  ]);

  return {
    reports,
    isLoading,
  };
};
