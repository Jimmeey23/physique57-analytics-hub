import { NewClientData, PayrollData } from '@/types/dashboard';

/**
 * The Payroll sheet ships Converted / Retained / New as all-zero columns, so
 * trainer conversion and retention render as 0% everywhere. The new-client
 * dataset does carry per-client statuses, so when the payroll columns are
 * empty we rebuild those counts by trainer + month (+ location when it is
 * recorded) instead of showing zeros.
 */

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

const normalizeMonthKey = (value?: string | null) => {
  const raw = String(value ?? '').trim().toLowerCase();
  if (!raw) return '';

  // "feb-2024", "february 2024", "2024-02"
  const isoMatch = raw.match(/^(\d{4})-(\d{1,2})/);
  if (isoMatch) return `${isoMatch[1]}-${String(Number(isoMatch[2])).padStart(2, '0')}`;

  const nameMatch = raw.match(/([a-z]{3,})[^a-z0-9]*(\d{4})/);
  if (nameMatch) {
    const month = MONTHS.indexOf(nameMatch[1].slice(0, 3));
    if (month >= 0) return `${nameMatch[2]}-${String(month + 1).padStart(2, '0')}`;
  }

  return raw;
};

const normalizeText = (value?: string | null) => String(value ?? '').trim().toLowerCase();

interface Counts {
  newMembers: number;
  converted: number;
  retained: number;
}

const emptyCounts = (): Counts => ({ newMembers: 0, converted: 0, retained: 0 });

const addTo = (map: Map<string, Counts>, key: string, client: NewClientData) => {
  if (!key) return;
  const entry = map.get(key) ?? emptyCounts();
  if (normalizeText(client.isNew).includes('new')) entry.newMembers += 1;
  if (normalizeText(client.conversionStatus) === 'converted') entry.converted += 1;
  if (normalizeText(client.retentionStatus) === 'retained') entry.retained += 1;
  map.set(key, entry);
};

export const payrollNeedsDerivedConversions = (payroll: PayrollData[]) =>
  payroll.length > 0 &&
  payroll.every((row) => !row.converted && !row.retained && !row.new);

export const deriveTrainerConversions = (
  payroll: PayrollData[],
  newClients: NewClientData[],
): PayrollData[] => {
  if (newClients.length === 0 || !payrollNeedsDerivedConversions(payroll)) return payroll;

  const byTrainerMonthLocation = new Map<string, Counts>();
  const byTrainerMonth = new Map<string, Counts>();

  newClients.forEach((client) => {
    const trainer = normalizeText(client.trainerName);
    if (!trainer) return;
    const month = normalizeMonthKey(client.monthYear || client.firstVisitDate);
    if (!month) return;
    const location = normalizeText(client.firstVisitLocation || client.homeLocation);

    addTo(byTrainerMonth, `${trainer}|${month}`, client);
    if (location) addTo(byTrainerMonthLocation, `${trainer}|${month}|${location}`, client);
  });

  return payroll.map((row) => {
    const trainer = normalizeText(row.teacherName);
    const month = normalizeMonthKey(row.monthYear);
    const location = normalizeText(row.location);

    const counts =
      byTrainerMonthLocation.get(`${trainer}|${month}|${location}`) ??
      byTrainerMonth.get(`${trainer}|${month}`);

    if (!counts) return row;

    const conversionRate = counts.newMembers > 0 ? (counts.converted / counts.newMembers) * 100 : 0;
    const retentionRate = counts.newMembers > 0 ? (counts.retained / counts.newMembers) * 100 : 0;

    return {
      ...row,
      new: counts.newMembers,
      converted: counts.converted,
      retained: counts.retained,
      conversionRate,
      retentionRate,
      conversion: `${conversionRate.toFixed(1)}%`,
      retention: `${retentionRate.toFixed(1)}%`,
    };
  });
};
