
import { useState, useEffect } from 'react';
import { NewClientData } from '@/types/dashboard';
import { parseDate } from '@/utils/dateUtils';
import { fetchGoogleSheet, SPREADSHEET_IDS } from '@/utils/googleAuth';
import { createLogger } from '@/utils/logger';

const logger = createLogger('useNewClientData');

export const useNewClientData = () => {
  const [data, setData] = useState<NewClientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

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
    return Math.max(0, diffDays);
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
      logger.info('Fetching new client data...');
      
      const rows = await fetchGoogleSheet(SPREADSHEET_IDS.PAYROLL, 'New', {
        valueRenderOption: 'FORMATTED_VALUE'
      });

      if (rows.length < 2) {
        setData([]);
        return;
      }

      const newClientData: NewClientData[] = rows.slice(1).map((row: any[]) => {
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

      logger.info(`New client data loaded: ${newClientData.length} records`);
      
      setData(newClientData);
      setError(null);
      setIsInitialized(true);
    } catch (err) {
      logger.error('Error fetching new client data:', err);
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
