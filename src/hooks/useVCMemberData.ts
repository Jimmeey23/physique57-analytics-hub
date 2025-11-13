import { useState, useEffect } from 'react';
import { MemberBehaviorData, MonthlyMetrics } from '@/types/memberBehavior';

const GOOGLE_CONFIG = {
  CLIENT_ID: "YOUR_CLIENT_ID_2.apps.googleusercontent.com",
  CLIENT_SECRET: "GOCSPX-REDACTED_SECRET_2",
  REFRESH_TOKEN: "REDACTED_REFRESH_TOKEN_2",
  TOKEN_URL: "https://oauth2.googleapis.com/token"
};

const SPREADSHEET_ID = '16wFlke0bHFcmfn-3UyuYlGnImBq0DY7ouVYAlAFTZys';
const VC_SHEET_NAME = 'VC';

// In-memory cache for access token
let cachedToken: { token: string; expiry: number } | null = null;

const getAccessToken = async (): Promise<string> => {
  // Return cached token if still valid
  if (cachedToken && Date.now() < cachedToken.expiry) {
    return cachedToken.token;
  }

  const response = await fetch(GOOGLE_CONFIG.TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: GOOGLE_CONFIG.CLIENT_ID,
      client_secret: GOOGLE_CONFIG.CLIENT_SECRET,
      refresh_token: GOOGLE_CONFIG.REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to get access token');
  }

  const tokenData = await response.json();
  
  // Cache token for 50 minutes (tokens expire in 1 hour)
  cachedToken = {
    token: tokenData.access_token,
    expiry: Date.now() + (50 * 60 * 1000)
  };
  
  return tokenData.access_token;
};

interface UseVCMemberDataResult {
  data: MemberBehaviorData[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useVCMemberData = (): UseVCMemberDataResult => {
  const [data, setData] = useState<MemberBehaviorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const parseMonthlyMetrics = (row: any[], headers: string[]): Record<string, MonthlyMetrics> => {
    const monthlyData: Record<string, MonthlyMetrics> = {};
    
    // Find all unique month-year combinations
    const monthPattern = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4} - /;
    const months = new Set<string>();
    
    headers.forEach(header => {
      const match = header.match(monthPattern);
      if (match) {
        const monthYear = header.split(' - ')[0];
        months.add(monthYear);
      }
    });

    // For each month, extract the metrics
    months.forEach(monthYear => {
      const bookedIdx = headers.findIndex(h => h === `${monthYear} - Booked`);
      const visitsIdx = headers.findIndex(h => h === `${monthYear} - Visits`);
      const cancellationsIdx = headers.findIndex(h => h === `${monthYear} - Cancellations`);
      const paidIdx = headers.findIndex(h => h === `${monthYear} - Paid Amount`);
      const unpaidIdx = headers.findIndex(h => h === `${monthYear} - Unpaid Amount`);

      if (bookedIdx !== -1) {
        monthlyData[monthYear] = {
          booked: parseFloat(row[bookedIdx]?.toString() || '0') || 0,
          visits: parseFloat(row[visitsIdx]?.toString() || '0') || 0,
          cancellations: parseFloat(row[cancellationsIdx]?.toString() || '0') || 0,
          paidAmount: parseFloat(row[paidIdx]?.toString() || '0') || 0,
          unpaidAmount: parseFloat(row[unpaidIdx]?.toString() || '0') || 0,
        };
      }
    });

    return monthlyData;
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Fetching VC member data from Google Sheets...');
      const accessToken = await getAccessToken();
      
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${VC_SHEET_NAME}?alt=json`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch VC data: ${response.statusText}`);
      }

      const result = await response.json();
      const rows = result.values || [];

      if (rows.length < 2) {
        throw new Error('VC sheet appears to be empty');
      }

      const headers = rows[0];
      const memberData: MemberBehaviorData[] = [];

      // Process each row (skip header)
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 5 || !row[0]) continue; // Skip empty rows

        const memberId = row[0]?.toString() || '';
        const firstName = row[1]?.toString() || '';
        const lastName = row[2]?.toString() || '';
        const email = row[3]?.toString() || '';
        const phone = row[4]?.toString() || '';

        const monthlyData = parseMonthlyMetrics(row, headers);

        memberData.push({
          memberId,
          firstName,
          lastName,
          email,
          phone,
          monthlyData,
        });
      }

      console.log(`✅ Loaded ${memberData.length} members from VC sheet`);
      setData(memberData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error fetching VC data';
      console.error('❌ Error fetching VC member data:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
};
