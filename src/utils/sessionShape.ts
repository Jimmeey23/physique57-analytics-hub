import type { SessionData as HookSessionData } from '@/hooks/useSessionsData';
import type { SessionData as LegacySessionData } from '@/types';

/**
 * Boundary adapter between the two live session shapes.
 *
 * - `HookSessionData` (@/hooks/useSessionsData) is what the data hooks return
 *   (sessionName, dayOfWeek, trainerName, checkedInCount, bookedCount …).
 * - `LegacySessionData` (@/types) is what the MainDashboard-cluster components
 *   (DataTableEnhanced, MetricsCardsEnhanced, utils/calculations) consume
 *   (className, day, instructor, checkins, bookings …).
 *
 * Previously the hook rows were passed straight through, so every legacy field
 * read (`session.className`, `s.checkins`, …) silently evaluated to undefined
 * and metrics computed to 0. Normalize once at the component boundary instead.
 * The original hook fields are preserved via spread so mixed readers
 * (`session.revenue || session.totalPaid`) keep working.
 */
export function adaptHookSession(s: HookSessionData): LegacySessionData {
  return {
    ...s,
    id: s.sessionId,
    className: s.sessionName || s.cleanedClass || 'Unknown',
    day: s.dayOfWeek,
    instructor: s.trainerName,
    bookings: s.bookedCount,
    checkins: s.checkedInCount,
    revenue: s.totalPaid,
    lateCancelled: s.lateCancelledCount,
    status: 'Active',
  };
}

export function adaptHookSessions(rows: HookSessionData[]): LegacySessionData[] {
  return rows.map(adaptHookSession);
}
