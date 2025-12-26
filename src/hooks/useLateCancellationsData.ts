import { useState, useEffect } from 'react';
import { LateCancellationsData } from '@/types/dashboard';
import { fetchGoogleSheet, parseNumericValue } from '@/utils/googleAuth';
import { createLogger } from '@/utils/logger';

const logger = createLogger('useLateCancellationsData');

const SPREADSHEET_ID = import.meta.env.VITE_GOOGLE_PAYROLL_SPREADSHEET_ID;

export const useLateCancellationsData = () => {
  const [data, setData] = useState<LateCancellationsData[]>([]);
  // New: retain all raw checkins (unfiltered) for additional analytics
  const [allCheckins, setAllCheckins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLateCancellationsData = async () => {
    if (!SPREADSHEET_ID) {
      logger.error('No spreadsheet ID configured for late cancellations (VITE_GOOGLE_PAYROLL_SPREADSHEET_ID)');
      setError('Data source not configured');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      logger.info('Fetching late cancellations data from Google Sheets...');
      
      const rows = await fetchGoogleSheet(SPREADSHEET_ID, 'Checkins');
      
      logger.info('Late cancellations fetch result:', {
        status: 'success',
        rowsReceived: rows.length,
        sheetId: SPREADSHEET_ID
      });
      
      if (rows.length < 2) {
        logger.warn('No data rows found in Checkins sheet');
        setData([]);
        setAllCheckins([]);
        return;
      }

  // Process the Checkins data: build both raw checkins and late cancellations subsets
  const processedData: LateCancellationsData[] = [];
  const rawCheckins: any[] = [];
      
      const headers = rows[0];
      
      // Log headers for debugging
      logger.info('Checkins sheet headers:', headers);
      
      // Find column indices by name (case-insensitive search)
      const findIndex = (name: string) => headers.findIndex((h: string) => h?.toLowerCase() === name.toLowerCase());
      
      const memberIdIndex = findIndex('Member ID');
      const firstNameIndex = findIndex('First Name');
      const lastNameIndex = findIndex('Last Name');
      const emailIndex = findIndex('Email');
      const locationIndex = findIndex('Location');
      const sessionNameIndex = findIndex('Session Name');
      const teacherNameIndex = findIndex('Teacher Name');
      const cleanedProductIndex = findIndex('Cleaned Product');
      const cleanedCategoryIndex = findIndex('Cleaned Category');
      const cleanedClassIndex = findIndex('Cleaned Class');
      const paymentMethodIndex = findIndex('Payment Method Name');
      const dateIndex = findIndex('Date (IST)');
      const dayOfWeekIndex = findIndex('Day of Week');
      const timeIndex = findIndex('Time');
      const durationIndex = findIndex('Duration (Minutes)');
      const capacityIndex = findIndex('Capacity');
      const monthIndex = findIndex('Month');
      const yearIndex = findIndex('Year');
      const paidIndex = findIndex('Paid');
      const isNewIndex = findIndex('Is New');
      const isLateCancelledIndex = findIndex('Is Late Cancelled');
      
      if (isLateCancelledIndex === -1) {
        logger.error('Is Late Cancelled column not found in headers:', headers);
        setData([]);
        setAllCheckins([]);
        return;
      }

      logger.info('Column indices found:', {
        memberIdIndex, firstNameIndex, lastNameIndex, emailIndex, locationIndex,
        sessionNameIndex, teacherNameIndex, cleanedProductIndex, cleanedCategoryIndex,
        cleanedClassIndex, paymentMethodIndex, dateIndex, dayOfWeekIndex, timeIndex,
        durationIndex, capacityIndex, monthIndex, yearIndex, paidIndex, isNewIndex,
        isLateCancelledIndex
      });

      // Process data rows (skip header)
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        
        // Skip empty rows
        if (!row || row.length === 0) continue;
        
        // Build raw checkin row (unfiltered)
        const rawRow = {
          memberId: memberIdIndex >= 0 ? row[memberIdIndex] : '',
          firstName: firstNameIndex >= 0 ? row[firstNameIndex] : '',
          lastName: lastNameIndex >= 0 ? row[lastNameIndex] : '',
          email: emailIndex >= 0 ? row[emailIndex] : '',
          location: locationIndex >= 0 ? row[locationIndex] : '',
          sessionName: sessionNameIndex >= 0 ? row[sessionNameIndex] : '',
          teacherName: teacherNameIndex >= 0 ? row[teacherNameIndex] : '',
          cleanedProduct: cleanedProductIndex >= 0 ? row[cleanedProductIndex] : '',
          cleanedCategory: cleanedCategoryIndex >= 0 ? row[cleanedCategoryIndex] : '',
          cleanedClass: cleanedClassIndex >= 0 ? row[cleanedClassIndex] : '',
          paymentMethodName: paymentMethodIndex >= 0 ? row[paymentMethodIndex] : '',
          dateIST: dateIndex >= 0 ? row[dateIndex] : '',
          dayOfWeek: dayOfWeekIndex >= 0 ? row[dayOfWeekIndex] : '',
          time: timeIndex >= 0 ? row[timeIndex] : '',
          duration: durationIndex >= 0 ? parseNumericValue(row[durationIndex]) : 0,
          capacity: capacityIndex >= 0 ? parseNumericValue(row[capacityIndex]) : 0,
          month: monthIndex >= 0 ? row[monthIndex] : '',
          year: yearIndex >= 0 ? parseNumericValue(row[yearIndex]) : 0,
          paidAmount: paidIndex >= 0 ? parseNumericValue(row[paidIndex]) : 0,
          isNew: isNewIndex >= 0 ? row[isNewIndex] : '',
          isLateCancelled: isLateCancelledIndex >= 0 ? row[isLateCancelledIndex] : 'FALSE',
        };
        rawCheckins.push(rawRow);
        
        // Only include rows where Is Late Cancelled = TRUE (case-insensitive, trimmed)
        const isLateCancelled = isLateCancelledIndex >= 0 ? String(row[isLateCancelledIndex]).trim().toUpperCase() : '';
        
        // Log first 10 rows for debugging
        if (i <= 10) {
          logger.info(`Row ${i} - Is Late Cancelled value: "${row[isLateCancelledIndex]}" (normalized: "${isLateCancelled}")`);
        }
        
        if (isLateCancelled !== 'TRUE') continue;
        
        const dataRow: LateCancellationsData = {
          memberId: memberIdIndex >= 0 ? row[memberIdIndex] : '',
          firstName: firstNameIndex >= 0 ? row[firstNameIndex] : '',
          lastName: lastNameIndex >= 0 ? row[lastNameIndex] : '',
          email: emailIndex >= 0 ? row[emailIndex] : '',
          location: locationIndex >= 0 ? row[locationIndex] : '',
          sessionName: sessionNameIndex >= 0 ? row[sessionNameIndex] : '',
          teacherName: teacherNameIndex >= 0 ? row[teacherNameIndex] : '',
          cleanedProduct: cleanedProductIndex >= 0 ? row[cleanedProductIndex] : '',
          cleanedCategory: cleanedCategoryIndex >= 0 ? row[cleanedCategoryIndex] : '',
          cleanedClass: cleanedClassIndex >= 0 ? row[cleanedClassIndex] : '',
          paymentMethodName: paymentMethodIndex >= 0 ? row[paymentMethodIndex] : '',
          dateIST: dateIndex >= 0 ? row[dateIndex] : '',
          dayOfWeek: dayOfWeekIndex >= 0 ? row[dayOfWeekIndex] : '',
          time: timeIndex >= 0 ? row[timeIndex] : '',
          duration: durationIndex >= 0 ? parseNumericValue(row[durationIndex]) : 0,
          capacity: capacityIndex >= 0 ? parseNumericValue(row[capacityIndex]) : 0,
          month: monthIndex >= 0 ? row[monthIndex] : '',
          year: yearIndex >= 0 ? parseNumericValue(row[yearIndex]) : 0,
          paidAmount: paidIndex >= 0 ? parseNumericValue(row[paidIndex]) : 0,
          isNew: isNewIndex >= 0 ? row[isNewIndex] : '',
          tableType: 'checkins'
        };
        
        processedData.push(dataRow);
      }

      // Collect sample values from Is Late Cancelled column for debugging
      const lateCancelledSamples = [];
      for (let i = 1; i < Math.min(20, rows.length); i++) {
        lateCancelledSamples.push({
          row: i,
          value: rows[i][isLateCancelledIndex],
          normalized: String(rows[i][isLateCancelledIndex]).trim().toUpperCase()
        });
      }
      
      logger.info('Processed late cancellations data:', {
        totalRecords: processedData.length,
        totalRawCheckins: rawCheckins.length,
        isLateCancelledColumnIndex: isLateCancelledIndex,
        lateCancelledValueSamples: lateCancelledSamples,
        sample: processedData.slice(0, 3)
      });
      
      setData(processedData);
      setAllCheckins(rawCheckins);
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logger.error('Error fetching late cancellations data:', {
        error: errorMsg,
        spreadsheetId: SPREADSHEET_ID,
        sheetName: 'Checkins',
        errorType: err instanceof Error ? err.constructor.name : typeof err
      });
      setError(`Failed to load late cancellations data: ${errorMsg}`);
      setData([]);
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
