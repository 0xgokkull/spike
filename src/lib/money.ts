import { AppError } from './errors';

export const CURRENCY = 'USD' as const;

/**
 * Converts a decimal dollar string or number to integer cents.
 * e.g., "10.00" -> 1000, 10.5 -> 1050
 */
export function toCents(amount: string | number): number {
  if (typeof amount === 'number') {
    if (!Number.isFinite(amount) || amount < 0) {
      throw new AppError('VALIDATION', `Invalid money amount: ${amount}`);
    }
    return Math.round(amount * 100);
  }

  const str = amount.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(str)) {
    throw new AppError('VALIDATION', `Invalid money string format: "${amount}"`);
  }

  const [dollars, centsPart = ''] = str.split('.');
  const cents = (centsPart + '00').slice(0, 2);
  return parseInt(dollars, 10) * 100 + parseInt(cents, 10);
}

/**
 * Converts integer cents to PayPal string decimal representation ("10.00").
 */
export function fromCents(cents: number): string {
  if (!Number.isInteger(cents) || cents < 0) {
    throw new AppError('VALIDATION', `Invalid cents value: ${cents}`);
  }
  const dollars = Math.floor(cents / 100);
  const remainder = cents % 100;
  return `${dollars}.${remainder.toString().padStart(2, '0')}`;
}

/**
 * Formats integer cents into user-facing USD display format ("$10.00").
 */
export function formatMoney(cents: number): string {
  return `$${fromCents(cents)}`;
}

