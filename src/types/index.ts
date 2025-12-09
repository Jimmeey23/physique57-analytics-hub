export interface SessionData {
  id: string;
  className: string;
  date: string; // ISO
  capacity?: number;
  bookings?: number;
  checkins?: number;
  revenue?: number;
  instructor?: string;
  [key: string]: any;
}

export interface CalculatedMetrics {
  fillRate: number;
  cancellationRate: number;
  classAvg: number;
  revPerCheckin: number;
  revPerBooking: number;
  compositeScore?: number;
}

export type RankingMetric = 'fillRate' | 'classAvg' | 'revPerCheckin' | 'revPerBooking' | 'compositeScore';
