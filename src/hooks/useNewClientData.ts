
import { useState, useEffect } from 'react';
import { NewClientData } from '@/types/dashboard';
import { parseDate } from '@/utils/dateUtils';
import { fetchGoogleSheet, SPREADSHEET_IDS } from '@/utils/googleAuth';
import { createLogger } from '@/utils/logger';
import { useDataSource } from '@/contexts/DataSourceContext';
import { loadDatasetRowsForMode } from '@/lib/offlineDatasetLoader';

const logger = createLogger('useNewClientData');

export const useNewClientData = () => {
  const [data, setData] = useState<NewClientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { mode } = useDataSource();

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
      setLoading(true);
      logger.info('Fetching new client data...');

      const { rows } = await loadDatasetRowsForMode('new-clients', mode, async () => {
        return fetchGoogleSheet(SPREADSHEET_IDS.PAYROLL, 'New', {
          valueRenderOption: 'FORMATTED_VALUE'
        });
      });

      if (rows.length < 2) {
        setData([]);
        return;
      }

      const headers = (rows[0] || []).map((header: unknown) => String(header || '').trim());
      const headerIndexMap = new Map<string, number>();
      headers.forEach((header, index) => {
        if (header) {
          headerIndexMap.set(header, index);
        }
      });

      const getCellValue = (row: any[], ...headerNames: string[]) => {
        for (const headerName of headerNames) {
          const index = headerIndexMap.get(headerName);
          if (typeof index === 'number') {
            return row[index] ?? '';
          }
        }
        return '';
      };

      const newClientData: NewClientData[] = rows.slice(1).map((row: any[]) => {
        const firstVisitDate = String(getCellValue(row, 'First Visit Date'));
        const firstPurchasePostTrial = String(getCellValue(row, 'First Purchase Post Trial', 'First Purchase Made'));
        const firstPurchaseDate = String(getCellValue(row, 'First Purchase Date'));
        const parsedFirstPurchasePostTrial = parseDate(firstPurchasePostTrial);
        const canonicalFirstPurchaseDate = firstPurchaseDate || (parsedFirstPurchasePostTrial ? firstPurchasePostTrial : '');
        const firstPurchaseItem = parsedFirstPurchasePostTrial ? '' : firstPurchasePostTrial;
        const firstVisitLocation = String(getCellValue(row, 'First Visit Location'));
        const homeLocation = String(getCellValue(row, 'Home Location'));
        const sheetConversionSpanValue = getCellValue(row, 'Conversion Span (Days)');
        const sheetConversionSpan = sheetConversionSpanValue !== '' ? Number(sheetConversionSpanValue) : undefined;
        const monthYearSheet = String(getCellValue(row, 'Month Year'));
        const noOfVisitsValue = getCellValue(row, 'No of Visits');
        const noOfVisits = noOfVisitsValue !== '' ? Number(noOfVisitsValue) : undefined;

        const conversionSpan = (sheetConversionSpan && !isNaN(sheetConversionSpan))
          ? sheetConversionSpan
          : calculateConversionSpan(firstVisitDate, canonicalFirstPurchaseDate);

        return {
          memberId: String(getCellValue(row, 'Member Id')),
          firstName: String(getCellValue(row, 'First Name')),
          lastName: String(getCellValue(row, 'Last Name')),
          email: String(getCellValue(row, 'Email')),
          phoneNumber: String(getCellValue(row, 'Phone Number')),
          firstVisitDate,
          firstVisitEntityName: String(getCellValue(row, 'First Visit Entity Name')),
          firstVisitType: String(getCellValue(row, 'First Visit Type')),
          firstVisitLocation: firstVisitLocation || homeLocation,
          paymentMethod: String(getCellValue(row, 'Payment Method')),
          membershipUsed: String(getCellValue(row, 'Membership Used')),
          homeLocation,
          classNo: Number(getCellValue(row, 'Class No')) || 0,
          trainerName: String(getCellValue(row, 'Trainer Name')),
          isNew: String(getCellValue(row, 'Is New')),
          visitsPostTrial: Number(getCellValue(row, 'Visits Post Trial')) || 0,
          membershipsBoughtPostTrial: String(getCellValue(row, 'Memberships Bought Post Trial')),
          purchaseCountPostTrial: Number(getCellValue(row, 'Purchase Count Post Trial')) || 0,
          ltv: Number(getCellValue(row, 'Ltv', 'LTV')) || 0,
          retentionStatus: String(getCellValue(row, 'Retention Status')),
          conversionStatus: String(getCellValue(row, 'Conversion Status')),
          firstPurchase: canonicalFirstPurchaseDate,
          firstPurchaseItem,
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
    } catch (err) {
      logger.error('Error fetching new client data:', err);
      setError('Failed to load new client data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNewClientData();
  }, [mode]);

  return { data, loading, error, refetch: fetchNewClientData };
};
