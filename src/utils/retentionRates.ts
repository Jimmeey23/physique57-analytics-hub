/**
 * Canonical retention-domain rate definitions (single source of truth).
 *
 * - conversion = converted / newClients * 100
 * - retention  = retained  / newClients * 100
 *
 * "newClients" = rows passing `isNewClient` (isNew starts with "new",
 * excluding "not new"). Converted/retained are status-column facts
 * (`isConverted` / `isRetained`). Zero denominators yield 0, never NaN.
 */

/** Percentage of num/den rounded to `decimals` places; 0 when den <= 0. */
export const pct = (num: number, den: number, decimals = 1): number => {
  if (!den || den <= 0 || !Number.isFinite(num) || !Number.isFinite(den)) return 0;
  const factor = 10 ** decimals;
  return Math.round((num / den) * 100 * factor) / factor;
};

/** Converted share of the new-client cohort, in percent. */
export const conversionRate = (converted: number, newClients: number, decimals = 1): number =>
  pct(converted, newClients, decimals);

/** Retained share of the new-client cohort, in percent. */
export const retentionRate = (retained: number, newClients: number, decimals = 1): number =>
  pct(retained, newClients, decimals);
