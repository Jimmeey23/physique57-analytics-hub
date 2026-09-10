import React, {
  Suspense,
  lazy,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react';
import { useNewClientData } from '@/hooks/useNewClientData';
import { usePayrollData } from '@/hooks/usePayrollData';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';
import { BarChart3, Clock3, Gauge, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { StudioLocationTabs } from '@/components/ui/StudioLocationTabs';
import { AdvancedExportButton } from '@/components/ui/AdvancedExportButton';
import { NewClientData, NewClientFilterOptions } from '@/types/dashboard';
import DashboardMotionHero from '@/components/ui/DashboardMotionHero';
import { KpiTicker } from '@/components/ui/KpiTicker';
import { MetricDefinitions } from '@/components/ui/MetricDefinitions';
import { METRIC_DEFINITIONS } from '@/data/metricDefinitions';
import { formatNumber, formatCurrency, formatPercentage } from '@/utils/formatters';
import { getDashboardDefaultDateRange, parseDate } from '@/utils/dateUtils';
import { isConverted, isNewClient, isRetained } from '@/utils/clientRetention';
import { getConsolidatedExportPresetFromSearch, getConsolidatedStudioOption } from '@/utils/consolidatedExportPreset';

// Import new components for rebuilt client conversion tab
import { EnhancedClientConversionFilterSection } from '@/components/dashboard/EnhancedClientConversionFilterSection';
import { ClientConversionMetricCards } from '@/components/dashboard/ClientConversionMetricCards';
import { ClientConversionDataTableSelector } from '@/components/dashboard/ClientConversionDataTableSelector';
import { LazyClientConversionDrillDownModalV3 } from '@/components/lazy/LazyModals';
import { isRetentionTable } from '@/components/dashboard/retentionTableOptions';
import { ModalSuspense } from '@/components/lazy/ModalSuspense';
// Removed NotesBlock (AI summary/notes) per request
import { SectionTimelineNav } from '@/components/ui/SectionTimelineNav';

const ClientConversionSimplifiedRanks = lazy(() =>
  import('@/components/dashboard/ClientConversionSimplifiedRanks').then((module) => ({
    default: module.ClientConversionSimplifiedRanks,
  }))
);
const ClientConversionEnhancedCharts = lazy(() =>
  import('@/components/dashboard/ClientConversionEnhancedCharts').then((module) => ({
    default: module.ClientConversionEnhancedCharts,
  }))
);
const ClientConversionMonthOnMonthByTypeTable = lazy(() =>
  import('@/components/dashboard/ClientConversionMonthOnMonthByTypeTableEnhanced').then((module) => ({
    default: module.ClientConversionMonthOnMonthByTypeTable,
  }))
);
const ClientRetentionMonthByTypePivot = lazy(() =>
  import('@/components/dashboard/ClientRetentionMonthByTypePivot').then((module) => ({
    default: module.ClientRetentionMonthByTypePivot,
  }))
);
const ClientRetentionYearOnYearPivot = lazy(() =>
  import('@/components/dashboard/ClientRetentionYearOnYearPivotNew').then((module) => ({
    default: module.default,
  }))
);
const ClientConversionMembershipTable = lazy(() =>
  import('@/components/dashboard/ClientConversionMembershipTableEnhanced').then((module) => ({
    default: module.ClientConversionMembershipTable,
  }))
);
const ClientHostedClassesTable = lazy(() =>
  import('@/components/dashboard/ClientHostedClassesTable').then((module) => ({
    default: module.ClientHostedClassesTable,
  }))
);
const TeacherPerformanceTable = lazy(() =>
  import('@/components/dashboard/TeacherPerformanceTable').then((module) => ({
    default: module.TeacherPerformanceTable,
  }))
);
const NewClientMembershipPurchaseTable = lazy(() =>
  import('@/components/dashboard/NewClientMembershipPurchaseTable').then((module) => ({
    default: module.NewClientMembershipPurchaseTable,
  }))
);

type DrillDownType = 'month' | 'year' | 'class' | 'membership' | 'metric' | 'ranking';

interface DrillDownModalState {
  isOpen: boolean;
  title: string;
  data: unknown;
  type: DrillDownType;
}

type ExportValue = string | number;
type ExportRow = Record<string, ExportValue>;

interface MembershipPurchaseStats {
  units: number;
  clients: Set<string>;
  totalLTV: number;
  conversionSpans: number[];
  visitsPostTrial: number[];
  convertedClients: number;
}

type RetentionPivotMetricKey =
  | 'trials'
  | 'newMembers'
  | 'converted'
  | 'retained'
  | 'retentionRate'
  | 'conversionRate'
  | 'avgLTV'
  | 'totalLTV'
  | 'avgConversionDays'
  | 'avgVisits';

type RetentionDimension = 'clientType' | 'membership' | 'teacher';

interface RetentionMonthDef {
  key: string;
  display: string;
  year: number;
  month: number;
}

const DEFAULT_RETENTION_LOCATION = 'Kwality House, Kemps Corner';
const RETENTION_REPORTING_START = new Date(2024, 0, 1);

interface RetentionPivotCell {
  trials: number;
  newMembers: number;
  converted: number;
  retained: number;
  totalLTV: number;
  conversionSpans: number[];
  visitsPostTrial: number[];
  avgLTV: number;
  conversionRate: number;
  retentionRate: number;
  avgConversionDays: number;
  avgVisits: number;
}

const RETENTION_PIVOT_METRIC_LABELS: Record<RetentionPivotMetricKey, string> = {
  trials: 'Trials',
  newMembers: 'New Members',
  converted: 'Converted',
  retained: 'Retained',
  retentionRate: 'Retention %',
  conversionRate: 'Conversion %',
  avgLTV: 'Avg LTV',
  totalLTV: 'Total LTV',
  avgConversionDays: 'Avg Conv Days',
  avgVisits: 'Avg Visits',
};

const createRetentionPivotCell = (): RetentionPivotCell => ({
  trials: 0,
  newMembers: 0,
  converted: 0,
  retained: 0,
  totalLTV: 0,
  conversionSpans: [],
  visitsPostTrial: [],
  avgLTV: 0,
  conversionRate: 0,
  retentionRate: 0,
  avgConversionDays: 0,
  avgVisits: 0,
});

const sortRetentionDimensionValues = (values: string[], dimension: RetentionDimension | 'yoy-clientType' | 'yoy-membership') => {
  return [...values].sort((a, b) => {
    if (dimension === 'clientType' || dimension === 'yoy-clientType') {
      const an = a.toLowerCase();
      const bn = b.toLowerCase();
      if (isNewClient(an) && !isNewClient(bn)) return -1;
      if (!isNewClient(an) && isNewClient(bn)) return 1;
    }
    return a.localeCompare(b);
  });
};

const getRetentionMonthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const buildMonthSequence = (start: Date, end: Date) => {
  const startMonth = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
  const sequence: Date[] = [];

  for (let cursor = new Date(startMonth); cursor <= endMonth; cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)) {
    sequence.push(new Date(cursor));
  }

  return sequence;
};

const buildRetentionReportingMonths = (): RetentionMonthDef[] => {
  const now = new Date();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const months = buildMonthSequence(RETENTION_REPORTING_START, currentMonth);

  return months.map((date) => ({
    key: getRetentionMonthKey(date),
    display: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    year: date.getFullYear(),
    month: date.getMonth() + 1,
  }));
};

const buildMomMonths = (_inputData: NewClientData[]): RetentionMonthDef[] => buildRetentionReportingMonths();

const buildYoyMonths = (_inputData: NewClientData[], _dateRange?: { start?: string; end?: string }): RetentionMonthDef[] => buildRetentionReportingMonths();

const parseRetentionMonthYear = (value?: string | null): Date | null => {
  const raw = String(value || '').trim();
  if (!raw) return null;

  const isoMatch = raw.match(/^(\d{4})[-/](\d{1,2})$/);
  if (isoMatch) {
    return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, 1);
  }

  const nameMatch = raw.match(/^([A-Za-z]+)[\s-]+(\d{4})$/);
  if (!nameMatch) return null;

  const monthLookup: Record<string, number> = {
    jan: 0, january: 0,
    feb: 1, february: 1,
    mar: 2, march: 2,
    apr: 3, april: 3,
    may: 4,
    jun: 5, june: 5,
    jul: 6, july: 6,
    aug: 7, august: 7,
    sep: 8, sept: 8, september: 8,
    oct: 9, october: 9,
    nov: 10, november: 10,
    dec: 11, december: 11,
  };

  const month = monthLookup[nameMatch[1].toLowerCase()];
  return typeof month === 'number' ? new Date(Number(nameMatch[2]), month, 1) : null;
};

