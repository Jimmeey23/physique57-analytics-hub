export type OfflineDatasetKey =
  | 'sales'
  | 'sessions'
  | 'payroll'
  | 'new-clients'
  | 'leads'
  | 'checkins'
  | 'expirations'
  | 'bookings'
  | 'late-cancellations'
  | 'vc-members';

/** Where the rows currently displayed came from (per dataset, this session). */
export type DatasetLiveSource = 'remote' | 'offline-cache';

export type DataSourceMode = 'online' | 'offline';

export interface OfflineDatasetRecord {
  key: OfflineDatasetKey;
  rows: any[][];
  updatedAt: string;
  source: 'remote' | 'upload' | 'bundle';
  fileName?: string;
}

export interface OfflineDatasetSummary {
  key: OfflineDatasetKey;
  label: string;
  available: boolean;
  rowCount: number;
  updatedAt?: string;
  source?: 'remote' | 'upload' | 'bundle';
  fileName?: string;
}

export const OFFLINE_DATASET_LABELS: Record<OfflineDatasetKey, string> = {
  sales: 'Sales',
  sessions: 'Sessions',
  payroll: 'Payroll',
  'new-clients': 'New Clients',
  leads: 'Leads',
  checkins: 'Checkins',
  expirations: 'Expirations',
  bookings: 'Bookings',
  'late-cancellations': 'Late Cancellations',
  'vc-members': 'VC Members',
};

export const OFFLINE_DATASET_KEYS: OfflineDatasetKey[] = [
  'sales',
  'sessions',
  'payroll',
  'new-clients',
  'leads',
  'checkins',
  'expirations',
  'bookings',
  'late-cancellations',
  'vc-members',
];

export const BUNDLED_OFFLINE_DATASET_FILES: Partial<Record<OfflineDatasetKey, string>> = {
  sales: 'Sales-Data.csv',
  sessions: 'Sessions-Data.csv',
  payroll: 'Payroll.csv',
  'new-clients': 'New.csv',
  leads: 'Leads-Data.csv',
  checkins: 'Checkins-Data.csv',
  expirations: 'Expirations.csv',
};
