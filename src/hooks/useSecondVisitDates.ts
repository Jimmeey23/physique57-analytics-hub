import { useMemo } from 'react';
import { useCheckinsData } from '@/hooks/useCheckinsData';
import { parseDate } from '@/utils/dateUtils';

const normalizeId = (value: unknown) => String(value ?? '').trim().toLowerCase();

/**
 * Second-visit date per member, derived from the check-ins sheet.
 *
 * The new-client sheet carries only a post-trial visit count, so "did the
 * client come back inside the first calendar month" has to come from check-ins:
 * the earliest attended check-in strictly after the member's first visit.
 * Keyed by member id and, as a fallback, by lowercased email.
 */
export const useSecondVisitDates = () => {
  const { data: checkins, loading, error } = useCheckinsData();

  const lookup = useMemo(() => {
    const visitsByMember = new Map<string, number[]>();
    const visitsByEmail = new Map<string, number[]>();

    checkins.forEach((checkin) => {
      if (!checkin.checkedIn || checkin.isLateCancelled) return;
      const date = parseDate(checkin.dateIST || '');
      if (!date) return;
      const time = date.getTime();

      const memberId = normalizeId(checkin.memberId);
      if (memberId) {
        const list = visitsByMember.get(memberId);
        if (list) list.push(time);
        else visitsByMember.set(memberId, [time]);
      }

      const email = normalizeId(checkin.email);
      if (email) {
        const list = visitsByEmail.get(email);
        if (list) list.push(time);
        else visitsByEmail.set(email, [time]);
      }
    });

    visitsByMember.forEach((list) => list.sort((a, b) => a - b));
    visitsByEmail.forEach((list) => list.sort((a, b) => a - b));

    return { visitsByMember, visitsByEmail };
  }, [checkins]);

  /** Local `YYYY-MM-DD` of the first visit strictly after `firstVisitDate`. */
  const getSecondVisitDate = useMemo(() => {
    return (client: { memberId?: string; email?: string; firstVisitDate?: string }): string | null => {
      const first = parseDate(client.firstVisitDate || '');
      if (!first) return null;

      const visits =
        lookup.visitsByMember.get(normalizeId(client.memberId)) ??
        lookup.visitsByEmail.get(normalizeId(client.email));
      if (!visits || visits.length === 0) return null;

      // Same-day repeats are still the trial day, so the cutoff is end of day.
      const cutoff = new Date(first.getFullYear(), first.getMonth(), first.getDate(), 23, 59, 59, 999).getTime();
      const next = visits.find((time) => time > cutoff);
      if (!next) return null;
      const date = new Date(next);
      // Local parts, not ISO: toISOString() shifts the day in IST.
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };
  }, [lookup]);

  return { getSecondVisitDate, loading, error, hasCheckins: checkins.length > 0 };
};

export default useSecondVisitDates;
