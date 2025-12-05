import { useState, useEffect } from 'react';
import { PayrollData } from '@/types/dashboard';
import { fetchGoogleSheet, parseNumericValue, SPREADSHEET_IDS } from '@/utils/googleAuth';
import { createLogger } from '@/utils/logger';

const logger = createLogger('usePayrollData');

// Flag to prevent multiple simultaneous fetches
let isFetching = false;

export const usePayrollData = () => {
  const [data, setData] = useState<PayrollData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayrollData = async () => {
    // Prevent multiple simultaneous fetches
    if (isFetching) {
      logger.warn('Fetch already in progress, skipping...');
      return;
    }
    
    try {
      isFetching = true;
      logger.info('Fetching payroll data from Google Sheets...');
      setIsLoading(true);
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout after 30 seconds')), 30000)
      );
      
      const fetchPromise = fetchGoogleSheet(SPREADSHEET_IDS.PAYROLL, 'Payroll');
      const rows = await Promise.race([fetchPromise, timeoutPromise]) as any[][];
      
      logger.info(`Received ${rows.length} rows from Google Sheets`);

      if (rows.length < 2) {
        logger.warn('Insufficient data rows (less than 2), returning empty data');
        setData([]);
        setError(null);
        return;
      }

      const payrollData: PayrollData[] = rows.slice(1).map((row: any[]) => {
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

  const converted = parseNumericValue(row[26]);
  // Normalize percentage-like fields: Sheets UNFORMATTED_VALUE returns 0-1 for % cells
  const conversionRateRaw = parseNumericValue(row[27]);
  const conversionRate = conversionRateRaw <= 1 && conversionRateRaw > 0 ? conversionRateRaw * 100 : conversionRateRaw;
  const retained = parseNumericValue(row[28]);
  const retentionRateRaw = parseNumericValue(row[29]);
  const retentionRate = retentionRateRaw <= 1 && retentionRateRaw > 0 ? retentionRateRaw * 100 : retentionRateRaw;
  const newMembers = parseNumericValue(row[30]);

        return {
          teacherId: row[0] || '',
          teacherName: row[1] || '',
          teacherEmail: row[2] || '',
          location: row[3] || '',

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

          monthYear: row[24] || '',
          unique: row[25] || '',
          converted,
          // Store human-readable strings for compatibility, ensure one decimal place
          conversion: `${conversionRate.toFixed(1)}%`,
          retained,
          retention: `${retentionRate.toFixed(1)}%`,
          new: newMembers,
          conversionRate,
          retentionRate,
          classAverageInclEmpty: totalSessions > 0 ? totalCustomers / totalSessions : 0,
          classAverageExclEmpty: totalNonEmptySessions > 0 ? totalCustomers / totalNonEmptySessions : 0,
        } as PayrollData;
      });

      logger.info(`Successfully transformed ${payrollData.length} payroll records`);
      logger.info(`Sample record:`, payrollData[0]);
      setData(payrollData);
      setError(null);
    } catch (err) {
      logger.error('Error fetching payroll data:', err);
      console.error('Detailed error:', err);
      setError(`Failed to load payroll data: ${err instanceof Error ? err.message : String(err)}`);
      setData([]);
    } finally {
      setIsLoading(false);
      isFetching = false;
    }
  };

  useEffect(() => {
    fetchPayrollData();
  }, []);

  return { data, isLoading, error, refetch: fetchPayrollData };
};