const isFullCalendarMonthRange = (start: Date, end: Date) => {
  const firstDay = new Date(start.getFullYear(), start.getMonth(), 1);
  const lastDay = new Date(start.getFullYear(), start.getMonth() + 1, 0);

  return (
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getTime() === firstDay.getTime() &&
    end.getFullYear() === lastDay.getFullYear() &&
    end.getMonth() === lastDay.getMonth() &&
    end.getDate() === lastDay.getDate()
  );
};

const isClientInRetentionDateRange = (client: NewClientData, startDate: Date | null, endDate: Date | null) => {
  if (!startDate && !endDate) return true;

  const normalizedStart = startDate ? new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()) : null;
  const normalizedEnd = endDate ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999) : null;

  if (normalizedStart && normalizedEnd && isFullCalendarMonthRange(normalizedStart, normalizedEnd)) {
    const monthDate = parseRetentionMonthYear(client.monthYear);
    if (monthDate) {
      return monthDate.getFullYear() === normalizedStart.getFullYear() && monthDate.getMonth() === normalizedStart.getMonth();
    }
  }

  const clientDate = parseDate(client.firstVisitDate || '');
  if (!clientDate) return false;
  clientDate.setHours(0, 0, 0, 0);
  return (!normalizedStart || clientDate >= normalizedStart) && (!normalizedEnd || clientDate <= normalizedEnd);
};

const finalizeRetentionPivotCell = (cell: RetentionPivotCell) => ({
  ...cell,
  avgLTV: cell.trials > 0 ? cell.totalLTV / cell.trials : 0,
  conversionRate: cell.trials > 0 ? (cell.converted / cell.trials) * 100 : 0,
  retentionRate: cell.trials > 0 ? (cell.retained / cell.trials) * 100 : 0,
  avgConversionDays: cell.conversionSpans.length > 0 ? cell.conversionSpans.reduce((sum, value) => sum + value, 0) / cell.conversionSpans.length : 0,
  avgVisits: cell.visitsPostTrial.length > 0 ? cell.visitsPostTrial.reduce((sum, value) => sum + value, 0) / cell.visitsPostTrial.length : 0,
});

const formatPivotMetricValue = (metric: RetentionPivotMetricKey, cell: RetentionPivotCell) => {
  switch (metric) {
    case 'trials':
    case 'newMembers':
    case 'converted':
    case 'retained':
      return formatNumber(cell[metric]);
    case 'retentionRate':
    case 'conversionRate':
      return formatPercentage(cell[metric]);
    case 'avgLTV':
    case 'totalLTV':
      return formatCurrency(cell[metric]);
    case 'avgConversionDays':
      return `${Math.round(cell.avgConversionDays)} days`;
    case 'avgVisits':
      return cell.avgVisits.toFixed(1);
    default:
      return '';
  }
};

const buildRetentionPivotMatrix = (
  inputData: NewClientData[],
  months: RetentionMonthDef[],
  dimension: 'clientType' | 'membership'
) => {
  const monthKeys = new Set(months.map((month) => month.key));
  const rowKeys = sortRetentionDimensionValues(
    Array.from(
      new Set(
        inputData.map((client) =>
          dimension === 'clientType' ? client.isNew || 'Unknown' : client.membershipUsed || 'Unknown'
        )
      )
    ),
    dimension === 'clientType' ? 'yoy-clientType' : 'yoy-membership'
  );

  const matrix: Record<string, Record<string, RetentionPivotCell>> = {};
  rowKeys.forEach((rowKey) => {
    matrix[rowKey] = {};
    months.forEach((month) => {
      matrix[rowKey][month.key] = createRetentionPivotCell();
    });
  });

  inputData.forEach((client) => {
    const date = parseDate(client.firstVisitDate || '');
    if (!date) return;
    const monthKey = getRetentionMonthKey(date);
    if (!monthKeys.has(monthKey)) return;

    const rowKey = dimension === 'clientType' ? client.isNew || 'Unknown' : client.membershipUsed || 'Unknown';
    const cell = matrix[rowKey]?.[monthKey];
    if (!cell) return;

    cell.trials += 1;
    if (isNewClient(client)) cell.newMembers += 1;
    if (isConverted(client)) cell.converted += 1;
    if (isRetained(client)) cell.retained += 1;
    cell.totalLTV += client.ltv || 0;
    if (client.conversionSpan && client.conversionSpan > 0) cell.conversionSpans.push(client.conversionSpan);
    if (client.visitsPostTrial && client.visitsPostTrial > 0) cell.visitsPostTrial.push(client.visitsPostTrial);
  });

  rowKeys.forEach((rowKey) => {
    months.forEach((month) => {
      matrix[rowKey][month.key] = finalizeRetentionPivotCell(matrix[rowKey][month.key]);
    });
  });

  const totals: Record<string, RetentionPivotCell> = {};
  months.forEach((month) => {
    const totalCell = createRetentionPivotCell();
    rowKeys.forEach((rowKey) => {
      const cell = matrix[rowKey][month.key];
      totalCell.trials += cell.trials;
      totalCell.newMembers += cell.newMembers;
      totalCell.converted += cell.converted;
      totalCell.retained += cell.retained;
      totalCell.totalLTV += cell.totalLTV;
      totalCell.conversionSpans.push(...cell.conversionSpans);
      totalCell.visitsPostTrial.push(...cell.visitsPostTrial);
    });
    totals[month.key] = finalizeRetentionPivotCell(totalCell);
  });

  return { rowKeys, matrix, totals };
};

const buildPivotMetricExportRows = (
  rowLabel: string,
  months: RetentionMonthDef[],
  rowKeys: string[],
  matrix: Record<string, Record<string, RetentionPivotCell>>,
  totals: Record<string, RetentionPivotCell>,
  metric: RetentionPivotMetricKey
): ExportRow[] => {
  const rows: ExportRow[] = rowKeys.map((rowKey) => {
    const row: ExportRow = { [rowLabel]: rowKey };
    months.forEach((month) => {
      row[month.display] = formatPivotMetricValue(metric, matrix[rowKey][month.key]);
    });
    return row;
  });

  const totalsRow: ExportRow = { [rowLabel]: 'TOTALS' };
  months.forEach((month) => {
    totalsRow[month.display] = formatPivotMetricValue(metric, totals[month.key]);
  });
  rows.push(totalsRow);

  return rows;
};

