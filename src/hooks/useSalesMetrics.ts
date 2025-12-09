import { useMemo } from 'react';
import { SalesData } from '@/types/dashboard';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { parseDate as robustParseDate } from '@/utils/dateUtils';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';

export interface SalesMetric {
  title: string;
  value: string;
  rawValue: number;
  change: number;
  changeDetails: {
    rate: number;
    isSignificant: boolean;
    trend: 'strong' | 'moderate' | 'weak';
  };
  icon: string;
  color: string;
  description: string;
  previousValue: string;
  previousRawValue: number;
  comparison: {
    current: number;
    previous: number;
    difference: number;
  };
  periodLabel?: string; // e.g., "Sep 2025 vs Aug 2025"
}

type UseSalesMetricsOptions = {
  /**
   * Comparison mode. 'previousPeriod' compares the selected date range to the immediately preceding
   * same-length range. Fallback to data-derived ranges if filters are absent.
   */
  compareMode?: 'previousMonth' | 'previousPeriod';
  /** Optional explicit date range to define the current period. If omitted, derives from currentData. */
  dateRange?: { start: string | Date; end: string | Date };
};

export const useSalesMetrics = (
  currentData: SalesData[],
  historicalData?: SalesData[],
  options: UseSalesMetricsOptions = { compareMode: 'previousMonth' }
) => {
  const { filters } = useGlobalFilters();
  
  const metrics = useMemo(() => {
    const compareMode: 'previousMonth' | 'previousPeriod' = options?.compareMode ?? 'previousMonth';
    if (!currentData || currentData.length === 0) {
      return [];
    }

    // Helper: robustly parse a payment date (handles DD/MM/YYYY and more)
    const parseDate = (d: any): Date | null => robustParseDate(typeof d === 'string' ? d : String(d));

    // Determine comparison ranges
  // Base dataset for both current and previous months: should not be limited by the current date filter,
  // only by the location context. Caller passes location-only historical data when possible.
  const base = historicalData && historicalData.length ? historicalData : currentData;

    const getFirstAndLast = (arr: SalesData[]) => {
      const dates = arr
        .map(it => parseDate((it as any).paymentDate))
        .filter((d): d is Date => !!d)
        .sort((a,b) => a.getTime() - b.getTime());
      return { first: dates[0], last: dates[dates.length - 1] };
    };

    // Prefer explicit dateRange; otherwise infer anchor date from base data
    let explicitStart: Date | null = null;
    let explicitEnd: Date | null = null;
    if (options?.dateRange?.start && options?.dateRange?.end) {
      explicitStart = new Date(options.dateRange.start);
      explicitEnd = new Date(options.dateRange.end);
      explicitEnd.setHours(23,59,59,999);
    } else if (filters?.dateRange?.start && filters?.dateRange?.end) {
      explicitStart = new Date(filters.dateRange.start);
      explicitEnd = new Date(filters.dateRange.end);
      explicitEnd.setHours(23,59,59,999);
    }

    // Anchor: for 'previousMonth' we use the selected period's end date month if provided; otherwise today.
    // For 'previousPeriod' we fall back to explicitEnd or data-derived last date.
    const anchorDate = compareMode === 'previousMonth'
      ? (explicitEnd || new Date())
      : (explicitEnd || getFirstAndLast(base).last || new Date());

    const monthStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

    let currentStart: Date;
    let currentEnd: Date;
    let prevStart: Date;
    let prevEnd: Date;

    let currentPeriodLabel: string | undefined;
    let previousPeriodLabel: string | undefined;

  if (compareMode === 'previousMonth') {
      currentStart = monthStart(anchorDate);
      currentEnd = monthEnd(anchorDate);
      const prevAnchor = new Date(currentStart.getFullYear(), currentStart.getMonth() - 1, 15);
      prevStart = monthStart(prevAnchor);
      prevEnd = monthEnd(prevAnchor);
      const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
      currentPeriodLabel = fmt(currentStart);
      previousPeriodLabel = fmt(prevStart);
    } else {
      // previousPeriod: same-length window
      // If explicit range given, respect it; else infer from base data
      const inferred = getFirstAndLast(currentData);
      const rangeStart = explicitStart || inferred.first || anchorDate;
      const rangeEnd = explicitEnd || inferred.last || anchorDate;
      currentStart = rangeStart;
      currentEnd = rangeEnd;
      const periodMs = Math.max(1, currentEnd.getTime() - currentStart.getTime() + 1);
      prevEnd = new Date(currentStart.getTime() - 1);
      prevStart = new Date(prevEnd.getTime() - periodMs + 1);
    }

    // Build datasets from base (prefer historicalData) so both months are computed consistently
    // Base records for MoM analysis
    const currentPeriodData = base.filter((it) => {
      const d = parseDate((it as any).paymentDate);
      return d && d >= currentStart && d <= currentEnd;
    });

    const previousPeriodData = base.filter((it) => {
      const d = parseDate((it as any).paymentDate);
      return d && d >= prevStart && d <= prevEnd;
    });

  // Sales metrics comparison analysis

    // Helper to coerce numeric fields (handles numeric strings)
    const num = (v: any): number => {
      if (typeof v === 'number') return isFinite(v) ? v : 0;
      if (typeof v === 'string') {
        const n = parseFloat(v.replace(/[,\s]/g, ''));
        return isNaN(n) ? 0 : n;
      }
      return 0;
    };
    // Calculate current period metrics
    const currentRevenue = currentPeriodData.reduce((sum, item) => sum + num((item as any).paymentValue), 0);
    const currentDiscount = currentPeriodData.reduce((sum, item) => sum + num((item as any).discountAmount), 0);
    const currentVAT = currentPeriodData.reduce((sum, item) => sum + (num((item as any).paymentVAT) || num((item as any).vat)), 0);
    const currentTransactions = new Set(currentPeriodData.map(item => (item as any).paymentTransactionId || (item as any).paymentTransactionID).filter(Boolean)).size;
    const currentMembers = new Set(currentPeriodData.map(item => item.memberId || item.customerEmail).filter(Boolean)).size;
    const currentUnits = new Set(currentPeriodData.map(item => (item as any).saleItemId || (item as any).saleItemID).filter(Boolean)).size;
    const currentATV = currentTransactions > 0 ? currentRevenue / currentTransactions : 0;
    const currentASV = currentMembers > 0 ? currentRevenue / currentMembers : 0;
    const currentDiscountPercentage = currentPeriodData.length > 0 ? 
      currentPeriodData.reduce((sum, item) => sum + num((item as any).discountPercentage), 0) / currentPeriodData.length : 0;

    // Calculate comparison period metrics (true previous period)
  const prevRevenue = previousPeriodData.reduce((sum, item) => sum + num((item as any).paymentValue), 0);
  const prevDiscount = previousPeriodData.reduce((sum, item) => sum + num((item as any).discountAmount), 0);
  const prevVAT = previousPeriodData.reduce((sum, item) => sum + (num((item as any).paymentVAT) || num((item as any).vat)), 0);
    const prevTransactions = new Set(previousPeriodData.map(item => (item as any).paymentTransactionId || (item as any).paymentTransactionID).filter(Boolean)).size;
    const prevMembers = new Set(previousPeriodData.map(item => item.memberId || item.customerEmail).filter(Boolean)).size;
    const prevUnits = new Set(previousPeriodData.map(item => (item as any).saleItemId || (item as any).saleItemID).filter(Boolean)).size;
    const prevATV = prevTransactions > 0 ? prevRevenue / prevTransactions : 0;
    const prevASV = prevMembers > 0 ? prevRevenue / prevMembers : 0;
    const prevDiscountPercentage = previousPeriodData.length > 0 ? 
      previousPeriodData.reduce((sum, item) => sum + num((item as any).discountPercentage), 0) / previousPeriodData.length : 0;

    // Debug logs removed for production performance

    // Calculate growth rates
    const calculateGrowth = (current: number, previous: number): { rate: number; isSignificant: boolean; trend: 'strong' | 'moderate' | 'weak' } => {
      if (previous === 0) return { rate: current > 0 ? 100 : 0, isSignificant: current > 0, trend: current > 0 ? 'moderate' : 'weak' };
      const rate = ((current - previous) / previous) * 100;
      const isSignificant = Math.abs(rate) >= 5;
      const trend = Math.abs(rate) >= 20 ? 'strong' : Math.abs(rate) >= 10 ? 'moderate' : 'weak';
      return { rate, isSignificant, trend };
    };

    const revenueGrowth = calculateGrowth(currentRevenue, prevRevenue);
    const transactionGrowth = calculateGrowth(currentTransactions, prevTransactions);
    const memberGrowth = calculateGrowth(currentMembers, prevMembers);
    const unitsGrowth = calculateGrowth(currentUnits, prevUnits);
    const atvGrowth = calculateGrowth(currentATV, prevATV);
    const asvGrowth = calculateGrowth(currentASV, prevASV);
    const discountGrowth = calculateGrowth(currentDiscount, prevDiscount);
    const discountPercentageGrowth = calculateGrowth(currentDiscountPercentage, prevDiscountPercentage);
    const vatGrowth = calculateGrowth(currentVAT, prevVAT);

    const calculatedMetrics: SalesMetric[] = [
      {
        title: "Sales Revenue",
        value: formatCurrency(currentRevenue),
        rawValue: currentRevenue,
        change: revenueGrowth.rate,
        changeDetails: revenueGrowth,
        icon: "DollarSign",
        color: "blue",
        description: "Total sales revenue across all transactions",
        previousValue: formatCurrency(prevRevenue),
        previousRawValue: prevRevenue,
        comparison: {
          current: currentRevenue,
          previous: prevRevenue,
          difference: currentRevenue - prevRevenue
        },
        periodLabel: currentPeriodLabel && previousPeriodLabel ? `${currentPeriodLabel} vs ${previousPeriodLabel}` : undefined
      },
      {
        title: "Units Sold",
        value: formatNumber(currentUnits),
        rawValue: currentUnits,
        change: unitsGrowth.rate,
        changeDetails: unitsGrowth,
        icon: "ShoppingCart",
        color: "green",
        description: "Total number of units/items sold",
        previousValue: formatNumber(prevUnits),
        previousRawValue: prevUnits,
        comparison: {
          current: currentUnits,
          previous: prevUnits,
          difference: currentUnits - prevUnits
        },
        periodLabel: currentPeriodLabel && previousPeriodLabel ? `${currentPeriodLabel} vs ${previousPeriodLabel}` : undefined
      },
      {
        title: "Transactions",
        value: formatNumber(currentTransactions),
        rawValue: currentTransactions,
        change: transactionGrowth.rate,
        changeDetails: transactionGrowth,
        icon: "Activity",
        color: "purple",
        description: "Number of completed transactions",
        previousValue: formatNumber(prevTransactions),
        previousRawValue: prevTransactions,
        comparison: {
          current: currentTransactions,
          previous: prevTransactions,
          difference: currentTransactions - prevTransactions
        },
        periodLabel: currentPeriodLabel && previousPeriodLabel ? `${currentPeriodLabel} vs ${previousPeriodLabel}` : undefined
      },
      {
        title: "Unique Members",
        value: formatNumber(currentMembers),
        rawValue: currentMembers,
        change: memberGrowth.rate,
        changeDetails: memberGrowth,
        icon: "Users",
        color: "orange",
        description: "Individual customers who made purchases",
        previousValue: formatNumber(prevMembers),
        previousRawValue: prevMembers,
        comparison: {
          current: currentMembers,
          previous: prevMembers,
          difference: currentMembers - prevMembers
        },
        periodLabel: currentPeriodLabel && previousPeriodLabel ? `${currentPeriodLabel} vs ${previousPeriodLabel}` : undefined
      },
      {
        title: "Avg Transaction Value",
        value: formatCurrency(currentATV),
        rawValue: currentATV,
        change: atvGrowth.rate,
        changeDetails: atvGrowth,
        icon: "Target",
        color: "cyan",
        description: "Average value per transaction",
        previousValue: formatCurrency(prevATV),
        previousRawValue: prevATV,
        comparison: {
          current: currentATV,
          previous: prevATV,
          difference: currentATV - prevATV
        },
        periodLabel: currentPeriodLabel && previousPeriodLabel ? `${currentPeriodLabel} vs ${previousPeriodLabel}` : undefined
      },
      {
        title: "Avg Spend per Member",
        value: formatCurrency(currentASV),
        rawValue: currentASV,
        change: asvGrowth.rate,
        changeDetails: asvGrowth,
        icon: "Calendar",
        color: "pink",
        description: "Average spending per unique customer",
        previousValue: formatCurrency(prevASV),
        previousRawValue: prevASV,
        comparison: {
          current: currentASV,
          previous: prevASV,
          difference: currentASV - prevASV
        },
        periodLabel: currentPeriodLabel && previousPeriodLabel ? `${currentPeriodLabel} vs ${previousPeriodLabel}` : undefined
      },
      {
        title: "Discount Value",
        value: formatCurrency(currentDiscount),
        rawValue: currentDiscount,
        change: discountGrowth.rate,
        changeDetails: discountGrowth,
        icon: "CreditCard",
        color: "red",
        description: "Total discount amount applied",
        previousValue: formatCurrency(prevDiscount),
        previousRawValue: prevDiscount,
        comparison: {
          current: currentDiscount,
          previous: prevDiscount,
          difference: currentDiscount - prevDiscount
        },
        periodLabel: currentPeriodLabel && previousPeriodLabel ? `${currentPeriodLabel} vs ${previousPeriodLabel}` : undefined
      },
      {
        title: "Discount Percentage",
        value: formatPercentage(currentDiscountPercentage),
        rawValue: currentDiscountPercentage,
        change: discountPercentageGrowth.rate,
        changeDetails: discountPercentageGrowth,
        icon: "ArrowDownRight",
        color: "amber",
        description: "Average discount rate applied",
        previousValue: formatPercentage(prevDiscountPercentage),
        previousRawValue: prevDiscountPercentage,
        comparison: {
          current: currentDiscountPercentage,
          previous: prevDiscountPercentage,
          difference: currentDiscountPercentage - prevDiscountPercentage
        },
        periodLabel: currentPeriodLabel && previousPeriodLabel ? `${currentPeriodLabel} vs ${previousPeriodLabel}` : undefined
      },
      {
        title: "VAT Amount",
        value: formatCurrency(currentVAT),
        rawValue: currentVAT,
        change: vatGrowth.rate,
        changeDetails: vatGrowth,
        icon: "Receipt",
        color: "green",
        description: "Total VAT collected from sales",
        previousValue: formatCurrency(prevVAT),
        previousRawValue: prevVAT,
        comparison: {
          current: currentVAT,
          previous: prevVAT,
          difference: currentVAT - prevVAT
        },
        periodLabel: currentPeriodLabel && previousPeriodLabel ? `${currentPeriodLabel} vs ${previousPeriodLabel}` : undefined
      }
    ];

    // Final sales metrics calculated

    return calculatedMetrics;
  }, [currentData, historicalData, options?.dateRange?.start, options?.dateRange?.end, filters?.dateRange?.start, filters?.dateRange?.end, options?.compareMode]);

  return { metrics };
};