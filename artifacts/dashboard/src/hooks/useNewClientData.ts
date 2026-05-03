
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

  const getStringValue = (row: any[], headers: Map<string, number>, ...names: string[]) => {
    for (const name of names) {
      const index = headers.get(name);
      if (typeof index === 'number') {
        const value = row[index];
        if (value !== undefined && value !== null && String(value).trim() !== '') {
          return String(value).trim();
        }
      }
    }
    return '';
  };

  const getNumberValue = (row: any[], headers: Map<string, number>, ...names: string[]) => {
    const value = getStringValue(row, headers, ...names);
    if (value === '') return 0;
    const normalized = Number(String(value).replace(/[, ]+/g, '').replace('%', ''));
    return Number.isFinite(normalized) ? normalized : 0;
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

      const newClientData: NewClientData[] = rows.slice(1).map((row: any[]) => {
        const firstVisitDate = getStringValue(row, headerIndexMap, 'First Visit Date', 'First Visit');
        const firstPurchasePostTrial = getStringValue(row, headerIndexMap, 'First Purchase Post Trial', 'First Purchase Made');
        const firstPurchaseDate = getStringValue(row, headerIndexMap, 'First Purchase Date');
        const parsedFirstPurchasePostTrial = parseDate(firstPurchasePostTrial);
        const canonicalFirstPurchaseDate = firstPurchaseDate || (parsedFirstPurchasePostTrial ? firstPurchasePostTrial : '');
        const firstPurchaseItem = parsedFirstPurchasePostTrial ? '' : firstPurchasePostTrial;
        const firstVisitLocation = getStringValue(row, headerIndexMap, 'First Visit Location', 'Location');
        const homeLocation = getStringValue(row, headerIndexMap, 'Home Location', 'Home');
        const sheetConversionSpan = getNumberValue(row, headerIndexMap, 'Conversion Span (Days)', 'Conversion Span');
        const monthYearSheet = getStringValue(row, headerIndexMap, 'Month Year', 'MonthYear');
        const noOfVisits = getNumberValue(row, headerIndexMap, 'No of Visits', 'Visits');
        const isNew = getStringValue(row, headerIndexMap, 'Is New', 'New');
        const retentionStatus = getStringValue(row, headerIndexMap, 'Retention Status', 'Retained');
        const conversionStatus = getStringValue(row, headerIndexMap, 'Conversion Status', 'Converted');
        const membershipUsed = getStringValue(row, headerIndexMap, 'Membership Used', 'Membership');
        const trainerName = getStringValue(row, headerIndexMap, 'Trainer Name', 'Teacher');
        const ltv = getNumberValue(row, headerIndexMap, 'Ltv', 'LTV', 'Lifetime Value');
        const visitsPostTrial = getNumberValue(row, headerIndexMap, 'Visits Post Trial', 'Post Trial Visits');
        const purchaseCountPostTrial = getNumberValue(row, headerIndexMap, 'Purchase Count Post Trial', 'Post Trial Purchase Count');

        const conversionSpan = (sheetConversionSpan && !isNaN(sheetConversionSpan))
          ? sheetConversionSpan
          : calculateConversionSpan(firstVisitDate, canonicalFirstPurchaseDate);

        return {
          memberId: getStringValue(row, headerIndexMap, 'Member Id', 'MemberID', 'ID'),
          firstName: getStringValue(row, headerIndexMap, 'First Name', 'Name'),
          lastName: getStringValue(row, headerIndexMap, 'Last Name', 'Surname'),
          email: getStringValue(row, headerIndexMap, 'Email', 'E-mail'),
          phoneNumber: getStringValue(row, headerIndexMap, 'Phone Number', 'Phone'),
          firstVisitDate,
          firstVisitEntityName: getStringValue(row, headerIndexMap, 'First Visit Entity Name', 'Entity Name'),
          firstVisitType: getStringValue(row, headerIndexMap, 'First Visit Type', 'Visit Type'),
          firstVisitLocation: firstVisitLocation || homeLocation,
          paymentMethod: getStringValue(row, headerIndexMap, 'Payment Method', 'Payment'),
          membershipUsed,
          homeLocation,
          classNo: getNumberValue(row, headerIndexMap, 'Class No', 'Class'),
          trainerName,
          isNew,
          visitsPostTrial,
          membershipsBoughtPostTrial: getStringValue(row, headerIndexMap, 'Memberships Bought Post Trial', 'Memberships Bought'),
          purchaseCountPostTrial,
          ltv,
          retentionStatus,
          conversionStatus,
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