const buildClientConversionMonthOnMonthRows = (
  inputData: NewClientData[],
  visitsSummary: Record<string, number>,
  rowType: RetentionDimension
): ExportRow[] => {
  const statsMap = new Map<string, { type: string; totalTrials: number; newMembers: number; converted: number; retained: number; totalLTV: number; conversionSpans: number[]; visitsPostTrial: number[] }>();

  inputData.forEach((client) => {
    const groupValue = rowType === 'clientType'
      ? client.isNew || 'Unknown'
      : rowType === 'membership'
        ? client.membershipUsed || 'Unknown'
        : client.trainerName || 'Unknown';

    if (!statsMap.has(groupValue)) {
      statsMap.set(groupValue, {
        type: groupValue,
        totalTrials: 0,
        newMembers: 0,
        converted: 0,
        retained: 0,
        totalLTV: 0,
        conversionSpans: [] as number[],
        visitsPostTrial: [] as number[],
      });
    }

    const row = statsMap.get(groupValue);
    row.totalTrials += 1;
    if (isNewClient(client)) row.newMembers += 1;
    if (isConverted(client)) row.converted += 1;
    if (isRetained(client)) row.retained += 1;
    row.totalLTV += client.ltv || 0;
    if (client.conversionSpan && client.conversionSpan > 0) row.conversionSpans.push(client.conversionSpan);
    if (client.visitsPostTrial && client.visitsPostTrial > 0) row.visitsPostTrial.push(client.visitsPostTrial);
  });

  return Array.from(statsMap.values())
    .map((row) => {
      const conversionRate = row.totalTrials > 0 ? (row.converted / row.totalTrials) * 100 : 0;
      const retentionRate = row.totalTrials > 0 ? (row.retained / row.totalTrials) * 100 : 0;
      const avgLTV = row.totalTrials > 0 ? row.totalLTV / row.totalTrials : 0;
      const avgConversionDays = row.conversionSpans.length > 0 ? row.conversionSpans.reduce((sum: number, value: number) => sum + value, 0) / row.conversionSpans.length : 0;
      const avgVisits = row.visitsPostTrial.length > 0 ? row.visitsPostTrial.reduce((sum: number, value: number) => sum + value, 0) / row.visitsPostTrial.length : 0;

      return {
        [rowType === 'clientType' ? 'Client Type' : rowType === 'membership' ? 'Membership' : 'Teacher']: row.type,
        Trials: formatNumber(row.totalTrials),
        'New Members': formatNumber(row.newMembers),
        Retained: formatNumber(row.retained),
        'Retention %': formatPercentage(retentionRate),
        Converted: formatNumber(row.converted),
        'Conversion %': formatPercentage(conversionRate),
        'Avg LTV': formatCurrency(avgLTV),
        'Total LTV': formatCurrency(row.totalLTV),
        'Avg Conv Days': avgConversionDays > 0 ? `${avgConversionDays.toFixed(1)} days` : 'N/A',
        'Avg Visits': avgVisits.toFixed(1),
      };
    })
    .sort((a, b) => String(Object.values(a)[0]).localeCompare(String(Object.values(b)[0])));
};

const buildHostedClassesExportRows = (inputData: NewClientData[]): ExportRow[] => {
  const tokens = ['host', 'hosted', 'p57', 'birthday', 'rugby', 'lrs'];
  const map = new Map<string, { month: string; className: string; totalMembers: number; newMembers: number; converted: number; retained: number; totalLTV: number; conversionIntervals: number[] }>();

  inputData.forEach((client) => {
    const className = String(client.firstVisitEntityName || '');
    if (!className) return;
    if (!tokens.some((token) => className.toLowerCase().includes(token))) return;

    const date = parseDate(client.firstVisitDate || '') || new Date(client.firstVisitDate || '');
    const month = !isNaN(date.getTime()) ? date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Unknown';
    const key = `${month}__${className}`;
    if (!map.has(key)) {
      map.set(key, {
        month,
        className,
        totalMembers: 0,
        newMembers: 0,
        converted: 0,
        retained: 0,
        totalLTV: 0,
        conversionIntervals: [] as number[],
      });
    }

    const row = map.get(key);
    row.totalMembers += 1;
    if (isNewClient(client)) row.newMembers += 1;
    if (isConverted(client)) row.converted += 1;
    if (isRetained(client)) row.retained += 1;
    row.totalLTV += client.ltv || 0;
    if (client.firstPurchase && client.firstVisitDate) {
      const firstVisitDate = parseDate(client.firstVisitDate || '');
      const firstPurchaseDate = parseDate(client.firstPurchase || '');
      if (firstVisitDate && firstPurchaseDate) {
        const interval = Math.ceil((firstPurchaseDate.getTime() - firstVisitDate.getTime()) / (1000 * 60 * 60 * 24));
        if (interval >= 0) row.conversionIntervals.push(interval);
      }
    }
  });

  return Array.from(map.values())
    .map((row) => ({
      Month: row.month,
      'Class Name': row.className,
      Trials: formatNumber(row.totalMembers),
      'New Members': formatNumber(row.newMembers),
      Retained: formatNumber(row.retained),
      'Retention %': formatPercentage(row.totalMembers > 0 ? (row.retained / row.totalMembers) * 100 : 0),
      Converted: formatNumber(row.converted),
      'Conversion %': formatPercentage(row.totalMembers > 0 ? (row.converted / row.totalMembers) * 100 : 0),
      'Avg LTV': formatCurrency(row.totalMembers > 0 ? row.totalLTV / row.totalMembers : 0),
      'Avg Conv Days': row.conversionIntervals.length > 0
        ? `${(row.conversionIntervals.reduce((sum: number, value: number) => sum + value, 0) / row.conversionIntervals.length).toFixed(1)} days`
        : 'N/A',
    }))
    .sort((a, b) => Number(String(b.Trials).replace(/,/g, '')) - Number(String(a.Trials).replace(/,/g, '')));
};

const buildMembershipPerformanceRows = (inputData: NewClientData[]): ExportRow[] => {
  const map = new Map<string, { membership: string; totalMembers: number; newMembers: number; converted: number; retained: number; totalLTV: number }>();
  inputData.forEach((client) => {
    const membership = client.membershipUsed || 'No Membership';
    if (!map.has(membership)) {
      map.set(membership, {
        membership,
        totalMembers: 0,
        newMembers: 0,
        converted: 0,
        retained: 0,
        totalLTV: 0,
      });
    }
    const row = map.get(membership);
    row.totalMembers += 1;
    if (isNewClient(client)) row.newMembers += 1;
    if (isConverted(client)) row.converted += 1;
    if (isRetained(client)) row.retained += 1;
    row.totalLTV += client.ltv || 0;
  });

  return Array.from(map.values())
    .map((row) => ({
      'Membership Type': row.membership,
      Trials: formatNumber(row.totalMembers),
      'New Members': formatNumber(row.newMembers),
      Retained: formatNumber(row.retained),
      'Retention %': formatPercentage(row.totalMembers > 0 ? (row.retained / row.totalMembers) * 100 : 0),
      Converted: formatNumber(row.converted),
      'Conversion %': formatPercentage(row.totalMembers > 0 ? (row.converted / row.totalMembers) * 100 : 0),
      'Avg LTV': formatCurrency(row.totalMembers > 0 ? row.totalLTV / row.totalMembers : 0),
      'Total LTV': formatCurrency(row.totalLTV),
    }))
    .sort((a, b) => Number(String(b.Trials).replace(/,/g, '')) - Number(String(a.Trials).replace(/,/g, '')));
};

