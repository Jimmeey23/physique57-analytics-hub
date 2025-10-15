import { useState, useEffect } from 'react';

const GOOGLE_CONFIG = {
  CLIENT_ID: "YOUR_CLIENT_ID_1.apps.googleusercontent.com",
  CLIENT_SECRET: "GOCSPX-REDACTED_SECRET_1",
  REFRESH_TOKEN: "REDACTED_REFRESH_TOKEN_1B",
  TOKEN_URL: "https://oauth2.googleapis.com/token"
};

const SPREADSHEET_ID = "1sDPAX6OmGb48kL1pm0mhin2C9KD-Jykq8skJjNuQUNg";

export interface CheckinData {
  memberId: string;
  firstName: string;
  lastName: string;
  email: string;
  orderAt: string;
  paid: number;
  paymentMethodName: string;
  checkedIn: boolean;
  complementary: boolean;
  isLateCancelled: boolean;
  sessionId: string;
  sessionName: string;
  capacity: number;
  location: string;
  dateIST: string;
  dayOfWeek: string;
  time: string;
  durationMinutes: number;
  teacherName: string;
  cleanedProduct: string;
  cleanedCategory: string;
  cleanedClass: string;
  hostId: string;
  month: string;
  year: number;
  classNo: number;
  isNew: string;
}

export const useCheckinsData = () => {
  const [data, setData] = useState<CheckinData[]>([]);
  const [loading, setLoading] = useState(true);
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

  const parseBoolean = (value: string | boolean): boolean => {
    if (typeof value === 'boolean') return value;
    return value?.toString().toUpperCase() === 'TRUE';
  };

  const fetchCheckinsData = async () => {
    try {
      console.log('Fetching checkins data from Google Sheets...');
      setLoading(true);
      const accessToken = await getAccessToken();
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Checkins?alt=json`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch checkins data: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const rows: any[] = result.values || [];
      if (rows.length < 2) {
        setData([]);
        setError(null);
        return;
      }

      const checkinsData: CheckinData[] = rows.slice(1).map((row: any[]) => ({
        memberId: row[0]?.toString() || '',
        firstName: row[1] || '',
        lastName: row[2] || '',
        email: row[3] || '',
        orderAt: row[4] || '',
        paid: parseNumericValue(row[5]),
        paymentMethodName: row[6] || '',
        checkedIn: parseBoolean(row[7]),
        complementary: parseBoolean(row[8]),
        isLateCancelled: parseBoolean(row[9]),
        sessionId: row[10]?.toString() || '',
        sessionName: row[11] || '',
        capacity: parseNumericValue(row[12]),
        location: row[13] || '',
        dateIST: row[14] || '',
        dayOfWeek: row[15] || '',
        time: row[16] || '',
        durationMinutes: parseNumericValue(row[17]),
        teacherName: row[18] || '',
        cleanedProduct: row[19] || '',
        cleanedCategory: row[20] || '',
        cleanedClass: row[21] || '',
        hostId: row[22]?.toString() || '',
        month: row[23] || '',
        year: parseNumericValue(row[24]),
        classNo: parseNumericValue(row[25]),
        isNew: row[26] || ''
      }));

      setData(checkinsData);
      setError(null);
    } catch (err) {
      console.error('Error fetching checkins data:', err);
      setError('Failed to load checkins data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckinsData();
  }, []);

  return { data, loading, error, refetch: fetchCheckinsData };
};
