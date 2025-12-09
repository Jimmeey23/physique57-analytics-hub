import type { SessionData, CalculatedMetrics } from '../types';

export const formatNumber = (n: number, digits = 0) => {
  if (!isFinite(n)) return '—';
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
};

export const formatPercentage = (n: number, digits = 0) => {
  if (!isFinite(n)) return '—';
  return `${(n * 100).toFixed(digits)}%`;
};

export const formatCurrency = (n: number) => {
  if (!isFinite(n)) return '—';
  return `$${n.toFixed(2)}`;
};

export function calculateMetrics(session: SessionData): CalculatedMetrics {
  const capacity = Number(session.capacity) || 0;
  const bookings = Number(session.bookings) || 0;
  const checkins = Number(session.checkins) || 0;
  const revenue = Number(session.revenue) || 0;

  const fillRate = capacity > 0 ? checkins / capacity : bookings > 0 ? checkins / bookings : 0;
  const cancellationRate = bookings > 0 ? (bookings - checkins) / bookings : 0;
  const classAvg = checkins || bookings ? checkins || bookings : 0;
  const revPerCheckin = checkins > 0 ? revenue / checkins : 0;
  const revPerBooking = bookings > 0 ? revenue / bookings : 0;

  const compositeScore = (fillRate * 0.5) + (revPerCheckin * 0.3) + (classAvg * 0.2);

  return {
    fillRate,
    cancellationRate,
    classAvg,
    revPerCheckin,
    revPerBooking,
    compositeScore,
  };
}

export function calculateTotalsRow(sessions: SessionData[]) {
  const totals = sessions.reduce(
    (acc, s) => {
      acc.capacity += Number(s.capacity) || 0;
      acc.bookings += Number(s.bookings) || 0;
      acc.checkins += Number(s.checkins) || 0;
      acc.revenue += Number(s.revenue) || 0;
      return acc;
    },
    { capacity: 0, bookings: 0, checkins: 0, revenue: 0 }
  );

  const fillRate = totals.capacity > 0 ? totals.checkins / totals.capacity : totals.bookings > 0 ? totals.checkins / totals.bookings : 0;

  return {
    ...totals,
    fillRate,
  };
}