const buildTeacherPerformanceRows = (inputData: NewClientData[]): ExportRow[] => {
  const stats = new Map<string, { newMembers: Set<string>; totalMembers: Set<string>; sessions: number; converted: Set<string>; retained: Set<string> }>();
  inputData.forEach((client) => {
    const trainerName = client.trainerName || 'Unknown Trainer';
    if (!stats.has(trainerName)) {
      stats.set(trainerName, { newMembers: new Set(), totalMembers: new Set(), sessions: 0, converted: new Set(), retained: new Set() });
    }
    const row = stats.get(trainerName)!;
    if (client.memberId) row.totalMembers.add(client.memberId);
    if (isNewClient(client) && client.memberId) row.newMembers.add(client.memberId);
    row.sessions += client.classNo || 0;
    if (isConverted(client) && client.memberId) row.converted.add(client.memberId);
    if (isRetained(client) && client.memberId) row.retained.add(client.memberId);
  });

  return Array.from(stats.entries())
    .map(([trainerName, row]) => {
      const newMembers = row.newMembers.size;
      const totalMembers = row.totalMembers.size;
      const converted = row.converted.size;
      const retained = row.retained.size;
      return {
        'Teacher Name': trainerName,
        'New Members': formatNumber(newMembers),
        Sessions: formatNumber(row.sessions),
        Converted: formatNumber(converted),
        'Conversion Rate': formatPercentage(totalMembers > 0 ? (converted / totalMembers) * 100 : 0),
        Retained: formatNumber(retained),
        'Retention Rate': formatPercentage(totalMembers > 0 ? (retained / totalMembers) * 100 : 0),
      };
    })
    .sort((a, b) => Number(String(b['New Members']).replace(/,/g, '')) - Number(String(a['New Members']).replace(/,/g, '')));
};

const buildNewClientPurchaseRows = (inputData: NewClientData[], groupBy: 'detailed' | 'membership' | 'clientType'): ExportRow[] => {
  const newClients = inputData.filter((client) => isNewClient(client));
  const baseMap = new Map<string, { membershipType: string; clientType: string; units: number; clientIds: Set<string>; totalRevenue: number; conversionSpans: number[]; visitsPostTrial: number[] }>();

  newClients.forEach((client) => {
    const membershipsBought = String(client.membershipsBoughtPostTrial || 'No Membership Purchase');
    const memberships = membershipsBought.split(',').map((item) => item.trim()).filter(Boolean);
    const clientType = client.isNew || 'Unknown';
    const effectiveMemberships = memberships.length > 0 ? memberships : ['No Membership Purchase'];

    effectiveMemberships.forEach((membership) => {
      const key = `${membership}__${clientType}`;
      if (!baseMap.has(key)) {
        baseMap.set(key, {
          membershipType: membership,
          clientType,
          units: 0,
          clientIds: new Set<string>(),
          totalRevenue: 0,
          conversionSpans: [] as number[],
          visitsPostTrial: [] as number[],
        });
      }

      const row = baseMap.get(key);
      row.units += memberships.length > 0 ? 1 : 0;
      if (client.memberId) row.clientIds.add(String(client.memberId));
      row.totalRevenue += client.ltv || 0;
      if (isConverted(client) && client.conversionSpan && client.conversionSpan > 0) {
        row.conversionSpans.push(client.conversionSpan);
      }
      if (client.visitsPostTrial) row.visitsPostTrial.push(client.visitsPostTrial);
    });
  });

  const detailedRows = Array.from(baseMap.values()).map((row) => ({
    membershipType: row.membershipType,
    clientType: row.clientType,
    units: row.units,
    newClientsCount: row.clientIds.size,
    totalRevenue: row.totalRevenue,
    avgRevenue: row.clientIds.size > 0 ? row.totalRevenue / row.clientIds.size : 0,
    avgDaysTaken: row.conversionSpans.length > 0 ? row.conversionSpans.reduce((sum: number, value: number) => sum + value, 0) / row.conversionSpans.length : 0,
    avgVisitsPostTrial: row.visitsPostTrial.length > 0 ? row.visitsPostTrial.reduce((sum: number, value: number) => sum + value, 0) / row.visitsPostTrial.length : 0,
  }));

  const aggregateRows = (dimension: 'membershipType' | 'clientType') => {
    const aggregateMap = new Map<string, { membershipType: string; clientType: string; units: number; newClientsCount: number; totalRevenue: number; weightedDays: number; weightedVisits: number }>();
    detailedRows.forEach((row) => {
      const label = row[dimension];
      if (!aggregateMap.has(label)) {
        aggregateMap.set(label, {
          membershipType: dimension === 'membershipType' ? label : 'All Memberships',
          clientType: dimension === 'clientType' ? label : 'All Types',
          units: 0,
          newClientsCount: 0,
          totalRevenue: 0,
          weightedDays: 0,
          weightedVisits: 0,
        });
      }
      const target = aggregateMap.get(label);
      target.units += row.units;
      target.newClientsCount += row.newClientsCount;
      target.totalRevenue += row.totalRevenue;
      target.weightedDays += row.avgDaysTaken * row.newClientsCount;
      target.weightedVisits += row.avgVisitsPostTrial * row.newClientsCount;
    });

    return Array.from(aggregateMap.values()).map((row) => ({
      membershipType: row.membershipType,
      clientType: row.clientType,
      units: row.units,
      newClientsCount: row.newClientsCount,
      totalRevenue: row.totalRevenue,
      avgRevenue: row.newClientsCount > 0 ? row.totalRevenue / row.newClientsCount : 0,
      avgDaysTaken: row.newClientsCount > 0 ? row.weightedDays / row.newClientsCount : 0,
      avgVisitsPostTrial: row.newClientsCount > 0 ? row.weightedVisits / row.newClientsCount : 0,
    }));
  };

  const sourceRows = groupBy === 'membership'
    ? aggregateRows('membershipType')
    : groupBy === 'clientType'
      ? aggregateRows('clientType')
      : detailedRows;

  return sourceRows.map((row) => ({
    ...(groupBy !== 'clientType' ? { 'Membership Type': row.membershipType } : {}),
    ...(groupBy !== 'membership' ? { 'Client Type': row.clientType } : {}),
    'Units Sold': formatNumber(row.units),
    Clients: formatNumber(row.newClientsCount),
    'Total Value (LTV)': formatCurrency(row.totalRevenue),
    'Avg Value': formatCurrency(row.avgRevenue),
    'Avg Days to Convert': row.avgDaysTaken > 0 ? `${row.avgDaysTaken.toFixed(1)} days` : 'N/A',
    'Avg Visits': row.avgVisitsPostTrial.toFixed(1),
  }));
};

