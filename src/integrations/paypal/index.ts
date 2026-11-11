import { env } from '@/lib/env';
import type { PayPalPort } from './port';
import { RealPayPal } from './real';
import { FakePayPal } from './fake';

export * from './port';
export * from './mappers';
export { RealPayPal } from './real';
export { FakePayPal } from './fake';

export function createPayPal(mode: string = env.PAYPAL_MODE): PayPalPort {
  if (mode === 'sandbox') {
    return new RealPayPal();
  }
  return new FakePayPal();
}
