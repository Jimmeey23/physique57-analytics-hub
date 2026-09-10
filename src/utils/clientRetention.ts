import { NewClientData } from '@/types/dashboard';

type RetentionLikeRecord = Pick<NewClientData, 'isNew' | 'conversionStatus' | 'retentionStatus'>;

export const isInNewClientCohort = (record: Pick<RetentionLikeRecord, 'isNew'> | string | null | undefined) => {
  const value = typeof record === 'string' || record == null ? record : record.isNew;
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized || normalized === 'not new' || normalized.startsWith('not new')) {
    return false;
  }
  return normalized === 'new' || normalized.startsWith('new ');
};

// Source of truth: the New sheet's status columns (no isNew gate).
// A row counts as converted/retained purely from its status column value.
const normalizedStatus = (value: unknown) => String(value || '').trim();

export const isConvertedInCohort = (record: RetentionLikeRecord) => {
  return normalizedStatus(record.conversionStatus) === 'Converted';
};

export const isRetainedInCohort = (record: RetentionLikeRecord) => {
  return normalizedStatus(record.retentionStatus) === 'Retained';
};
