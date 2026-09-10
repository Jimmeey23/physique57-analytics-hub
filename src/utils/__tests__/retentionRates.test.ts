import { describe, expect, it } from 'vitest';
import { conversionRate, pct, retentionRate } from '../retentionRates';

describe('pct', () => {
  it('computes percentages rounded to 1 decimal by default', () => {
    expect(pct(1, 3)).toBe(33.3);
    expect(pct(2, 3)).toBe(66.7);
    expect(pct(1, 2)).toBe(50);
  });
  it('returns 0 for zero, negative, or non-finite denominators', () => {
    expect(pct(5, 0)).toBe(0);
    expect(pct(5, -2)).toBe(0);
    expect(pct(Number.NaN, 10)).toBe(0);
    expect(pct(5, Number.NaN)).toBe(0);
  });
  it('honours the decimals argument', () => {
    expect(pct(1, 3, 0)).toBe(33);
    expect(pct(1, 3, 2)).toBe(33.33);
  });
});

describe('canonical cohort rates', () => {
  it('conversion = converted / newClients', () => {
    expect(conversionRate(25, 100)).toBe(25);
    expect(conversionRate(0, 100)).toBe(0);
    expect(conversionRate(10, 0)).toBe(0);
  });
  it('retention = retained / newClients', () => {
    expect(retentionRate(40, 200)).toBe(20);
    expect(retentionRate(0, 0)).toBe(0);
  });
});
