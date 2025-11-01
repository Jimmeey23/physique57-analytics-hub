import { useState, useEffect } from 'react';
import { ExpirationData } from '@/types/dashboard';

const GOOGLE_CONFIG = {
  CLIENT_ID: "YOUR_CLIENT_ID_2.apps.googleusercontent.com",
  CLIENT_SECRET: "GOCSPX-REDACTED_SECRET_2",
  REFRESH_TOKEN: "REDACTED_REFRESH_TOKEN_2",
  TOKEN_URL: "https://oauth2.googleapis.com/token"
};

const SPREADSHEET_ID = import.meta.env.VITE_EXPIRATIONS_SPREADSHEET_ID;

export const useExpirationsData = () => {
  const [data, setData] = useState<ExpirationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getAccessToken = async () => {
    try {
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

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  };

  const fetchExpirationsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const accessToken = await getAccessToken();
      
      const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Sheet1!A:Z`;
      
      const response = await fetch(sheetUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const result = await response.json();
      const rows = result.values || [];
      
      if (rows.length === 0) {
        setData([]);
        return;
      }

      const headers = rows[0];
      const dataRows = rows.slice(1);

      const processedData: ExpirationData[] = dataRows.map((row: string[], index: number) => ({
        id: index + 1,
        clientName: row[0] || '',
        expirationDate: row[1] || '',
        daysUntilExpiration: parseInt(row[2] || '0'),
        packageType: row[3] || '',
        remainingSessions: parseInt(row[4] || '0'),
        membershipStatus: row[5] || '',
        lastVisit: row[6] || '',
        contactInfo: row[7] || '',
        renewalProbability: row[8] || 'Unknown',
        totalPurchaseValue: parseFloat(row[9] || '0'),
      }));

      setData(processedData);
    } catch (error) {
      console.error('Error fetching expirations data:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpirationsData();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchExpirationsData,
  };
};
