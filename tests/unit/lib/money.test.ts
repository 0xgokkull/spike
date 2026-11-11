import { describe, it, expect } from 'vitest';
import { toCents, fromCents, formatMoney } from '@/lib/money';
import { AppError } from '@/lib/errors';

describe('money utilities', () => {
  it('converts string dollars to cents correctly', () => {
    expect(toCents('10.00')).toBe(1000);
    expect(toCents('0.50')).toBe(50);
    expect(toCents('0.05')).toBe(5);
    expect(toCents('123.45')).toBe(12345);
    expect(toCents('50')).toBe(5000);
  });

  it('converts numeric dollars to cents correctly', () => {
    expect(toCents(10)).toBe(1000);
    expect(toCents(10.5)).toBe(1050);
    expect(toCents(0.01)).toBe(1);
  });

  it('throws AppError for invalid money format', () => {
    expect(() => toCents('-5.00')).toThrow(AppError);
    expect(() => toCents('abc')).toThrow(AppError);
    expect(() => toCents('10.999')).toThrow(AppError);
  });

  it('converts integer cents to decimal string', () => {
    expect(fromCents(1000)).toBe('10.00');
    expect(fromCents(50)).toBe('0.50');
    expect(fromCents(5)).toBe('0.05');
    expect(fromCents(0)).toBe('0.00');
  });

  it('formats cents as USD string', () => {
    expect(formatMoney(1000)).toBe('$10.00');
    expect(formatMoney(4550)).toBe('$45.50');
    expect(formatMoney(0)).toBe('$0.00');
  });
});

