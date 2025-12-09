export type SessionData = {
  id?: string;
  className?: string;
  trainerName?: string;
  day?: string;
  time?: string;
  location?: string;
  checkedInCount?: number;
  capacity?: number;
  totalPaid?: number;
  startTime?: string;
};

export type CalculatedMetrics = {
  totalCheckIns: number;
  totalCapacity: number;
  totalRevenue: number;
  sessionCount: number;
  avgCheckIns: number;
  fillRate: number;
  consistency: number;
};

export type RankingMetric = 'avgCheckIns' | 'fillRate' | 'totalRevenue' | 'consistency' | 'sessionCount';