const ClientRetention = () => {
  const {
    data,
    loading,
    error,
    refetch
  } = useNewClientData();
  const {
    data: payrollData,
    isLoading: payrollLoading
  } = usePayrollData();
  const {
    setLoading
  } = useGlobalLoading();
  const exportPreset = React.useMemo(() => (typeof window !== 'undefined' ? getConsolidatedExportPresetFromSearch(window.location.search) : null), []);
  const exportStudio = exportPreset ? getConsolidatedStudioOption(exportPreset.studioId) : null;
  const [selectedLocation, setSelectedLocation] = useState(exportPreset ? (exportPreset.studioId === 'all' ? 'All Locations' : (exportStudio?.locationLabel || DEFAULT_RETENTION_LOCATION)) : DEFAULT_RETENTION_LOCATION);
  const [isPendingTableSwitch, startTableSwitch] = useTransition();
  const [rememberLastTable, setRememberLastTable] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem('p57-retention-remember-table') !== '0';
  });
  const [activeTable, setActiveTable] = useState(() => {
    if (typeof window === 'undefined') return 'monthonmonthbytype';
    const remember = window.localStorage.getItem('p57-retention-remember-table') !== '0';
    const saved = window.localStorage.getItem('p57-retention-active-table');
    return remember && isRetentionTable(saved) ? saved : 'monthonmonthbytype';
  });
  const [compactTableMode, setCompactTableMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('p57-retention-compact-mode') === '1';
  });
  const [chartsOpen, setChartsOpen] = useState(false);
  const selectedMetric = 'conversion';
  const [drillDownModal, setDrillDownModal] = useState<DrillDownModalState>({
    isOpen: false,
    title: '',
    data: null,
    type: 'month'
  });

  // Filters state
  const [filters, setFilters] = useState<NewClientFilterOptions>(() => {
    const defaultDateRange = getDashboardDefaultDateRange();
    return {
      dateRange: { start: exportPreset?.startDate || defaultDateRange.start, end: exportPreset?.endDate || defaultDateRange.end },
      location: [],
      homeLocation: [],
      trainer: [],
      paymentMethod: [],
      retentionStatus: [],
      conversionStatus: [],
      isNew: [],
      minLTV: undefined,
      maxLTV: undefined
    };
  });
  const defaultFiltersNormalizedRef = useRef(false);

  useEffect(() => {
    if (exportPreset || defaultFiltersNormalizedRef.current) return;

    defaultFiltersNormalizedRef.current = true;
    const defaultDateRange = getDashboardDefaultDateRange();
    setFilters((current) => {
      if (current.dateRange.start === defaultDateRange.start && current.dateRange.end === defaultDateRange.end) {
        return current;
      }

      return {
        ...current,
        dateRange: defaultDateRange,
      };
    });
  }, [exportPreset]);
  useEffect(() => {
    setLoading(loading || payrollLoading, 'Analyzing client conversion and retention patterns...');
  }, [loading, payrollLoading, setLoading]);

  // Create comprehensive filtered payroll data matching all applied filters
  const filteredPayrollData = useMemo(() => {
    if (!payrollData || payrollData.length === 0) return [];
    
    let filtered = payrollData;
    
    // Apply location filter
    if (selectedLocation !== 'All Locations') {
      filtered = filtered.filter(payroll => {
        const payrollLocation = payroll.location || '';
        
        // For Kenkere House, use flexible matching
        if (selectedLocation === 'Kenkere House, Bengaluru') {
          return payrollLocation.toLowerCase().includes('kenkere') || 
                 payrollLocation.toLowerCase().includes('bengaluru') || 
                 payrollLocation === 'Kenkere House';
        }
        
        // For other locations, use exact match
        return payrollLocation === selectedLocation;
      });
    }
    
    // Apply date range filter to payroll data using monthYear field
    if (filters.dateRange.start || filters.dateRange.end) {
      const startDate = filters.dateRange.start ? new Date(filters.dateRange.start + 'T00:00:00') : null;
      const endDate = filters.dateRange.end ? new Date(filters.dateRange.end + 'T23:59:59') : null;
      filtered = filtered.filter(payroll => {
        const month = parseRetentionMonthYear(payroll.monthYear);
        if (!month) return false;
        const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59, 999);
        return (!startDate || monthEnd >= startDate) && (!endDate || month <= endDate);
      });
    }
    
    // Apply trainer filter if specified
    if (filters.trainer.length > 0) {
      filtered = filtered.filter(payroll => filters.trainer.includes(payroll.teacherName || ''));
    }
    
    return filtered;
  }, [payrollData, selectedLocation, filters]);

  // Create visits summary from filtered payroll data
  const visitsSummary = useMemo(() => {
    if (!filteredPayrollData || filteredPayrollData.length === 0) return {};
    
    const summary: Record<string, number> = {};
    filteredPayrollData.forEach(payroll => {
      if (payroll.monthYear && payroll.totalCustomers) {
        // Use monthYear directly as key (should be in format like "Jan 2024")
        const key = payroll.monthYear;
        summary[key] = (summary[key] || 0) + payroll.totalCustomers;
      }
    });
    
    return summary;
  }, [filteredPayrollData]);

  // Create visits summary without date range (for MoM tables that ignore date range)
  const filteredPayrollDataNoDateRange = useMemo(() => {
    if (!payrollData || payrollData.length === 0) return [];
    let filtered = payrollData;

    // Apply location filter
    if (selectedLocation !== 'All Locations') {
      filtered = filtered.filter(payroll => {
        const payrollLocation = payroll.location || '';
        if (selectedLocation === 'Kenkere House, Bengaluru') {
          return payrollLocation.toLowerCase().includes('kenkere') ||
            payrollLocation.toLowerCase().includes('bengaluru') ||
            payrollLocation === 'Kenkere House';
        }
        return payrollLocation === selectedLocation;
      });
    }

    // Apply trainer filter if specified
    if (filters.trainer.length > 0) {
      filtered = filtered.filter(payroll => filters.trainer.includes(payroll.teacherName || ''));
    }

    return filtered;
  }, [payrollData, selectedLocation, filters.trainer]);

  const visitsSummaryNoDateRange = useMemo(() => {
    if (!filteredPayrollDataNoDateRange || filteredPayrollDataNoDateRange.length === 0) return {};
    const summary: Record<string, number> = {};
    filteredPayrollDataNoDateRange.forEach(payroll => {
      if (payroll.monthYear && payroll.totalCustomers) {
        const key = payroll.monthYear; // Expect format like "Jan 2024"
        summary[key] = (summary[key] || 0) + payroll.totalCustomers;
      }
    });
    return summary;
  }, [filteredPayrollDataNoDateRange]);

  // Get unique values for filters (only 3 main locations)
  const uniqueLocations = React.useMemo(() => {
    const mainLocations = ['Kwality House, Kemps Corner', 'Supreme HQ, Bandra', 'Kenkere House, Bengaluru'];
    const locations = new Set<string>();
    data.forEach(client => {
      if (client.firstVisitLocation && mainLocations.includes(client.firstVisitLocation)) {
        locations.add(client.firstVisitLocation);
      }
    });
    return Array.from(locations).filter(Boolean);
  }, [data]);
  const uniqueTrainers = React.useMemo(() => {
    const trainers = new Set<string>();
    data.forEach(client => {
      if (client.trainerName) trainers.add(client.trainerName);
    });
    return Array.from(trainers).filter(Boolean);
  }, [data]);
  const uniqueMembershipTypes = React.useMemo(() => {
    const memberships = new Set<string>();
    data.forEach(client => {
      if (client.membershipUsed) memberships.add(client.membershipUsed);
    });
    return Array.from(memberships).filter(Boolean);
  }, [data]);

  // Filter data by selected location and filters
  const filteredData = React.useMemo(() => {
    let filtered = data;

    // Apply either date boundary, including a partially selected range.
    if (filters.dateRange.start || filters.dateRange.end) {
      const startDate = filters.dateRange.start ? new Date(filters.dateRange.start + 'T00:00:00') : null;
      const endDate = filters.dateRange.end ? new Date(filters.dateRange.end + 'T23:59:59') : null;
      
      filtered = filtered.filter(client => isClientInRetentionDateRange(client, startDate, endDate));
    }

    // Apply location filter - check ONLY firstVisitLocation (where the trial/first visit occurred)
    if (selectedLocation !== 'All Locations') {
      filtered = filtered.filter(client => {
        const firstLocation = client.firstVisitLocation || '';

        // For Kenkere House, try more flexible matching
        if (selectedLocation === 'Kenkere House, Bengaluru') {
          return firstLocation.toLowerCase().includes('kenkere') || 
                 firstLocation.toLowerCase().includes('bengaluru') || 
                 firstLocation === 'Kenkere House';
        }

        // For other locations, use exact match
        return firstLocation === selectedLocation;
      });
    }

    // Apply additional filters
    if (filters.location.length > 0) {
      filtered = filtered.filter(client => filters.location.includes(client.firstVisitLocation || ''));
    }
    if (filters.trainer.length > 0) {
      filtered = filtered.filter(client => filters.trainer.includes(client.trainerName || ''));
    }

    // Apply other filters
    if (filters.conversionStatus.length > 0) {
      filtered = filtered.filter(client => filters.conversionStatus.includes(client.conversionStatus || ''));
    }
    if (filters.retentionStatus.length > 0) {
      filtered = filtered.filter(client => filters.retentionStatus.includes(client.retentionStatus || ''));
    }
    if (filters.paymentMethod.length > 0) {
      filtered = filtered.filter(client => filters.paymentMethod.includes(client.paymentMethod || ''));
    }
    if (filters.isNew.length > 0) {
      filtered = filtered.filter(client => filters.isNew.includes(client.isNew || ''));
    }

    // Apply LTV filters
    if (filters.minLTV !== undefined) {
      filtered = filtered.filter(client => (client.ltv || 0) >= filters.minLTV!);
    }
    if (filters.maxLTV !== undefined) {
      filtered = filtered.filter(client => (client.ltv || 0) <= filters.maxLTV!);
    }
    
    return filtered;
  }, [data, selectedLocation, filters]);

  // Special filtered data for month-on-month and year-on-year tables - ignores date range but applies location filter
  const filteredDataNoDateRange = React.useMemo(() => {
    let filtered = data;

    // Apply location filter - check ONLY firstVisitLocation (where the trial/first visit occurred)
    if (selectedLocation !== 'All Locations') {
      filtered = filtered.filter(client => {
        const firstLocation = client.firstVisitLocation || '';

        // For Kenkere House, try more flexible matching
        if (selectedLocation === 'Kenkere House, Bengaluru') {
          return firstLocation.toLowerCase().includes('kenkere') || 
                 firstLocation.toLowerCase().includes('bengaluru') || 
                 firstLocation === 'Kenkere House';
        }

        // For other locations, use exact match
        return firstLocation === selectedLocation;
      });
    }

    // Apply additional filters (but NOT date range)
    if (filters.location.length > 0) {
      filtered = filtered.filter(client => filters.location.includes(client.firstVisitLocation || ''));
    }
    if (filters.trainer.length > 0) {
      filtered = filtered.filter(client => filters.trainer.includes(client.trainerName || ''));
    }

    // Apply other filters
    if (filters.conversionStatus.length > 0) {
      filtered = filtered.filter(client => filters.conversionStatus.includes(client.conversionStatus || ''));
    }
    if (filters.retentionStatus.length > 0) {
      filtered = filtered.filter(client => filters.retentionStatus.includes(client.retentionStatus || ''));
    }
    if (filters.paymentMethod.length > 0) {
      filtered = filtered.filter(client => filters.paymentMethod.includes(client.paymentMethod || ''));
    }
    if (filters.isNew.length > 0) {
      filtered = filtered.filter(client => filters.isNew.includes(client.isNew || ''));
    }

    // Apply LTV filters
    if (filters.minLTV !== undefined) {
      filtered = filtered.filter(client => (client.ltv || 0) >= filters.minLTV!);
    }
    if (filters.maxLTV !== undefined) {
      filtered = filtered.filter(client => (client.ltv || 0) <= filters.maxLTV!);
    }
    
    return filtered;
  }, [data, selectedLocation, filters]);

  const deferredFilteredData = useDeferredValue(filteredData);
  const deferredFilteredDataNoDateRange = useDeferredValue(filteredDataNoDateRange);
  const deferredFilteredPayrollData = useDeferredValue(filteredPayrollData);

  const selectedMomMonths = useMemo(
    () => buildMomMonths(filteredDataNoDateRange),
    [filteredDataNoDateRange]
  );

  const selectedYoyMonths = useMemo(
    () => buildYoyMonths(filteredData, filters.dateRange),
    [filteredData, filters.dateRange]
  );

  const handleTableChange = useCallback((table: string) => {
    startTableSwitch(() => setActiveTable(table));
  }, [startTableSwitch]);

  const resetViewPreferences = useCallback(() => {
    setCompactTableMode(false);
    setRememberLastTable(true);
    startTableSwitch(() => setActiveTable('monthonmonthbytype'));

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('p57-retention-compact-mode');
      window.localStorage.removeItem('p57-retention-active-table');
      window.localStorage.setItem('p57-retention-remember-table', '1');
    }
  }, [startTableSwitch]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (rememberLastTable) {
      window.localStorage.setItem('p57-retention-active-table', activeTable);
    }
  }, [activeTable, rememberLastTable]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('p57-retention-remember-table', rememberLastTable ? '1' : '0');
    if (!rememberLastTable) {
      window.localStorage.removeItem('p57-retention-active-table');
    }
  }, [rememberLastTable]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('p57-retention-compact-mode', compactTableMode ? '1' : '0');
  }, [compactTableMode]);


  const heroMetrics = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];
    
    const totalTrials = filteredData.length;
    const newMembers = filteredData.filter(c => isNewClient(c)).length;
    const converted = filteredData.filter(c => isConverted(c)).length;
    const retained = filteredData.filter(c => isRetained(c)).length;
    const conversionRate = totalTrials > 0 ? (converted / totalTrials) * 100 : 0;
    const retentionRate = totalTrials > 0 ? (retained / totalTrials) * 100 : 0;
    const totalLTV = filteredData.reduce((sum, c) => sum + (c.ltv || 0), 0);
    const avgLTV = totalTrials > 0 ? totalLTV / totalTrials : 0;
    
    return [
      {
        label: 'Total Trials',
        value: formatNumber(totalTrials)
      },
      {
        label: 'Conversion Rate',
        value: formatPercentage(conversionRate)
      },
      {
        label: 'Retention Rate',
        value: formatPercentage(retentionRate)
      },
      {
        label: 'Avg LTV',
        value: formatCurrency(avgLTV)
      }
    ];
  }, [filteredData]);
  
  // Build section-wise processed export maps (not raw sheet rows)
  const exportAdditionalData = React.useMemo(() => {
    const exportSections: Record<string, ExportRow[]> = {};

    exportSections['Client Retention • By Client Type • Client Type View'] = buildClientConversionMonthOnMonthRows(filteredData, visitsSummary, 'clientType');
    exportSections['Client Retention • By Client Type • Membership View'] = buildClientConversionMonthOnMonthRows(filteredData, visitsSummary, 'membership');
    exportSections['Client Retention • By Client Type • Teacher View'] = buildClientConversionMonthOnMonthRows(filteredData, visitsSummary, 'teacher');

    const momMonths = selectedMomMonths;
    const momPivot = buildRetentionPivotMatrix(filteredDataNoDateRange, momMonths, 'clientType');
    (Object.keys(RETENTION_PIVOT_METRIC_LABELS) as RetentionPivotMetricKey[]).forEach((metricKey) => {
      exportSections[`Client Retention • MoM Pivot • ${RETENTION_PIVOT_METRIC_LABELS[metricKey]}`] = buildPivotMetricExportRows(
        'Client Type',
        momMonths,
        momPivot.rowKeys,
        momPivot.matrix,
        momPivot.totals,
        metricKey
      );
    });

    const yoyMonths = selectedYoyMonths;
    const yoyClientTypePivot = buildRetentionPivotMatrix(filteredDataNoDateRange, yoyMonths, 'clientType');
    const yoyMembershipPivot = buildRetentionPivotMatrix(filteredDataNoDateRange, yoyMonths, 'membership');
    (Object.keys(RETENTION_PIVOT_METRIC_LABELS) as RetentionPivotMetricKey[]).forEach((metricKey) => {
      exportSections[`Client Retention • YoY Pivot • Client Type • ${RETENTION_PIVOT_METRIC_LABELS[metricKey]}`] = buildPivotMetricExportRows(
        'Client Type',
        yoyMonths,
        yoyClientTypePivot.rowKeys,
        yoyClientTypePivot.matrix,
        yoyClientTypePivot.totals,
        metricKey
      );
      exportSections[`Client Retention • YoY Pivot • Membership • ${RETENTION_PIVOT_METRIC_LABELS[metricKey]}`] = buildPivotMetricExportRows(
        'Membership',
        yoyMonths,
        yoyMembershipPivot.rowKeys,
        yoyMembershipPivot.matrix,
        yoyMembershipPivot.totals,
        metricKey
      );
    });

    exportSections['Client Retention • Hosted Classes'] = buildHostedClassesExportRows(filteredData);
    exportSections['Client Retention • Memberships'] = buildMembershipPerformanceRows(filteredData);
    exportSections['Client Retention • Teacher Performance'] = buildTeacherPerformanceRows(filteredData);
    exportSections['Client Retention • New Client Purchases • Detailed'] = buildNewClientPurchaseRows(filteredData, 'detailed');
    exportSections['Client Retention • New Client Purchases • By Membership'] = buildNewClientPurchaseRows(filteredData, 'membership');
    exportSections['Client Retention • New Client Purchases • By Client Type'] = buildNewClientPurchaseRows(filteredData, 'clientType');

    return exportSections;
  }, [filteredData, filteredDataNoDateRange, selectedMomMonths, selectedYoyMonths, visitsSummary]);

  const exportButton = <AdvancedExportButton additionalData={exportAdditionalData} defaultFileName={`client-retention-${selectedLocation.replace(/\s+/g, '-').toLowerCase()}`} size="sm" variant="ghost" buttonClassName="rounded-xl border border-white/30 text-white hover:border-white/50" buttonLabel="Export Retention Tables" />;
  const lazySectionFallback = (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
      <p className="text-sm font-medium text-slate-600">Loading section...</p>
    </div>
  );

  return <div className="client-retention-page min-h-screen bg-slate-50 text-slate-900">
      <div className="relative z-10">
        <div className="bg-white text-slate-800">
          <DashboardMotionHero 
            title="Client Conversion & Retention" 
            subtitle="Comprehensive client acquisition and retention analysis across all customer touchpoints" 
            metrics={heroMetrics}
            extra={exportButton}
          />
          <div className="mx-auto w-full max-w-screen-2xl px-3 pb-5 sm:px-6 lg:px-8">
            <KpiTicker items={heroMetrics} />
          </div>
        </div>

        <div className="mx-auto w-full max-w-screen-2xl px-3 py-5 sm:px-6 lg:px-8">
          <main className="min-w-0 space-y-5">
            {/* Section Navigation */}
            <SectionTimelineNav />
            
            {/* Enhanced Location Tabs - unified styling (moved above filters) */}
            <StudioLocationTabs 
              activeLocation={selectedLocation === 'All Locations' ? 'all' : 
                selectedLocation.toLowerCase().includes('kwality') ? 'kwality' : 
                selectedLocation.toLowerCase().includes('supreme') ? 'supreme' : 
                selectedLocation.toLowerCase().includes('kenkere') ? 'kenkere' : 'all'}
              onLocationChange={(locationId) => {
                const locationMap: Record<string, string> = {
                  'all': 'All Locations',
                  'kwality': 'Kwality House, Kemps Corner',
                  'supreme': 'Supreme HQ, Bandra',
                  'kenkere': 'Kenkere House, Bengaluru'
                };
                setSelectedLocation(locationMap[locationId] || 'All Locations');
              }}
              showInfoPopover={true}
              infoPopoverContext="client-retention-overview"
            />

            {error && (
              <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <span>Client retention data could not be loaded. {error}</span>
                <button type="button" disabled={loading} onClick={() => void refetch()} className="rounded-md border border-red-300 px-3 py-2 font-medium hover:bg-red-100 disabled:opacity-50">Retry</button>
              </div>
            )}
            {/* Enhanced Filter Section */}
            <div className="min-w-0" id="filters">
              <EnhancedClientConversionFilterSection filters={filters} onFiltersChange={setFilters} locations={uniqueLocations} trainers={uniqueTrainers} membershipTypes={uniqueMembershipTypes} />
            </div>

          {/* Enhanced Metric Cards */}
          <div id="metrics" className="rounded-2xl p-0">
            <ClientConversionMetricCards 
              data={deferredFilteredData}
              historicalData={deferredFilteredDataNoDateRange}
              dateRange={filters.dateRange}
              onCardClick={(title, data, metricType) => setDrillDownModal({
              isOpen: true,
              title: `${title} - Detailed Analysis`,
              data: {
                clients: data,
                metricType
              },
              type: 'metric'
            })}
            />
          </div>

          {/* Enhanced Simplified Ranking System */}
          <div className="min-w-0" id="rankings">
            <Suspense fallback={lazySectionFallback}>
              <ClientConversionSimplifiedRanks 
              data={deferredFilteredData} 
              payrollData={deferredFilteredPayrollData}
              allPayrollData={payrollData}
              allClientData={data}
              selectedLocation={selectedLocation}
              dateRange={filters.dateRange}
              selectedMetric={selectedMetric}
              onDrillDown={(type, item, metric) => {
                // Enhanced filtering
                const relatedClients = deferredFilteredData.filter(client => {
                  let match = false;
                  if (type === 'trainer') {
                    match = client.trainerName === item.name;
                  } else if (type === 'location') {
                    match = client.firstVisitLocation === item.name;
                  } else if (type === 'membership') {
                    match = client.membershipUsed === item.name;
                  }
                  return match;
                });

                const relatedPayroll = deferredFilteredPayrollData.filter(payroll => {
                  if (type === 'trainer') return payroll.teacherName === item.name;
                  if (type === 'location') return payroll.location === item.name;
                  return false;
                });

                setDrillDownModal({
                  isOpen: true,
                  title: `${item.name} - ${metric} Analysis`,
                  data: {
                    type,
                    item,
                    metric,
                    relatedClients,
                    relatedPayroll
                  },
                  type: 'ranking'
                });
              }}
            />
            </Suspense>
          </div>

          {/* Enhanced Interactive Charts - Collapsed by default */}
          <div className="min-w-0" id="charts">
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <details className="group" onToggle={(event) => setChartsOpen(event.currentTarget.open)}>
                <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
                  <span className="inline-flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-slate-700" />
                    Interactive Charts & Visualizations
                  </span>
                </summary>
                <div className="p-6 bg-gradient-to-br from-white to-slate-50/50">
                  <Suspense fallback={lazySectionFallback}>
                    {chartsOpen && <ClientConversionEnhancedCharts data={deferredFilteredData} />}
                  </Suspense>
                </div>
              </details>
            </div>
          </div>

          {/* Performance & view controls (collapsed by default to reduce clutter) */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm" id="performance-controls">
            <details>
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-2xl px-6 py-4 text-sm font-semibold text-slate-800 hover:bg-slate-50/70">
                <SlidersHorizontal className="h-4 w-4 text-slate-700" />
                View preferences
              </summary>
              <div className="grid gap-4 border-t border-slate-200/80 px-6 py-5 md:grid-cols-2 xl:grid-cols-3">
                <button
                  type="button"
                  aria-pressed={compactTableMode}
                  onClick={() => setCompactTableMode((prev) => !prev)}
                  className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                    compactTableMode
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    <Gauge className="h-4 w-4" />
                    Compact Table Density
                  </div>
                  <div className={`mt-1 text-xs ${compactTableMode ? 'text-slate-200' : 'text-slate-500'}`}>
                    Reduces row spacing for faster scanning.
                  </div>
                </button>

                <button
                  type="button"
                  aria-pressed={rememberLastTable}
                  onClick={() => setRememberLastTable((prev) => !prev)}
                  className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                    rememberLastTable
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    <Clock3 className="h-4 w-4" />
                    Remember Last Table
                  </div>
                  <div className={`mt-1 text-xs ${rememberLastTable ? 'text-slate-200' : 'text-slate-500'}`}>
                    Reopens the last viewed table automatically.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={resetViewPreferences}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-700 transition hover:border-slate-300"
                >
                  <div className="flex items-center gap-2 font-semibold">
                    <RotateCcw className="h-4 w-4" />
                    Reset View Preferences
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Restores default table view controls.
                  </div>
                </button>
              </div>
            </details>
          </div>

          {/* Enhanced Data Table Selector */}
          <div className="min-w-0" id="table-selector">
            <ClientConversionDataTableSelector
              activeTable={activeTable}
              onTableChange={handleTableChange}
              dataLength={['monthonmonth', 'yearonyear'].includes(activeTable) ? deferredFilteredDataNoDateRange.length : deferredFilteredData.length}
              isPending={isPendingTableSwitch}
            />
          </div>

          {/* Selected Data Table */}
          <div className="space-y-8">
            <Suspense fallback={lazySectionFallback}>
              {activeTable === 'monthonmonthbytype' && (
                <div
                  id="monthonmonthbytype-table"
                  className={`client-retention-sales-table min-w-0 ${compactTableMode ? 'client-retention-compact' : ''}`}
                >
                  <ClientConversionMonthOnMonthByTypeTable
                    data={deferredFilteredData}
                    visitsSummary={visitsSummary}
                    onRowClick={rowData => setDrillDownModal({
                      isOpen: true,
                      title: `${rowData.type} Analysis`,
                      data: rowData,
                      type: 'month'
                    })}
                  />
                </div>
              )}

              {activeTable === 'monthonmonth' && (
                <div
                  id="monthonmonth-table"
                  className={`client-retention-sales-table min-w-0 ${compactTableMode ? 'client-retention-compact' : ''}`}
                >
                  <ClientRetentionMonthByTypePivot
                    data={deferredFilteredDataNoDateRange}
                    months={selectedMomMonths}
                    visitsSummary={visitsSummaryNoDateRange}
                    onRowClick={rowData => setDrillDownModal({
                      isOpen: true,
                      title: `${rowData.type} - Analysis`,
                      data: rowData,
                      type: 'month'
                    })}
                  />
                </div>
              )}

              {activeTable === 'yearonyear' && (
                <div
                  id="yearonyear-table"
                  className={`client-retention-sales-table min-w-0 ${compactTableMode ? 'client-retention-compact' : ''}`}
                >
                  <ClientRetentionYearOnYearPivot
                    data={deferredFilteredDataNoDateRange}
                    months={selectedYoyMonths}
                    onRowClick={rowData => setDrillDownModal({
                      isOpen: true,
                      title: `${rowData.rowKey} - Year Comparison`,
                      data: rowData,
                      type: 'year'
                    })}
                  />
                </div>
              )}

              {activeTable === 'hostedclasses' && (
                <div
                  id="hostedclasses-table"
                  className={`client-retention-sales-table min-w-0 ${compactTableMode ? 'client-retention-compact' : ''}`}
                >
                  <ClientHostedClassesTable
                    data={deferredFilteredData}
                    onRowClick={rowData => setDrillDownModal({
                      isOpen: true,
                      title: `${rowData.className} - ${rowData.month}`,
                      data: rowData,
                      type: 'class'
                    })}
                  />
                </div>
              )}

              {activeTable === 'memberships' && (
                <div
                  id="memberships-table"
                  className={`client-retention-sales-table min-w-0 ${compactTableMode ? 'client-retention-compact' : ''}`}
                >
                  <ClientConversionMembershipTable
                    data={deferredFilteredData}
                    onRowClick={rowData => setDrillDownModal({
                      isOpen: true,
                      title: `${rowData.membershipType} - Membership Analysis`,
                      data: rowData,
                      type: 'membership'
                    })}
                  />
                </div>
              )}

              {activeTable === 'teacherperformance' && (
                <div
                  id="teacherperformance-table"
                  className={`client-retention-sales-table min-w-0 ${compactTableMode ? 'client-retention-compact' : ''}`}
                >
                  <TeacherPerformanceTable
                    data={deferredFilteredData}
                    onRowClick={rowData => setDrillDownModal({
                      isOpen: true,
                      title: `${rowData.trainerName} - Teacher Performance Analysis`,
                      data: {
                        type: 'trainer',
                        item: { name: rowData.trainerName },
                        metric: 'performance',
                        relatedClients: deferredFilteredData.filter(client => client.trainerName === rowData.trainerName),
                        relatedPayroll: deferredFilteredPayrollData.filter(payroll => payroll.teacherName === rowData.trainerName)
                      },
                      type: 'ranking'
                    })}
                  />
                </div>
              )}

              {activeTable === 'newclientpurchases' && (
                <div
                  id="newclientpurchases-table"
                  className={`client-retention-sales-table min-w-0 ${compactTableMode ? 'client-retention-compact' : ''}`}
                >
                  <NewClientMembershipPurchaseTable data={deferredFilteredData} />
                </div>
              )}
            </Suspense>
          </div>
        </main>

        {/* Enhanced Drill Down Modal - Lazy loaded */}
        <ModalSuspense>
          {drillDownModal.isOpen && (
            <LazyClientConversionDrillDownModalV3 
              isOpen={drillDownModal.isOpen} 
              onClose={() => setDrillDownModal({
                isOpen: false,
                title: '',
                data: null,
                type: 'month'
              })} 
              title={drillDownModal.title} 
              data={drillDownModal.data} 
              type={drillDownModal.type} 
            />
          )}
        </ModalSuspense>
          <MetricDefinitions items={METRIC_DEFINITIONS.clientRetention} />
        </div>
      </div>
    </div>;
};
export default ClientRetention;
