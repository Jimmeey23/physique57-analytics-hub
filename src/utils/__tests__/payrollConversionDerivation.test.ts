import { describe, expect, it } from 'vitest';
import { deriveTrainerConversions, payrollNeedsDerivedConversions } from '../payrollConversionDerivation';
import type { NewClientData, PayrollData } from '@/types/dashboard';

const payrollRow = (overrides: Partial<PayrollData> = {}): PayrollData => ({
  teacherName: 'Anisha Shah',
  location: 'Kwality House, Kemps Corner',
  monthYear: 'Feb-2024',
  converted: 0,
  retained: 0,
  new: 0,
  conversionRate: 0,
  retentionRate: 0,
  ...overrides,
} as PayrollData);

const client = (overrides: Partial<NewClientData> = {}): NewClientData => ({
  trainerName: 'Anisha Shah',
  monthYear: 'February-2024',
  firstVisitLocation: 'Kwality House, Kemps Corner',
  isNew: 'New',
  conversionStatus: 'Converted',
  retentionStatus: 'Retained',
  ...overrides,
} as NewClientData);

describe('payrollConversionDerivation', () => {
  it('only derives when every payroll row has empty conversion columns', () => {
    expect(payrollNeedsDerivedConversions([payrollRow()])).toBe(true);
    expect(payrollNeedsDerivedConversions([payrollRow({ converted: 3 })])).toBe(false);
    expect(payrollNeedsDerivedConversions([])).toBe(false);
  });

  it('counts new, converted and retained clients per trainer, month and location', () => {
    const result = deriveTrainerConversions(
      [payrollRow()],
      [
        client(),
        client({ conversionStatus: 'Not Converted', retentionStatus: 'Retained' }),
        client({ conversionStatus: 'Not Converted', retentionStatus: 'Not Retained' }),
      ],
    );

    expect(result[0].new).toBe(3);
    expect(result[0].converted).toBe(1);
    expect(result[0].retained).toBe(2);
    expect(result[0].conversionRate).toBeCloseTo(33.333, 2);
    expect(result[0].retentionRate).toBeCloseTo(66.667, 2);
  });

  it('falls back to trainer + month when the client location is blank', () => {
    const result = deriveTrainerConversions([payrollRow()], [client({ firstVisitLocation: '', homeLocation: '' })]);
    expect(result[0].new).toBe(1);
    expect(result[0].converted).toBe(1);
  });

  it('leaves payroll untouched when the source already has conversion data', () => {
    const rows = [payrollRow({ converted: 5, new: 10 })];
    expect(deriveTrainerConversions(rows, [client()])).toBe(rows);
  });

  it('leaves rows without a client match untouched', () => {
    const rows = [payrollRow({ teacherName: 'Unknown Trainer' })];
    const result = deriveTrainerConversions(rows, [client()]);
    expect(result[0].converted).toBe(0);
  });
});
