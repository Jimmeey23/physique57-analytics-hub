import { useMemo } from 'react';
import { useSharedDataset } from '@/lib/datasetStore';
import { useNewClientData } from './useNewClientData';
import { deriveTrainerConversions } from '@/utils/payrollConversionDerivation';
import { PayrollData } from '@/types/dashboard';
import { fetchGoogleSheet, parseNumericValue, SPREADSHEET_IDS } from '@/utils/googleAuth';
import { useDataSource } from '@/contexts/DataSourceContext';
import { loadDatasetRowsForMode } from '@/lib/offlineDatasetLoader';
import { logger } from '@/utils/logger';

const mapRowToPayroll = (row: any[]): PayrollData => {
  const teacherId = row[0] || '';
  const teacherName = row[1] || '';
  const teacherEmail = row[2] || '';
  const location = row[3] || '';

  const cycleSessions = parseNumericValue(row[4]);
  const emptyCycleSessions = parseNumericValue(row[5]);
  const nonEmptyCycleSessions = parseNumericValue(row[6]);
  const cycleCustomers = parseNumericValue(row[7]);
  const cyclePaid = parseNumericValue(row[8]);

  const strengthSessions = parseNumericValue(row[9]);
  const emptyStrengthSessions = parseNumericValue(row[10]);
  const nonEmptyStrengthSessions = parseNumericValue(row[11]);
  const strengthCustomers = parseNumericValue(row[12]);
  const strengthPaid = parseNumericValue(row[13]);

  const barreSessions = parseNumericValue(row[14]);
  const emptyBarreSessions = parseNumericValue(row[15]);
  const nonEmptyBarreSessions = parseNumericValue(row[16]);
  const barreCustomers = parseNumericValue(row[17]);
  const barrePaid = parseNumericValue(row[18]);

  const totalSessions = parseNumericValue(row[19]);
  const totalEmptySessions = parseNumericValue(row[20]);
  const totalNonEmptySessions = parseNumericValue(row[21]);
  const totalCustomers = parseNumericValue(row[22]);
  const totalPaid = parseNumericValue(row[23]);

  const monthYear = row[24] || '';
  const unique = row[25] || '';
  const converted = parseNumericValue(row[26]);
  const conversionRate = parseNumericValue(row[27]);
  const retained = parseNumericValue(row[28]);
  const retentionRate = parseNumericValue(row[29]);
  const newMembers = parseNumericValue(row[30]);

  const classAverageInclEmpty = totalSessions > 0 ? totalCustomers / totalSessions : 0;
  const classAverageExclEmpty = totalNonEmptySessions > 0 ? totalCustomers / totalNonEmptySessions : 0;

  return {
    teacherId,
    teacherName,
    teacherEmail,
    location,
    cycleSessions,
    emptyCycleSessions,
    nonEmptyCycleSessions,
    cycleCustomers,
    cyclePaid,
    strengthSessions,
    emptyStrengthSessions,
    nonEmptyStrengthSessions,
    strengthCustomers,
    strengthPaid,
    barreSessions,
    emptyBarreSessions,
    nonEmptyBarreSessions,
    barreCustomers,
    barrePaid,
    totalSessions,
    totalEmptySessions,
    totalNonEmptySessions,
    totalCustomers,
    totalPaid,
    monthYear,
    unique,
    converted,
    conversion: `${conversionRate}%`,
    retained,
    retention: `${retentionRate}%`,
    new: newMembers,
    conversionRate,
    retentionRate,
    classAverageInclEmpty,
    classAverageExclEmpty,
  };
};

const EMPTY_PAYROLL: PayrollData[] = [];

export const usePayrollData = () => {
  const { mode, reportSource } = useDataSource();
  // Shared cache: this reuses the already-parsed new-client dataset, it does
  // not trigger a second network round trip.
  const { data: newClients } = useNewClientData();

  const { data, loading, error, refetch } = useSharedDataset<PayrollData[]>(
    `payroll:${mode}`,
    async () => {
      const { rows } = await loadDatasetRowsForMode('payroll', mode, async () => {
        try {
          const response = await fetch('/api/payroll');
          if (!response.ok) {
            throw new Error(`Failed to fetch payroll data: ${response.status} ${response.statusText}`);
          }

          const result = await response.json();
          if (result.error) {
            throw new Error(result.error);
          }

          const headers = [
            'teacherId', 'teacherName', 'teacherEmail', 'location',
            'cycleSessions', 'emptyCycleSessions', 'nonEmptyCycleSessions', 'cycleCustomers', 'cyclePaid',
            'strengthSessions', 'emptyStrengthSessions', 'nonEmptyStrengthSessions', 'strengthCustomers', 'strengthPaid',
            'barreSessions', 'emptyBarreSessions', 'nonEmptyBarreSessions', 'barreCustomers', 'barrePaid',
            'totalSessions', 'totalEmptySessions', 'totalNonEmptySessions', 'totalCustomers', 'totalPaid',
            'monthYear', 'unique', 'converted', 'conversionRate', 'retained', 'retentionRate', 'newMembers'
          ];

          const bodyRows = (result.data || []).map((item: any) => [
            item.teacherId,
            item.teacherName,
            item.teacherEmail,
            item.location,
            item.cycleSessions,
            item.emptyCycleSessions,
            item.nonEmptyCycleSessions,
            item.cycleCustomers,
            item.cyclePaid,
            item.strengthSessions,
            item.emptyStrengthSessions,
            item.nonEmptyStrengthSessions,
            item.strengthCustomers,
            item.strengthPaid,
            item.barreSessions,
            item.emptyBarreSessions,
            item.nonEmptyBarreSessions,
            item.barreCustomers,
            item.barrePaid,
            item.totalSessions,
            item.totalEmptySessions,
            item.totalNonEmptySessions,
            item.totalCustomers,
            item.totalPaid,
            item.monthYear,
            item.unique,
            item.converted,
            item.conversionRate,
            item.retained,
            item.retentionRate,
            item.new,
          ]);

          return [headers, ...bodyRows];
        } catch {
          const sheetRows = await fetchGoogleSheet(SPREADSHEET_IDS.PAYROLL, 'Payroll', {
            valueRenderOption: 'FORMATTED_VALUE',
          });
          if (sheetRows.length < 2) return sheetRows;
          // Live sheet layout splits Month(24)/Year(25) ahead of Unique Key(26),
          // Converted(27), Conversion Rate(28), Retained(29), Retention Rate(30),
          // New(31) — normalize to the mapper's [monthYear, unique, ...] layout.
          // (If Year is blank the row already matches the mapper layout.)
          const body = sheetRows.slice(1).map((r: any[]) => {
            const c24 = r[24] ?? '';
            const c25 = r[25] ?? '';
            const hasSplitYear = /^\d{4}$/.test(String(c25).trim());
            const monthYear = hasSplitYear ? `${c24}-${c25}` : c24;
            const rest = hasSplitYear ? r.slice(26, 33) : r.slice(25, 32);
            while (rest.length < 7) rest.push('');
            return [...r.slice(0, 24), monthYear, ...rest];
          });
          return [sheetRows[0], ...body];
        }
      }, reportSource);

      return rows.length < 2 ? EMPTY_PAYROLL : rows.slice(1).map(mapRowToPayroll);
    },
  );

  const enriched = useMemo(
    () => deriveTrainerConversions(data ?? EMPTY_PAYROLL, newClients),
    [data, newClients],
  );

  return useMemo(
    () => ({ data: enriched, isLoading: loading, error, refetch }),
    [enriched, loading, error, refetch],
  );
};
