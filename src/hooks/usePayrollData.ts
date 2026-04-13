import { useState, useEffect } from 'react';
import { PayrollData } from '@/types/dashboard';
import { fetchGoogleSheet, parseNumericValue, SPREADSHEET_IDS } from '@/utils/googleAuth';

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

export const usePayrollData = () => {
  const [data, setData] = useState<PayrollData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayrollDirectly = async (): Promise<PayrollData[]> => {
    const rows = await fetchGoogleSheet(SPREADSHEET_IDS.PAYROLL, 'Payroll', {
      valueRenderOption: 'FORMATTED_VALUE',
    });

    if (rows.length < 2) {
      return [];
    }

    return rows.slice(1).map(mapRowToPayroll);
  };

  const fetchPayrollData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let loadedData: PayrollData[] | null = null;
      let apiError: unknown = null;

      try {
        const response = await fetch('/api/payroll');
        if (!response.ok) {
          throw new Error(`Failed to fetch payroll data: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        if (result.error) {
          throw new Error(result.error);
        }

        loadedData = result.data || [];
      } catch (err) {
        apiError = err;
        loadedData = await fetchPayrollDirectly();
      }

      setData(loadedData || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching payroll data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load payroll data');
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollData();
  }, []);

  return { data, isLoading, error, refetch: fetchPayrollData };
};
