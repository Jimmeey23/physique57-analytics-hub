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
  // Year-on-year comparison
  yoyChange?: number;
  yoyChangeDetails?: {
    rate: number;
    isSignificant: boolean;
    trend: 'strong' | 'moderate' | 'weak';
  };
  yoyPreviousValue?: string;
  yoyPreviousRawValue?: number;
  yoyPeriodLabel?: string; // e.g., "Sep 2025 vs Sep 2024"
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

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
const endOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

const normalizeInputDate = (value?: string | Date, end = false): Date | null => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return end ? endOfDay(date) : startOfDay(date);
};

const isFullCalendarMonthRange = (start: Date, end: Date) => {
  const monthStart = new Date(start.getFullYear(), start.getMonth(), 1);
  const monthEnd = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999);
  return (
    start.getTime() === monthStart.getTime() &&
    end.getTime() === monthEnd.getTime() &&
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth()
  );
};

export const useSalesMetrics = (
  currentData: SalesData[],
  historicalData?: SalesData[],
  options: UseSalesMetricsOptions = { compareMode: 'previousPeriod' }
) => {
  const { filters } = useGlobalFilters();
  
  const metrics = useMemo(() => {
    const compareMode: 'previousMonth' | 'previousPeriod' = options?.compareMode ?? 'previousMonth';
    if (!currentData || currentData.length === 0) {
      return [];
    }

    // Helper: robustly parse a payment date (handles DD/MM/YYYY and more)
    const parseDate = (d: any): Date | null => robustParseDate(typeof d === 'string' ? d : String(d));

    // Base dataset for previous-period / YoY comparisons should ignore only the current date filter,
    // not the other active filters. Caller passes the location/filter aware historical set when possible.
    const base = historicalData && historicalData.length ? historicalData : currentData;

    const getFirstAndLast = (arr: SalesData[]) => {
      const dates = arr
        .map(it => parseDate((it as any).paymentDate))
        .filter((d): d is Date => !!d)
        .sort((a,b) => a.getTime() - b.getTime());
      return { first: dates[0], last: dates[dates.length - 1] };
    };

    // Prefer explicit dateRange; otherwise infer the period from the already filtered currentData.
    let explicitStart: Date | null = null;
    let explicitEnd: Date | null = null;
    if (options?.dateRange?.start && options?.dateRange?.end) {
      explicitStart = normalizeInputDate(options.dateRange.start, false);
      explicitEnd = normalizeInputDate(options.dateRange.end, true);
    } else if (filters?.dateRange?.start && filters?.dateRange?.end) {
      explicitStart = normalizeInputDate(filters.dateRange.start, false);
      explicitEnd = normalizeInputDate(filters.dateRange.end, true);
    }

    const currentBounds = getFirstAndLast(currentData);
    const inferredCurrentStart = currentBounds.first ? startOfDay(currentBounds.first) : null;
    const inferredCurrentEnd = currentBounds.last ? endOfDay(currentBounds.last) : null;
    const anchorDate = explicitEnd || inferredCurrentEnd || getFirstAndLast(base).last || new Date();

    const monthStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

    let currentStart: Date;
    let currentEnd: Date;
    let prevStart: Date;
    let prevEnd: Date;

    let currentPeriodLabel: string | undefined;
    let previousPeriodLabel: string | undefined;

    const selectedStart = explicitStart || inferredCurrentStart;
    const selectedEnd = explicitEnd || inferredCurrentEnd;

    if (compareMode === 'previousMonth' && selectedStart && selectedEnd && isFullCalendarMonthRange(selectedStart, selectedEnd)) {
      currentStart = selectedStart;
      currentEnd = selectedEnd;
      const prevAnchor = new Date(currentStart.getFullYear(), currentStart.getMonth() - 1, 15);
      prevStart = monthStart(prevAnchor);
      prevEnd = monthEnd(prevAnchor);
      const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
      currentPeriodLabel = fmt(currentStart);
      previousPeriodLabel = fmt(prevStart);
    } else {
      // Use the actual selected/current period and compare to the immediately preceding same-length period.
      const rangeStart = selectedStart || startOfDay(anchorDate);
      const rangeEnd = selectedEnd || endOfDay(anchorDate);
      currentStart = rangeStart;
      currentEnd = rangeEnd;
      const periodMs = Math.max(1, currentEnd.getTime() - currentStart.getTime() + 1);
      prevEnd = new Date(currentStart.getTime() - 1);
      prevStart = new Date(prevEnd.getTime() - periodMs + 1);
      currentPeriodLabel = `${currentStart.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })} to ${currentEnd.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}`;
      previousPeriodLabel = `${prevStart.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })} to ${prevEnd.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}`;
    }

    // Current metrics must always reflect the actually displayed/filtered data for the selected period.
    const currentPeriodData = currentData;

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
    // Calculate current period metrics - using NET revenue (paymentValue - VAT)
    // Revenue Definitions:
    // - paymentValue = Net revenue after discount, before VAT
    // - paymentValue - VAT = Net revenue after discount and VAT
    // - paymentValue + discountAmount = Gross revenue before discount
    const currentRevenue = currentPeriodData.reduce((sum, item) => {
      const payment = num((item as any).paymentValue);
      const vat = num((item as any).paymentVAT) || num((item as any).vat);
      return sum + (payment - vat);
    }, 0);
    const currentDiscount = currentPeriodData.reduce((sum, item) => sum + num((item as any).discountAmount), 0);
    const currentVAT = currentPeriodData.reduce((sum, item) => sum + (num((item as any).paymentVAT) || num((item as any).vat)), 0);
    const currentTransactions = new Set(currentPeriodData.map(item => (item as any).paymentTransactionId || (item as any).paymentTransactionID).filter(Boolean)).size;
    const currentMembers = new Set(currentPeriodData.map(item => item.memberId || item.customerEmail).filter(Boolean)).size;
    const currentUnits = new Set(currentPeriodData.map(item => (item as any).saleItemId || (item as any).saleItemID).filter(Boolean)).size;
    const currentATV = currentTransactions > 0 ? currentRevenue / currentTransactions : 0;
    const currentASV = currentMembers > 0 ? currentRevenue / currentMembers : 0;
    // Calculate discount percentage correctly: Total Discounts / (Total Revenue + Total Discounts) * 100
    const currentGrossRevenue = currentPeriodData.reduce((sum, item) => sum + num((item as any).paymentValue), 0);
    const currentDiscountPercentage = (currentGrossRevenue + currentDiscount) > 0 ? 
      (currentDiscount / (currentGrossRevenue + currentDiscount)) * 100 : 0;

    // Calculate comparison period metrics (true previous period) - using NET revenue (paymentValue - VAT)
  const prevRevenue = previousPeriodData.reduce((sum, item) => {
      const payment = num((item as any).paymentValue);
      const vat = num((item as any).paymentVAT) || num((item as any).vat);
      return sum + (payment - vat);
    }, 0);
  const prevDiscount = previousPeriodData.reduce((sum, item) => sum + num((item as any).discountAmount), 0);
  const prevVAT = previousPeriodData.reduce((sum, item) => sum + (num((item as any).paymentVAT) || num((item as any).vat)), 0);
    const prevTransactions = new Set(previousPeriodData.map(item => (item as any).paymentTransactionId || (item as any).paymentTransactionID).filter(Boolean)).size;
    const prevMembers = new Set(previousPeriodData.map(item => item.memberId || item.customerEmail).filter(Boolean)).size;
    const prevUnits = new Set(previousPeriodData.map(item => (item as any).saleItemId || (item as any).saleItemID).filter(Boolean)).size;
    const prevATV = prevTransactions > 0 ? prevRevenue / prevTransactions : 0;
    const prevASV = prevMembers > 0 ? prevRevenue / prevMembers : 0;
    // Calculate previous period discount percentage correctly
    const prevGrossRevenue = previousPeriodData.reduce((sum, item) => sum + num((item as any).paymentValue), 0);
    const prevDiscountPercentage = (prevGrossRevenue + prevDiscount) > 0 ? 
      (prevDiscount / (prevGrossRevenue + prevDiscount)) * 100 : 0;

    // Debug logs removed for production performance

    // Calculate growth rates
    const calculateGrowth = (current: number, previous: number): { rate: number; isSignificant: boolean; trend: 'strong' | 'moderate' | 'weak' } => {
      if (previous === 0) return { rate: current > 0 ? 100 : 0, isSignificant: current > 0, trend: current > 0 ? 'moderate' : 'weak' };
      const rate = ((current - previous) / previous) * 100;
      const isSignificant = Math.abs(rate) >= 5;
      
      // Trend should consider direction of change
      let trend: 'strong' | 'moderate' | 'weak';
      if (rate > 0) {
        // Positive growth
        trend = rate >= 20 ? 'strong' : rate >= 10 ? 'moderate' : 'weak';
      } else {
        // Negative growth (decline) - should always be weak or moderate at best
        trend = rate <= -20 ? 'weak' : rate <= -10 ? 'moderate' : 'weak';
      }
      
      return { rate, isSignificant, trend };
    };

    // YEAR-ON-YEAR COMPARISON: Calculate same period last year
    const yoyStart = new Date(currentStart.getFullYear() - 1, currentStart.getMonth(), currentStart.getDate());
    const yoyEnd = new Date(currentEnd.getFullYear() - 1, currentEnd.getMonth(), currentEnd.getDate());
    yoyEnd.setHours(23, 59, 59, 999);

    const yoyPeriodData = base.filter((it) => {
      const d = parseDate((it as any).paymentDate);
      return d && d >= yoyStart && d <= yoyEnd;
    });

    // Calculate year-on-year metrics
    const yoyRevenue = yoyPeriodData.reduce((sum, item) => {
      const payment = num((item as any).paymentValue);
      const vat = num((item as any).paymentVAT) || num((item as any).vat);
      return sum + (payment - vat);
    }, 0);
    const yoyDiscount = yoyPeriodData.reduce((sum, item) => sum + num((item as any).discountAmount), 0);
    const yoyVAT = yoyPeriodData.reduce((sum, item) => sum + (num((item as any).paymentVAT) || num((item as any).vat)), 0);
    const yoyTransactions = new Set(yoyPeriodData.map(item => (item as any).paymentTransactionId || (item as any).paymentTransactionID).filter(Boolean)).size;
    const yoyMembers = new Set(yoyPeriodData.map(item => item.memberId || item.customerEmail).filter(Boolean)).size;
    const yoyUnits = new Set(yoyPeriodData.map(item => (item as any).saleItemId || (item as any).saleItemID).filter(Boolean)).size;
    const yoyATV = yoyTransactions > 0 ? yoyRevenue / yoyTransactions : 0;
    const yoyASV = yoyMembers > 0 ? yoyRevenue / yoyMembers : 0;
    const yoyGrossRevenue = yoyPeriodData.reduce((sum, item) => sum + num((item as any).paymentValue), 0);
    const yoyDiscountPercentage = (yoyGrossRevenue + yoyDiscount) > 0 ? 
      (yoyDiscount / (yoyGrossRevenue + yoyDiscount)) * 100 : 0;

    // ---- Extended metrics: basket size, new-vs-returning mix, cadence, cashless ----
    const currentUPT = currentTransactions > 0 ? currentUnits / currentTransactions : 0;
    const prevUPT = prevTransactions > 0 ? prevUnits / prevTransactions : 0;
    const yoyUPT = yoyTransactions > 0 ? yoyUnits / yoyTransactions : 0;

    const memberKey = (it: SalesData) => (it.memberId || it.customerEmail || '').toString().trim().toLowerCase();
    const netOf = (it: SalesData) => num((it as any).paymentValue) - (num((it as any).paymentVAT) || num((it as any).vat));

    // First-ever purchase per member across full history (base + current window)
    const firstPurchase = new Map<string, number>();
    for (const it of [...base, ...currentPeriodData]) {
      const k = memberKey(it);
      if (!k) continue;
      const d = parseDate((it as any).paymentDate);
      if (!d) continue;
      const t = d.getTime();
      const prev = firstPurchase.get(k);
      if (prev === undefined || t < prev) firstPurchase.set(k, t);
    }

    // Share of window revenue from members whose first purchase falls inside the window
    const newMemberShareOf = (rows: SalesData[], wStart: Date, wEnd: Date) => {
      let total = 0, fresh = 0;
      for (const it of rows) {
        const v = netOf(it);
        total += v;
        const fp = firstPurchase.get(memberKey(it));
        if (fp !== undefined && fp >= wStart.getTime() && fp <= wEnd.getTime()) fresh += v;
      }
      return total !== 0 ? (fresh / total) * 100 : 0;
    };
    const currentNewShare = newMemberShareOf(currentPeriodData, currentStart, currentEnd);
    const prevNewShare = newMemberShareOf(previousPeriodData, prevStart, prevEnd);
    const yoyNewShare = newMemberShareOf(yoyPeriodData, yoyStart, yoyEnd);

    // Avg days between consecutive purchases (repeat buyers inside the window)
    const intervalOf = (rows: SalesData[]) => {
      const byMember = new Map<string, number[]>();
      for (const it of rows) {
        const k = memberKey(it);
        if (!k) continue;
        const d = parseDate((it as any).paymentDate);
        if (!d) continue;
        const arr = byMember.get(k);
        if (arr) arr.push(d.getTime());
        else byMember.set(k, [d.getTime()]);
      }
      let gaps = 0, gapDays = 0;
      byMember.forEach(ts => {
        if (ts.length < 2) return;
        ts.sort((a, b) => a - b);
        for (let i = 1; i < ts.length; i++) {
          gapDays += (ts[i] - ts[i - 1]) / 86400000;
          gaps += 1;
        }
      });
      return gaps > 0 ? gapDays / gaps : 0;
    };
    const currentInterval = intervalOf(currentPeriodData);
    const prevInterval = intervalOf(previousPeriodData);
    const yoyInterval = intervalOf(yoyPeriodData);

    // Cashless revenue share (non-cash payment methods)
    const cashlessOf = (rows: SalesData[]) => {
      let total = 0, cashless = 0;
      for (const it of rows) {
        const v = netOf(it);
        total += v;
        const m = String((it as any).paymentMethod || '').toLowerCase();
        if (m && !/cash/.test(m)) cashless += v;
      }
      return total !== 0 ? (cashless / total) * 100 : 0;
    };
    const currentCashless = cashlessOf(currentPeriodData);
    const prevCashless = cashlessOf(previousPeriodData);
    const yoyCashless = cashlessOf(yoyPeriodData);

    const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
    const yoyPeriodLabel = `${fmt(currentStart)} vs ${fmt(yoyStart)}`;

    const revenueGrowth = calculateGrowth(currentRevenue, prevRevenue);
    const transactionGrowth = calculateGrowth(currentTransactions, prevTransactions);
    const memberGrowth = calculateGrowth(currentMembers, prevMembers);
    const unitsGrowth = calculateGrowth(currentUnits, prevUnits);
    const atvGrowth = calculateGrowth(currentATV, prevATV);
    const asvGrowth = calculateGrowth(currentASV, prevASV);
    const discountGrowth = calculateGrowth(currentDiscount, prevDiscount);
    const discountPercentageGrowth = calculateGrowth(currentDiscountPercentage, prevDiscountPercentage);
    const vatGrowth = calculateGrowth(currentVAT, prevVAT);
    const uptGrowth = calculateGrowth(currentUPT, prevUPT);
    const newShareGrowth = calculateGrowth(currentNewShare, prevNewShare);
    const intervalGrowth = calculateGrowth(currentInterval, prevInterval);
    const cashlessGrowth = calculateGrowth(currentCashless, prevCashless);

    // Year-on-year growth rates
    const yoyRevenueGrowth = calculateGrowth(currentRevenue, yoyRevenue);
    const yoyTransactionGrowth = calculateGrowth(currentTransactions, yoyTransactions);
    const yoyMemberGrowth = calculateGrowth(currentMembers, yoyMembers);
    const yoyUnitsGrowth = calculateGrowth(currentUnits, yoyUnits);
    const yoyAtvGrowth = calculateGrowth(currentATV, yoyATV);
    const yoyAsvGrowth = calculateGrowth(currentASV, yoyASV);
    const yoyDiscountGrowth = calculateGrowth(currentDiscount, yoyDiscount);
    const yoyDiscountPercentageGrowth = calculateGrowth(currentDiscountPercentage, yoyDiscountPercentage);
    const yoyVatGrowth = calculateGrowth(currentVAT, yoyVAT);
    const yoyUptGrowth = calculateGrowth(currentUPT, yoyUPT);
    const yoyNewShareGrowth = calculateGrowth(currentNewShare, yoyNewShare);
    const yoyIntervalGrowth = calculateGrowth(currentInterval, yoyInterval);
    const yoyCashlessGrowth = calculateGrowth(currentCashless, yoyCashless);

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
        periodLabel: currentPeriodLabel && previousPeriodLabel ? `${currentPeriodLabel} vs ${previousPeriodLabel}` : undefined,
        yoyChange: yoyRevenueGrowth.rate,
        yoyChangeDetails: yoyRevenueGrowth,
        yoyPreviousValue: formatCurrency(yoyRevenue),
        yoyPreviousRawValue: yoyRevenue,
        yoyPeriodLabel
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
        periodLabel: currentPeriodLabel && previousPeriodLabel ? `${currentPeriodLabel} vs ${previousPeriodLabel}` : undefined,
        yoyChange: yoyUnitsGrowth.rate,
        yoyChangeDetails: yoyUnitsGrowth,
        yoyPreviousValue: formatNumber(yoyUnits),
        yoyPreviousRawValue: yoyUnits,
        yoyPeriodLabel
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
        periodLabel: currentPeriodLabel && previousPeriodLabel ? `${currentPeriodLabel} vs ${previousPeriodLabel}` : undefined,
        yoyChange: yoyTransactionGrowth.rate,
        yoyChangeDetails: yoyTransactionGrowth,
        yoyPreviousValue: formatNumber(yoyTransactions),
        yoyPreviousRawValue: yoyTransactions,
        yoyPeriodLabel
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
        periodLabel: currentPeriodLabel && previousPeriodLabel ? `${currentPeriodLabel} vs ${previousPeriodLabel}` : undefined,
        yoyChange: yoyMemberGrowth.rate,
        yoyChangeDetails: yoyMemberGrowth,
        yoyPreviousValue: formatNumber(yoyMembers),
        yoyPreviousRawValue: yoyMembers,
        yoyPeriodLabel
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
        periodLabel: currentPeriodLabel && previousPeriodLabel ? `${currentPeriodLabel} vs ${previousPeriodLabel}` : undefined,
        yoyChange: yoyAtvGrowth.rate,
        yoyChangeDetails: yoyAtvGrowth,
        yoyPreviousValue: formatCurrency(yoyATV),
        yoyPreviousRawValue: yoyATV,
        yoyPeriodLabel
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
        periodLabel: currentPeriodLabel && previousPeriodLabel ? `${currentPeriodLabel} vs ${previousPeriodLabel}` : undefined,
        yoyChange: yoyAsvGrowth.rate,
        yoyChangeDetails: yoyAsvGrowth,
        yoyPreviousValue: formatCurrency(yoyASV),
        yoyPreviousRawValue: yoyASV,
        yoyPeriodLabel
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
        periodLabel: currentPeriodLabel && previousPeriodLabel ? `${currentPeriodLabel} vs ${previousPeriodLabel}` : undefined,
        yoyChange: yoyDiscountGrowth.rate,
        yoyChangeDetails: yoyDiscountGrowth,
        yoyPreviousValue: formatCurrency(yoyDiscount),
        yoyPreviousRawValue: yoyDiscount,
        yoyPeriodLabel
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
        periodLabel: currentPeriodLabel && previousPeriodLabel ? `${currentPeriodLabel} vs ${previousPeriodLabel}` : undefined,
        yoyChange: yoyDiscountPercentageGrowth.rate,
        yoyChangeDetails: yoyDiscountPercentageGrowth,
        yoyPreviousValue: formatPercentage(yoyDiscountPercentage),
        yoyPreviousRawValue: yoyDiscountPercentage,
        yoyPeriodLabel
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
        periodLabel: currentPeriodLabel && previousPeriodLabel ? `${currentPeriodLabel} vs ${previousPeriodLabel}` : undefined,
        yoyChange: yoyVatGrowth.rate,
        yoyChangeDetails: yoyVatGrowth,
        yoyPreviousValue: formatCurrency(yoyVAT),
        yoyPreviousRawValue: yoyVAT,
        yoyPeriodLabel
      },
      {
        title: "Units per Transaction",
        value: currentUPT.toFixed(2),
        rawValue: currentUPT,
        change: uptGrowth.rate,
        changeDetails: uptGrowth,
        icon: "ShoppingCart",
        color: "teal",
        description: "Average items in each basket",
        previousValue: prevUPT.toFixed(2),
        previousRawValue: prevUPT,
        comparison: {
          current: currentUPT,
          previous: prevUPT,
          difference: currentUPT - prevUPT
        },
        periodLabel: currentPeriodLabel && previousPeriodLabel ? `${currentPeriodLabel} vs ${previousPeriodLabel}` : undefined,
        yoyChange: yoyUptGrowth.rate,
        yoyChangeDetails: yoyUptGrowth,
        yoyPreviousValue: yoyUPT.toFixed(2),
        yoyPreviousRawValue: yoyUPT,
        yoyPeriodLabel
      },
      {
        title: "New-Member Revenue",
        value: formatPercentage(currentNewShare),
        rawValue: currentNewShare,
        change: newShareGrowth.rate,
        changeDetails: newShareGrowth,
        icon: "UserPlus",
        color: "emerald",
        description: "Revenue share from first-time buyers",
        previousValue: formatPercentage(prevNewShare),
        previousRawValue: prevNewShare,
        comparison: {
          current: currentNewShare,
          previous: prevNewShare,
          difference: currentNewShare - prevNewShare
        },
        periodLabel: currentPeriodLabel && previousPeriodLabel ? `${currentPeriodLabel} vs ${previousPeriodLabel}` : undefined,
        yoyChange: yoyNewShareGrowth.rate,
        yoyChangeDetails: yoyNewShareGrowth,
        yoyPreviousValue: formatPercentage(yoyNewShare),
        yoyPreviousRawValue: yoyNewShare,
        yoyPeriodLabel
      },
      {
        title: "Purchase Interval",
        value: `${currentInterval.toFixed(1)} days`,
        rawValue: currentInterval,
        change: intervalGrowth.rate,
        changeDetails: intervalGrowth,
        icon: "Calendar",
        color: "indigo",
        description: "Avg days between repeat purchases",
        previousValue: `${prevInterval.toFixed(1)} days`,
        previousRawValue: prevInterval,
        comparison: {
          current: currentInterval,
          previous: prevInterval,
          difference: currentInterval - prevInterval
        },
        periodLabel: currentPeriodLabel && previousPeriodLabel ? `${currentPeriodLabel} vs ${previousPeriodLabel}` : undefined,
        yoyChange: yoyIntervalGrowth.rate,
        yoyChangeDetails: yoyIntervalGrowth,
        yoyPreviousValue: `${yoyInterval.toFixed(1)} days`,
        yoyPreviousRawValue: yoyInterval,
        yoyPeriodLabel
      },
      {
        title: "Cashless Share",
        value: formatPercentage(currentCashless),
        rawValue: currentCashless,
        change: cashlessGrowth.rate,
        changeDetails: cashlessGrowth,
        icon: "CreditCard",
        color: "sky",
        description: "Revenue via non-cash methods",
        previousValue: formatPercentage(prevCashless),
        previousRawValue: prevCashless,
        comparison: {
          current: currentCashless,
          previous: prevCashless,
          difference: currentCashless - prevCashless
        },
        periodLabel: currentPeriodLabel && previousPeriodLabel ? `${currentPeriodLabel} vs ${previousPeriodLabel}` : undefined,
        yoyChange: yoyCashlessGrowth.rate,
        yoyChangeDetails: yoyCashlessGrowth,
        yoyPreviousValue: formatPercentage(yoyCashless),
        yoyPreviousRawValue: yoyCashless,
        yoyPeriodLabel
      }
    ];

    // Final sales metrics calculated

    return calculatedMetrics;
  }, [currentData, historicalData, options?.dateRange?.start, options?.dateRange?.end, filters?.dateRange?.start, filters?.dateRange?.end, options?.compareMode]);

  return { metrics };
};