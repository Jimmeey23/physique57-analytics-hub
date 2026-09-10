import { useState, useEffect } from 'react';
import { fetchGoogleSheet, parseNumericValue, SPREADSHEET_IDS } from '@/utils/googleAuth';
import { createLogger } from '@/utils/logger';
import { useDataSource } from '@/contexts/DataSourceContext';
import { loadDatasetRowsForMode } from '@/lib/offlineDatasetLoader';

const logger = createLogger('useBookingsData');

export interface BookingData {
  memberId: string;
  saleDate: string;
  customerName: string;
  customerEmail: string;
  saleValue: number;
  saleItem: string;
  saleId: string;
  sessionDate: string;
  paymentMethod: string;
  membershipUsed: string;
  stripeToken: string;
  refunded: boolean;
  vat: number;
  locationName: string;
  soldBy: string;
  cancelled: boolean;
  lateCancelled: boolean;
  noShow: boolean;
  trainerId: string;
  teacherName: string;
  cleanedClass: string;
  attended: boolean;
  classNo: number;
  isNew: string;
  dayOfWeek: string;
  timeSlot: string;
  hostId: string;
  uniqueId1: string;
  uniqueId2: string;
}

const isTrue = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  const s = String(value ?? '').trim().toLowerCase();
  return s === 'true' || s === 'yes' || s === '1' || s === 'y';
};

/**
 * Per-booking rows from the Bookings spreadsheet.
 * Columns: Member Id(0) Sale Date(1) Customer Name(2) Customer Email(3) Sale Value(4)
 * Sale Item(5) Sale Id(6) Session Date(7) Payment Method(8) Membership Used(9)
 * Stripe Token(10) Refunded(11) Vat(12) Location Name(13) Sold By(14) Cancelled(15)
 * Late Cancelled(16) No Show(17) Trainer Id(18) Teacher Name(19) Cleaned Class(20)
 * Attended(21) Class No(22) Is New(23) Day Of Week(24) Time Slot(25) Host Id(26)
 * UniqueID1(27) UniqueID2(28)
 */
export const useBookingsData = () => {
  const [data, setData] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { mode } = useDataSource();

  const fetchBookingsData = async () => {
    try {
      setLoading(true);
      setError(null);
      logger.info('Fetching bookings data...');

      const { rows } = await loadDatasetRowsForMode('bookings', mode, async () => {
        return fetchGoogleSheet(SPREADSHEET_IDS.BOOKINGS, 'Bookings', {
          valueRenderOption: 'FORMATTED_VALUE',
        });
      });

      if (rows.length < 2) {
        setData([]);
        return;
      }

      const bookingsData: BookingData[] = rows.slice(1)
        .filter((row: any[]) => row && row.some((cell) => String(cell ?? '').trim() !== ''))
        .map((row: any[]) => ({
          memberId: String(row[0] ?? ''),
          saleDate: String(row[1] ?? ''),
          customerName: String(row[2] ?? ''),
          customerEmail: String(row[3] ?? ''),
          saleValue: parseNumericValue(row[4]),
          saleItem: String(row[5] ?? ''),
          saleId: String(row[6] ?? ''),
          sessionDate: String(row[7] ?? ''),
          paymentMethod: String(row[8] ?? ''),
          membershipUsed: String(row[9] ?? ''),
          stripeToken: String(row[10] ?? ''),
          refunded: isTrue(row[11]),
          vat: parseNumericValue(row[12]),
          locationName: String(row[13] ?? ''),
          soldBy: String(row[14] ?? ''),
          cancelled: isTrue(row[15]),
          lateCancelled: isTrue(row[16]),
          noShow: isTrue(row[17]),
          trainerId: String(row[18] ?? ''),
          teacherName: String(row[19] ?? ''),
          cleanedClass: String(row[20] ?? ''),
          attended: isTrue(row[21]),
          classNo: parseNumericValue(row[22]),
          isNew: String(row[23] ?? ''),
          dayOfWeek: String(row[24] ?? ''),
          timeSlot: String(row[25] ?? ''),
          hostId: String(row[26] ?? ''),
          uniqueId1: String(row[27] ?? ''),
          uniqueId2: String(row[28] ?? ''),
        }));

      logger.info(`Bookings loaded: ${bookingsData.length} records`);
      setData(bookingsData);
      setError(null);
    } catch (err) {
      logger.error('Error fetching bookings data:', err);
      setError('Failed to load bookings data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookingsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  return { data, loading, error, refetch: fetchBookingsData };
};
