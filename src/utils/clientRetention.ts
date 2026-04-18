import { NewClientData } from '@/types/dashboard';

type RetentionLikeRecord = Pick<NewClientData, 'isNew' | 'conversionStatus' | 'retentionStatus'>;

export const isInNewClientCohort = (record: Pick<RetentionLikeRecord, 'isNew'> | string | null | undefined) => {
  const value = typeof record === 'string' || record == null ? record : record.isNew;
  return String(value || '').toLowerCase().includes('new');
};

export const isConvertedInCohort = (record: RetentionLikeRecord) => {
  return isInNewClientCohort(record) && record.conversionStatus === 'Converted';
};

export const isRetainedInCohort = (record: RetentionLikeRecord) => {
  return isInNewClientCohort(record) && record.retentionStatus === 'Retained';
};