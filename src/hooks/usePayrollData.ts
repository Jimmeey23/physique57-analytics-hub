import { useState, useEffect } from 'react';
import { PayrollData } from '@/types/dashboard';

// Load sensitive values from environment — do NOT commit secrets to repo.
const GOOGLE_CONFIG = {
  CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  CLIENT_SECRET: import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '',
  REFRESH_TOKEN: import.meta.env.VITE_GOOGLE_REFRESH_TOKEN || '',
  TOKEN_URL: 'https://oauth2.googleapis.com/token',
};

const SPREADSHEET_ID = import.meta.env.VITE_PAYROLL_SPREADSHEET_ID || '149ILDqovzZA6FRUJKOwzutWdVqmqWBtWPfzG3A0zxTI';

export const usePayrollData = () => {
  const [data, setData] = useState<PayrollData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getAccessToken = async () => {
    try {
      const response = await fetch(GOOGLE_CONFIG.TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GOOGLE_CONFIG.CLIENT_ID,
          client_secret: GOOGLE_CONFIG.CLIENT_SECRET,
          refresh_token: GOOGLE_CONFIG.REFRESH_TOKEN,
          grant_type: 'refresh_token',
        }),
      });
      const tokenData = await response.json();
      return tokenData.access_token as string;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  };

  const parseNumericValue = (value: string | number): number => {
    if (typeof value === 'number') return isNaN(value) ? 0 : value;
    if (!value || value === '') return 0;
    const cleaned = value.toString().replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  const fetchPayrollData = async () => {
    try {
      console.log('Fetching payroll data from Google Sheets...');
      setIsLoading(true);
      const accessToken = await getAccessToken();
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Payroll?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch payroll data: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const rows: any[] = result.values || [];

      // If no rows returned, provide a local development fallback dataset
      if (rows.length < 2) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('No rows returned from Sheets; using local SAMPLE_PAYROLL for development.');
          const SAMPLE_PAYROLL: PayrollData[] = [
            {
              teacherId: 't1',
              teacherName: 'Asha Kapoor',
              teacherEmail: 'asha@example.com',
              location: 'Kwality House, Kemps Corner',
              cycleSessions: 4,
              emptyCycleSessions: 0,
              nonEmptyCycleSessions: 4,
              cycleCustomers: 28,
              cyclePaid: 5600,
              barreSessions: 2,
              emptyBarreSessions: 0,
              nonEmptyBarreSessions: 2,
              barreCustomers: 12,
              barrePaid: 2400,
              strengthSessions: 3,
              emptyStrengthSessions: 0,
              nonEmptyStrengthSessions: 3,
              strengthCustomers: 18,
              strengthPaid: 3600,
              totalSessions: 9,
              totalEmptySessions: 0,
              totalNonEmptySessions: 9,
              totalCustomers: 58,
              totalPaid: 11600,
              monthYear: '2025-11',
              unique: 'u1',
              new: 4,
              retained: 10,
              retention: '17.2%',
              converted: 6,
              conversion: '10.3%',
              conversionRate: 10.3,
              retentionRate: 17.2,
              newCustomers: 4,
              classAverageInclEmpty: 58 / 9,
              classAverageExclEmpty: 58 / 9,
            },
            {
              teacherId: 't2',
              teacherName: 'Rohan Mehta',
              teacherEmail: 'rohan@example.com',
              location: 'Supreme HQ, Bandra',
              cycleSessions: 6,
              emptyCycleSessions: 1,
              nonEmptyCycleSessions: 5,
              cycleCustomers: 40,
              cyclePaid: 8000,
              barreSessions: 0,
              emptyBarreSessions: 0,
              nonEmptyBarreSessions: 0,
              barreCustomers: 0,
              barrePaid: 0,
              strengthSessions: 4,
              emptyStrengthSessions: 0,
              nonEmptyStrengthSessions: 4,
              strengthCustomers: 28,
              strengthPaid: 5600,
              totalSessions: 10,
              totalEmptySessions: 1,
              totalNonEmptySessions: 9,
              totalCustomers: 68,
              totalPaid: 13600,
              monthYear: '2025-11',
              unique: 'u2',
              new: 2,
              retained: 8,
              retention: '11.8%',
              converted: 3,
              conversion: '4.4%',
              conversionRate: 4.4,
              retentionRate: 11.8,
              newCustomers: 2,
              classAverageInclEmpty: 68 / 10,
              classAverageExclEmpty: 68 / 9,
            }
          ];
          setData(SAMPLE_PAYROLL);
          setError(null);
          return;
        }

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

      setData(payrollData);
      setError(null);
    } catch (err) {
      console.error('Error fetching payroll data:', err);
      setError('Failed to load payroll data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollData();
  }, []);

  return { data, isLoading, error, refetch: fetchPayrollData };
};
