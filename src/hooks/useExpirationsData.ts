import { useState, useEffect } from 'react';
import { ExpirationData } from '@/types/dashboard';

const GOOGLE_CONFIG = {
  CLIENT_ID: "YOUR_CLIENT_ID_2.apps.googleusercontent.com",
  CLIENT_SECRET: "GOCSPX-REDACTED_SECRET_2",
  REFRESH_TOKEN: "REDACTED_REFRESH_TOKEN_2",
  TOKEN_URL: "https://oauth2.googleapis.com/token"
};

const SPREADSHEET_ID = import.meta.env.VITE_EXPIRATIONS_SPREADSHEET_ID || "1rGMDDvvTbZfNg1dueWtRN3LhOgGQOdLg3Fd7Sn1GCZo";
const SHEET_NAME = "Expirations";

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

      console.log('Fetching expirations data from spreadsheet:', SPREADSHEET_ID);
      console.log('Sheet name:', SHEET_NAME);

      const accessToken = await getAccessToken();
      
      const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}!A:Z`;
      
      console.log('Fetching from URL:', sheetUrl);
      
      const response = await fetch(sheetUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('API Response:', result);
      
      const rows = result.values || [];
      
      console.log('Total rows received:', rows.length);
      
      if (rows.length === 0) {
        console.warn('No data found in the sheet');
        setData([]);
        return;
      }

      const headers = rows[0];
      console.log('Headers:', headers);
      
      const dataRows = rows.slice(1);
      console.log('Data rows count:', dataRows.length);

      const processedData: ExpirationData[] = dataRows.map((row: string[], index: number) => ({
        uniqueId: row[0] || '',
        memberId: row[1] || '',
        firstName: row[2] || '',
        lastName: row[3] || '',
        email: row[4] || '',
        membershipName: row[5] || '',
        endDate: row[6] || '',
        homeLocation: row[7] || '',
        currentUsage: row[8] || '-',
        id: row[9] || '',
        orderAt: row[10] || '',
        soldBy: row[11] || '-',
        membershipId: row[12] || '-',
        frozen: row[13]?.toUpperCase() === 'TRUE',
        paid: row[14] || '-',
        status: row[15] || '',
      }));

      console.log('Processed data count:', processedData.length);
      console.log('Sample data:', processedData.slice(0, 2));

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
