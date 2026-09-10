import { describe, expect, it } from 'vitest';
import { formatCurrency, formatNumber } from '../formatters';

describe('formatNumber', () => {
  it('formats with en-IN grouping', () => {
    expect(formatNumber(1234567)).toBe('12,34,567');
  });
  it('returns 0 for nullish/NaN', () => {
    expect(formatNumber(null)).toBe('0');
    expect(formatNumber(undefined)).toBe('0');
    expect(formatNumber(Number.NaN)).toBe('0');
  });
  it('honours the decimals argument', () => {
    expect(formatNumber(12.345, 1)).toBe('12.3');
    expect(formatNumber(12.345, 2)).toBe('12.35');
    expect(formatNumber(12, 1)).toBe('12.0');
  });
});

describe('formatCurrency', () => {
  it('prefixes the rupee symbol', () => {
    expect(formatCurrency(1500)).toBe('₹1.5K');
  });
});
