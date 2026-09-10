/**
 * Stable React list keys.
 *
 * `rowKey` prefers a natural identity field on the row object and falls back
 * to the render index only when the row carries no usable id. Table rows
 * keyed by bare index corrupt selection/expansion state whenever the list is
 * sorted, filtered, or paginated — always prefer this helper (or an explicit
 * id) over `key={index}` in dynamic lists.
 */
const ID_FIELDS = [
  'id',
  'key',
  'memberId',
  'email',
  'sessionId',
  'transactionId',
  'name',
  'label',
  'month',
  'category',
] as const;

export const rowKey = (row: unknown, index: number): string | number => {
  if (row && typeof row === 'object') {
    const record = row as Record<string, unknown>;
    for (const field of ID_FIELDS) {
      const value = record[field];
      if (typeof value === 'string' && value.length > 0) return value;
      if (typeof value === 'number' && Number.isFinite(value)) return value;
    }
  }
  return index;
};
