import { useState, useEffect } from 'react';
import { PayrollData } from '@/types/dashboard';

const GOOGLE_CONFIG = {
  CLIENT_ID: "YOUR_CLIENT_ID_1.apps.googleusercontent.com",
  CLIENT_SECRET: "GOCSPX-REDACTED_SECRET_1",
  REFRESH_TOKEN: "REDACTED_REFRESH_TOKEN_1B",
  TOKEN_URL: "https://oauth2.googleapis.com/token"
};

const SPREADSHEET_ID = "149ILDqovzZA6FRUJKOwzutWdVqmqWBtWPfzG3A0zxTI";

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
    if (typeof value === 'number') return value;
    if (!value || value === '') return 0;
    const cleaned = value.toString().replace(/,/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  const fetchPayrollData = async () => {
    try {
      console.log('Fetching payroll data from Google Sheets...');
      setIsLoading(true);
      const accessToken = await getAccessToken();
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Payroll?alt=json`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch payroll data: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const rows: any[] = result.values || [];
      if (rows.length < 2) {
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
        const conversionRate = parseNumericValue(row[27]);
        const retained = parseNumericValue(row[28]);
        const retentionRate = parseNumericValue(row[29]);
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
          conversion: conversionRate.toString() + '%',
          retained,
          retention: retentionRate.toString() + '%',
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
