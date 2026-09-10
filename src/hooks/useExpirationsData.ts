import { useState, useEffect } from 'react';
import { ExpirationData } from '@/types/dashboard';
import { fetchGoogleSheet, SPREADSHEET_IDS } from '@/utils/googleAuth';
import { createLogger } from '@/utils/logger';
import { useDataSource } from '@/contexts/DataSourceContext';
import { loadDatasetRowsForMode } from '@/lib/offlineDatasetLoader';

const logger = createLogger('useExpirationsData');
const SHEET_NAME = "Lapsed";

export const useExpirationsData = () => {
  const [data, setData] = useState<ExpirationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [excludedCount, setExcludedCount] = useState(0);
  const { mode, reportSource } = useDataSource();

  const fetchExpirationsData = async () => {
    try {
      setLoading(true);
      setError(null);

      logger.info('Fetching expirations data...');

      const { rows } = await loadDatasetRowsForMode('expirations', mode, async () => {
        return fetchGoogleSheet(SPREADSHEET_IDS.EXPIRATIONS, SHEET_NAME, {
          valueRenderOption: 'FORMATTED_VALUE'
        });
      }, reportSource);

      logger.info(`Total rows received: ${rows.length}`);

      if (rows.length < 2) {
        logger.warn('No data found in the sheet');
        setData([]);
        return;
      }

      // Detect format by checking if first row looks like a header
      const firstRow: string[] = rows[0];
      const hasHeader = typeof firstRow[0] === 'string' && isNaN(Number(firstRow[0]));
      const dataRows = hasHeader ? rows.slice(1) : rows;

      // Column positions for the live 39-col "Lapsed" tab:
      // 0: Member Name, 1: Member ID, 2: Member Email, 3: Member Phone, 4: Host ID,
      // 5: Status, 6: Membership Name, 7: Sessions Limit, 8: Purchase Date, 9: Start Date,
      // 10: End Date, 11: Churned Date, 12: Amount Paid, 13: Discount Code, 14: Discount Value,
      // 15: Original Amount (Before Discount), 16: Sold By, 17: Created By,
      // 18: Most Recent Visit Date, 19: First Visit Date, 20: Total Sessions,
      // 21: Completed Sessions, 22: Used %, 23: Remaining Sessions, 24: Total Cancellations,
      // 25: Late Cancellations, 26: No Shows, 27: Cancellation Rate %,
      // 28: Preferred Booking Method, 29: Primary Location, 30: Locations Attended,
      // 31: Membership Freeze Count, 32: Days Frozen, 33: Membership Duration (Days),
      // 34: Days Active, 35: Days Since Last Visit, 36: Average Sessions Per Month,
      // 37: Revenue Per Session, 38: Attendance Rate %
      const processedData: ExpirationData[] = dataRows.map((row: string[]) => {
        const g = (i: number): string => (row[i] != null ? String(row[i]) : '');
        const n = (i: number): number => {
          const cleaned = g(i).replace(/[^0-9.-]/g, '');
          const parsed = parseFloat(cleaned);
          return isNaN(parsed) ? 0 : parsed;
        };

        const memberName = g(0).trim();
        const firstSpace = memberName.indexOf(' ');
        const primaryLocation = g(29);
        const freezeCount = n(31);
        const daysFrozen = n(32);

        return {
          uniqueId:       `${g(1)}_${g(6)}_${g(10)}`,
          memberId:       g(1),
          firstName:      firstSpace > 0 ? memberName.slice(0, firstSpace) : memberName,
          lastName:       firstSpace > 0 ? memberName.slice(firstSpace + 1) : '',
          email:          g(2),
          memberPhone:    g(3),
          hostId:         g(4),
          status:         g(5) || 'Lapsed',
          membershipName: g(6),
          sessionsLimit:  g(7),
          purchaseDate:   g(8),
          startDate:      g(9),
          endDate:        g(10),
          churnedDate:    g(11),
          amountPaid:     n(12),
          discountCode:   g(13),
          discountValue:  n(14),
          originalAmount: n(15),
          soldBy:         g(16) || '-',
          createdBy:      g(17),
          mostRecentVisitDate: g(18),
          firstVisitDate: g(19),
          totalSessionsCompleted: n(21),
          sessionsUsedPct: n(22),
          remainingSessions: n(23),
          totalCancellations: n(24),
          lateCancellations: n(25),
          noShows: n(26),
          cancellationRate: n(27),
          preferredBookingMethod: g(28),
          primaryLocation,
          locationsAttended: g(30),
          membershipFreezeCount: freezeCount,
          daysFrozen,
          membershipDurationDays: n(33),
          daysActive: n(34),
          daysSinceLastVisit: n(35),
          avgSessionsPerMonth: n(36),
          revenuePerSession: n(37),
          attendanceRate: n(38),
          // Legacy fields kept for backward compat
          homeLocation: primaryLocation,
          currentUsage: g(22) ? `${g(22)}` : '-',
          id: g(1),
          orderAt: g(8),
          membershipId: g(1) || '-',
          frozen: freezeCount > 0 || daysFrozen > 0,
          paid: g(12) || '-',
        };
      });

      // Lapsed calculations exclude single-class and zero-value memberships.
      // NOTE: deliberately narrow — must NOT match names like "Single Location".
      const isSingleClassMembership = (name: string): boolean =>
        /single[\s-]*class|single[\s-]*session|\b1[\s-]*class\b|one[\s-]*class|drop[\s-]*in|trial[\s-]*class/i.test(name || '');
      const qualifiedData = processedData.filter(
        item => !isSingleClassMembership(item.membershipName) && (item.amountPaid || 0) > 0
      );
      const excluded = processedData.length - qualifiedData.length;

      logger.info(`Processed ${processedData.length} lapsed rows; ${qualifiedData.length} qualify (excluded ${excluded} single-class / zero-value)`);
      setExcludedCount(excluded);
      setData(qualifiedData);
    } catch (error) {
      logger.error('Error fetching expirations data:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpirationsData();
  }, [mode]);

  return {
    data,
    loading,
    error,
    refetch: fetchExpirationsData,
    /** Rows dropped from calculations (single-class / zero-value memberships). */
    excludedCount,
  };
};
