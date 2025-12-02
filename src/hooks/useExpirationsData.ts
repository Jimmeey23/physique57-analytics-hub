import { useState, useEffect } from 'react';
import { ExpirationData } from '@/types/dashboard';
import { fetchGoogleSheet, SPREADSHEET_IDS } from '@/utils/googleAuth';
import { createLogger } from '@/utils/logger';

const logger = createLogger('useExpirationsData');
const SHEET_NAME = "Expirations";

export const useExpirationsData = () => {
  const [data, setData] = useState<ExpirationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpirationsData = async () => {
    try {
      setLoading(true);
      setError(null);

      logger.info('Fetching expirations data...');
      
      const rows = await fetchGoogleSheet(SPREADSHEET_IDS.EXPIRATIONS, `${SHEET_NAME}!A:Z`, {
        valueRenderOption: 'FORMATTED_VALUE'
      });
      
      logger.info(`Total rows received: ${rows.length}`);
      
      if (rows.length === 0) {
        logger.warn('No data found in the sheet');
        setData([]);
        return;
      }

      const dataRows = rows.slice(1);

      const processedData: ExpirationData[] = dataRows.map((row: string[]) => ({
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

      logger.info(`Processed ${processedData.length} expirations`);

      setData(processedData);
    } catch (error) {
      logger.error('Error fetching expirations data:', error);
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
