
import { useState, useEffect } from 'react';
import { NewClientData } from '@/types/dashboard';

const GOOGLE_CONFIG = {
  CLIENT_ID: "YOUR_CLIENT_ID_1.apps.googleusercontent.com",
  CLIENT_SECRET: "GOCSPX-REDACTED_SECRET_1",
  REFRESH_TOKEN: "REDACTED_REFRESH_TOKEN_1B",
  TOKEN_URL: "https://oauth2.googleapis.com/token"
};

const SPREADSHEET_ID = "149ILDqovzZA6FRUJKOwzutWdVqmqWBtWPfzG3A0zxTI";

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
      console.log('Missing dates for conversion span:', { firstVisitDate, firstPurchaseDate });
      return 0;
    }
    
    let firstVisit: Date, firstPurchase: Date;
    
    // Parse first visit date
    if (firstVisitDate.includes('/')) {
      const [day, month, year] = firstVisitDate.split(' ')[0].split('/');
      firstVisit = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else {
      firstVisit = new Date(firstVisitDate);
    }
    
    // Parse first purchase date  
    if (firstPurchaseDate.includes('/')) {
      const [day, month, year] = firstPurchaseDate.split(' ')[0].split('/');
      firstPurchase = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else {
      firstPurchase = new Date(firstPurchaseDate);
    }
    
    if (isNaN(firstVisit.getTime()) || isNaN(firstPurchase.getTime())) {
      console.log('Invalid dates for conversion span:', { 
        firstVisitDate, 
        firstPurchaseDate, 
        firstVisit: firstVisit.toString(), 
        firstPurchase: firstPurchase.toString() 
      });
      return 0;
    }
    
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

  // Helper to extract monthYear from a date string (YYYY-MM or MMM YYYY)
  const getMonthYear = (dateStr: string = ''): string => {
    if (!dateStr) return '';
    
    // Handle format: "01/01/2020, 17:30:00"
    let parsedDate: Date;
    if (dateStr.includes('/')) {
      // Split by comma and space to get date part only
      const datePart = dateStr.split(',')[0].trim();
      const [day, month, year] = datePart.split('/');
      parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else {
      parsedDate = new Date(dateStr);
    }
    
    if (isNaN(parsedDate.getTime())) return '';
    
    const year = parsedDate.getFullYear();
    const month = (parsedDate.getMonth() + 1).toString().padStart(2, '0');
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

      const newClientData: NewClientData[] = rows.slice(1).map((row: any[]) => {
        const firstVisitDate = row[5] || '';
        const firstPurchaseDate = row[23] || '';
        
        // Debug the first few rows to understand data structure
        if (rows.indexOf(row) < 5) {
          console.log('Sample row data:', {
            rowIndex: rows.indexOf(row),
            firstVisitDate: firstVisitDate,
            firstPurchaseDate: firstPurchaseDate,
            conversionStatus: row[20] || '',
            isNew: row[14] || ''
          });
        }
        
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
          period: row[21] || '',
          unique: row[22] || '',
          firstPurchase: firstPurchaseDate,
          conversionSpan: calculateConversionSpan(firstVisitDate, firstPurchaseDate),
          monthYear: getMonthYear(firstVisitDate),
        };
      });

      console.log('New client data loaded:', newClientData.length, 'records');
      
      // Debug conversion span data
      const withConversionSpan = newClientData.filter(c => c.conversionSpan > 0);
      const convertedClients = newClientData.filter(c => c.conversionStatus === 'Converted');
      const convertedWithSpan = convertedClients.filter(c => c.conversionSpan > 0);
      
      console.log('Conversion Span Debug:', {
        totalRecords: newClientData.length,
        withConversionSpan: withConversionSpan.length,
        convertedClients: convertedClients.length,
        convertedWithSpan: convertedWithSpan.length,
        avgConversionSpan: convertedWithSpan.length > 0 ? 
          convertedWithSpan.reduce((sum, c) => sum + c.conversionSpan, 0) / convertedWithSpan.length : 0,
        sampleConversionSpans: convertedWithSpan.slice(0, 5).map(c => ({
          memberId: c.memberId,
          firstVisit: c.firstVisitDate,
          firstPurchase: c.firstPurchase,
          span: c.conversionSpan
        }))
      });
      
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
