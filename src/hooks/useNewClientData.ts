
import { useState, useEffect } from 'react';
import { NewClientData } from '@/types/dashboard';
import { parseDate } from '@/utils/dateUtils';

const GOOGLE_CONFIG = {
  CLIENT_ID: "YOUR_CLIENT_ID_2.apps.googleusercontent.com",
  CLIENT_SECRET: "GOCSPX-REDACTED_SECRET_2",
  REFRESH_TOKEN: "REDACTED_REFRESH_TOKEN_2",
  TOKEN_URL: "https://oauth2.googleapis.com/token"
};

const SPREADSHEET_ID = "1kDV0j7JQZCvBAu-asBkgA_9j0L90jAQFwdhQrRh4_kw";

export const useNewClientData = () => {
  const [data, setData] = useState<NewClientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

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

      const tokenData = await response.json();
      return tokenData.access_token;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  };

  // Helper to calculate conversion span in days
  const calculateConversionSpan = (firstVisitDate: string, firstPurchaseDate: string): number => {
    if (!firstVisitDate || !firstPurchaseDate) {
      return 0;
    }
    
    const firstVisit = parseDate(firstVisitDate);
    const firstPurchase = parseDate(firstPurchaseDate);
    if (!firstVisit || !firstPurchase) return 0;
    
    const diffTime = firstPurchase.getTime() - firstVisit.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const result = Math.max(0, diffDays);
    
    console.log('Conversion span calculated:', { 
      firstVisitDate, 
      firstPurchaseDate, 
      diffDays, 
      result 
    });
    
    return result;
  };

  // Helper to format to canonical month key YYYY-MM
  const getMonthYear = (dateStr: string = ''): string => {
    const d = parseDate(dateStr);
    if (!d) return '';
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  };

  const fetchNewClientData = async () => {
    try {
      if (isInitialized) {
        setLoading(true);
      }
      console.log('Fetching new client data from Google Sheets...');
      const accessToken = await getAccessToken();
      console.log('Access token obtained for new client data');
      
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/New?alt=json`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch new client data');
      }

      const result = await response.json();
      const rows = result.values || [];
      
      if (rows.length < 2) {
        setData([]);
        return;
      }

      const newClientData: NewClientData[] = rows.slice(1).map((row: any[], idx: number) => {
        // Column mapping aligned to provided sample:
        // 0 Member Id, 1 First Name, 2 Last Name, 3 Email, 4 Phone Number,
        // 5 First Visit Date, 6 First Visit Entity Name, 7 First Visit Type, 8 First Visit Location,
        // 9 Payment Method, 10 Membership Used, 11 Home Location, 12 Class No, 13 Trainer Name,
        // 14 Is New, 15 Visits Post Trial, 16 Memberships Bought Post Trial, 17 Purchase Count Post Trial,
        // 18 Ltv, 19 Retention Status, 20 Conversion Status, 21 First Purchase Date,
        // 22 No of Visits, 23 Conversion Span (Days), 24 Month Year (if present)

        const firstVisitDate: string = row[5] || '';
        const firstPurchaseDate: string = row[21] || '';
        const sheetConversionSpan = typeof row[23] !== 'undefined' ? Number(row[23]) : undefined;
        const monthYearSheet: string = row[24] || '';
        const noOfVisits = typeof row[22] !== 'undefined' ? Number(row[22]) : undefined;

        const conversionSpan = (sheetConversionSpan && !isNaN(sheetConversionSpan))
          ? sheetConversionSpan
          : calculateConversionSpan(firstVisitDate, firstPurchaseDate);

        return {
          memberId: row[0] || '',
          firstName: row[1] || '',
          lastName: row[2] || '',
          email: row[3] || '',
          phoneNumber: row[4] || '',
          firstVisitDate,
          firstVisitEntityName: row[6] || '',
          firstVisitType: row[7] || '',
          firstVisitLocation: row[8] || '',
          paymentMethod: row[9] || '',
          membershipUsed: row[10] || '',
          homeLocation: row[11] || '',
          classNo: parseFloat(row[12]) || 0,
          trainerName: row[13] || '',
          isNew: row[14] || '',
          visitsPostTrial: parseFloat(row[15]) || 0,
          membershipsBoughtPostTrial: row[16] || '',
          purchaseCountPostTrial: parseFloat(row[17]) || 0,
          ltv: parseFloat(row[18]) || 0,
          retentionStatus: row[19] || '',
          conversionStatus: row[20] || '',
          firstPurchase: firstPurchaseDate,
          // Canonical month key from sheet if provided else derived
          monthYear: monthYearSheet || getMonthYear(firstVisitDate),
          conversionSpan,
          // Optional: bring in noOfVisits for downstream use
          noOfVisits,
        } as NewClientData & { noOfVisits?: number };
      });

      console.log('New client data loaded:', newClientData.length, 'records');
      
      // Minimal debug
      const convertedClients = newClientData.filter(c => c.conversionStatus === 'Converted' && c.conversionSpan > 0);
      console.log('New client data loaded:', newClientData.length, 'records', 'converted with span:', convertedClients.length);
      
      setData(newClientData);
      setError(null);
      setIsInitialized(true);
    } catch (err) {
      console.error('Error fetching new client data:', err);
      setError('Failed to load new client data');
      setIsInitialized(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isInitialized) {
      fetchNewClientData();
    }
  }, [isInitialized]);

  return { data, loading, error, refetch: fetchNewClientData };
};
