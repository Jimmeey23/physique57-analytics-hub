import { NewClientData } from '@/types/dashboard';
import { parseDate } from '@/utils/dateUtils';

type RetentionLikeRecord = Pick<NewClientData, 'isNew' | 'conversionStatus' | 'retentionStatus'> &
  Partial<Pick<NewClientData, 'membershipsBoughtPostTrial' | 'firstPurchase' | 'firstVisitDate'>>;

export const isNewClient = (record: Pick<RetentionLikeRecord, 'isNew'> | string | null | undefined) => {
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

/**
 * Memberships that do not represent a real conversion. A client whose only
 * post-trial purchase is studio credit has not bought into a membership, so the
 * row is excluded from every conversion metric.
 */
export const NON_CONVERTING_MEMBERSHIPS = ['money credits'];

const normalizeMembershipToken = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, ' ');

export const splitMembershipList = (value: unknown): string[] =>
  String(value || '')
    .split(/[,;|/]+|\s-\s/)
    .map((token) => token.trim())
    .filter(Boolean);

const isNonConvertingMembership = (token: string) => {
  const normalized = normalizeMembershipToken(token);
  return NON_CONVERTING_MEMBERSHIPS.some(
    (excluded) => normalized === excluded || normalized.startsWith(`${excluded} `)
  );
};

/**
 * True when the post-trial purchase list contains at least one membership that
 * counts towards conversion. Blank lists stay eligible: the status column is
 * still the source of truth when the sheet carries no membership detail.
 */
export const hasEligibleConversionMembership = (record: RetentionLikeRecord) => {
  const memberships = splitMembershipList(record.membershipsBoughtPostTrial);
  if (memberships.length === 0) return true;
  return memberships.some((token) => !isNonConvertingMembership(token));
};

export const isConverted = (record: RetentionLikeRecord) => {
  if (normalizedStatus(record.conversionStatus) !== 'Converted') return false;
  return hasEligibleConversionMembership(record);
};

export const isRetained = (record: RetentionLikeRecord) => {
  return normalizedStatus(record.retentionStatus) === 'Retained';
};

/**
 * "Within the first calendar month" metrics. The business definition is not a
 * rolling 30-day window: the qualifying event (purchase, or second visit) must
 * land in the same calendar month as the first visit.
 */
export const isSameCalendarMonth = (a?: string | null, b?: string | null) => {
  const first = parseDate(String(a || ''));
  const second = parseDate(String(b || ''));
  if (!first || !second) return false;
  return first.getFullYear() === second.getFullYear() && first.getMonth() === second.getMonth();
};

/** Converted, with the purchase falling inside the first-visit month. */
export const isConvertedSameMonth = (record: RetentionLikeRecord) =>
  isConverted(record) && isSameCalendarMonth(record.firstVisitDate, record.firstPurchase);

/** Second visit landed inside the first-visit month. */
export const isRetainedSameMonth = (
  record: RetentionLikeRecord,
  secondVisitDate?: string | null
) => isSameCalendarMonth(record.firstVisitDate, secondVisitDate);
