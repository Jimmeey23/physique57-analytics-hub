import { useState, useEffect } from 'react';
import { LateCancellationsData } from '@/types/dashboard';
import { fetchGoogleSheet, parseNumericValue } from '@/utils/googleAuth';
import { createLogger } from '@/utils/logger';

const logger = createLogger('useLateCancellationsData');

const SPREADSHEET_ID = import.meta.env.VITE_GOOGLE_PAYROLL_SPREADSHEET_ID || "149ILDqovzZA6FRUJKOwzutWdVqmqWBtWPfzG3A0zxTI";

export const useLateCancellationsData = () => {
  const [data, setData] = useState<LateCancellationsData[]>([]);
  // New: retain all raw checkins (unfiltered) for additional analytics
  const [allCheckins, setAllCheckins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLateCancellationsData = async () => {
    try {
      setLoading(true);
      setError(null);
      logger.info('Fetching late cancellations data from Google Sheets...');
      
      const rows = await fetchGoogleSheet(SPREADSHEET_ID, 'Checkins');
      
      if (rows.length < 2) {
        setData([]);
        return;
      }

  // Process the Checkins data: build both raw checkins and late cancellations subsets
  const processedData: LateCancellationsData[] = [];
  const rawCheckins: any[] = [];
      
      if (rows.length < 2) {
        setData([]);
        return;
      }

      const headers = rows[0];
  const lateCancelledIndex = headers.findIndex((h: string) => h === 'Is Late Cancelled');
  const checkedInIndex = headers.findIndex((h: string) => h === 'Checked in');
      
      if (lateCancelledIndex === -1) {
        logger.error('Is Late Cancelled column not found');
        setData([]);
        return;
      }

      // Process data rows (skip header)
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        
        // Skip empty rows
        if (!row || row.length === 0) continue;
        
        // Build raw checkin row (unfiltered)
        const rawRow = {
          memberId: row[headers.findIndex((h: string) => h === 'Member ID')] || '',
          firstName: row[headers.findIndex((h: string) => h === 'First Name')] || '',
          lastName: row[headers.findIndex((h: string) => h === 'Last Name')] || '',
          email: row[headers.findIndex((h: string) => h === 'Email')] || '',
          location: row[headers.findIndex((h: string) => h === 'Location')] || '',
          sessionName: row[headers.findIndex((h: string) => h === 'Session Name')] || '',
          teacherName: row[headers.findIndex((h: string) => h === 'Teacher Name')] || '',
          cleanedProduct: row[headers.findIndex((h: string) => h === 'Cleaned Product')] || '',
          cleanedCategory: row[headers.findIndex((h: string) => h === 'Cleaned Category')] || '',
          cleanedClass: row[headers.findIndex((h: string) => h === 'Cleaned Class')] || '',
          paymentMethodName: row[headers.findIndex((h: string) => h === 'Payment Method Name')] || '',
          dateIST: row[headers.findIndex((h: string) => h === 'Date (IST)')] || '',
          dayOfWeek: row[headers.findIndex((h: string) => h === 'Day of Week')] || '',
          time: row[headers.findIndex((h: string) => h === 'Time')] || '',
          duration: parseNumericValue(row[headers.findIndex((h: string) => h === 'Duration (Minutes)')] || '0'),
          capacity: parseNumericValue(row[headers.findIndex((h: string) => h === 'Capacity')] || '0'),
          month: row[headers.findIndex((h: string) => h === 'Month')] || '',
          year: parseNumericValue(row[headers.findIndex((h: string) => h === 'Year')] || '0'),
          paidAmount: parseNumericValue(row[headers.findIndex((h: string) => h === 'Paid')] || '0'),
          isNew: row[headers.findIndex((h: string) => h === 'Is New')] || '',
          checkedIn: checkedInIndex >= 0 ? row[checkedInIndex] : '',
          isLateCancelled: lateCancelledIndex >= 0 ? row[lateCancelledIndex] : '',
        };
        rawCheckins.push(rawRow);
        
        // Only include rows where Is Late Cancelled = TRUE
        if (row[lateCancelledIndex] !== 'TRUE') continue;
        
        const dataRow: LateCancellationsData = {
          memberId: row[headers.findIndex((h: string) => h === 'Member ID')] || '',
          firstName: row[headers.findIndex((h: string) => h === 'First Name')] || '',
          lastName: row[headers.findIndex((h: string) => h === 'Last Name')] || '',
          email: row[headers.findIndex((h: string) => h === 'Email')] || '',
          location: row[headers.findIndex((h: string) => h === 'Location')] || '',
          sessionName: row[headers.findIndex((h: string) => h === 'Session Name')] || '',
          teacherName: row[headers.findIndex((h: string) => h === 'Teacher Name')] || '',
          cleanedProduct: row[headers.findIndex((h: string) => h === 'Cleaned Product')] || '',
          cleanedCategory: row[headers.findIndex((h: string) => h === 'Cleaned Category')] || '',
          cleanedClass: row[headers.findIndex((h: string) => h === 'Cleaned Class')] || '',
          paymentMethodName: row[headers.findIndex((h: string) => h === 'Payment Method Name')] || '',
          dateIST: row[headers.findIndex((h: string) => h === 'Date (IST)')] || '',
          dayOfWeek: row[headers.findIndex((h: string) => h === 'Day of Week')] || '',
          time: row[headers.findIndex((h: string) => h === 'Time')] || '',
          duration: parseNumericValue(row[headers.findIndex((h: string) => h === 'Duration (Minutes)')] || '0'),
          capacity: parseNumericValue(row[headers.findIndex((h: string) => h === 'Capacity')] || '0'),
          month: row[headers.findIndex((h: string) => h === 'Month')] || '',
          year: parseNumericValue(row[headers.findIndex((h: string) => h === 'Year')] || '0'),
          paidAmount: parseNumericValue(row[headers.findIndex((h: string) => h === 'Paid')] || '0'),
          isNew: row[headers.findIndex((h: string) => h === 'Is New')] || '',
          tableType: 'checkins'
        };
        
        processedData.push(dataRow);
      }

      logger.info('Processed late cancellations data sample:', processedData.slice(0, 5));
      logger.info('Total late cancellations records:', processedData.length);
      logger.info('Total raw checkins rows:', rawCheckins.length);
      
      setData(processedData);
      setAllCheckins(rawCheckins);
      setError(null);
    } catch (err) {
      logger.error('Error fetching late cancellations data:', err);
      setError('Failed to load late cancellations data');
      setData([]); // Clear data on error - no mock data as per requirements
      setAllCheckins([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLateCancellationsData();
  }, []);

  return { data, allCheckins, loading, error, refetch: fetchLateCancellationsData };
};
