import { getDb } from '../src/db/client';
import { policiesRepo } from '../src/db/repos/policies';
import { ordersRepo } from '../src/db/repos/orders';
import { casesRepo } from '../src/db/repos/cases';
import { syncCases } from '../src/services/syncCases';
import { createPayPal } from '../src/integrations/paypal';
import { logger } from '../src/lib/logger';
import type { PolicyRules } from '../src/domain/types';

async function seed() {
  logger.info('Starting database seeding...');
  const db = getDb();

  // 1. Seed Store Policy
  const existingPolicy = await policiesRepo.getActive(db);
  if (!existingPolicy) {
    const rules: PolicyRules = {
      version: 1,
      autoRefundCapCents: 2500, // $25.00
      autoRefundReasons: ['MERCHANDISE_OR_SERVICE_NOT_RECEIVED', 'OTHER'],
      refundWindowDays: 30,
      clauses: [
        {
          id: 'P-1',
          text: 'Refund automatically up to $25 when tracking shows the parcel never arrived or was lost in transit.',
        },
        {
          id: 'P-2',
          text: 'Refund requests exceeding $25 require merchant approval before any funds are disbursed.',
        },
        {
          id: 'P-3',
          text: 'Disputes claiming non-receipt where tracking confirms delivery must be contested with proof of delivery.',
        },
        {
          id: 'P-4',
          text: 'Returns requested within 30 days of delivery are eligible for partial or full refund upon inspection.',
        },
        {
          id: 'P-5',
          text: 'Claims submitted after 30 days from delivery are ineligible for refund.',
        },
      ],
    };

    await policiesRepo.create(db, {
      version: 1,
      text: 'Standard Merchant Return & Dispute Policy (2026)',
      rules,
      active: true,
    });
    logger.info('Seeded active store policy (version 1)');
  }

  // 2. Seed Demo Orders
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

  const orderWatch = await ordersRepo.create(db, {
    item: 'Vintage Mechanical Watch',
    amount_cents: 12000,
    currency: 'USD',
    paypal_order_id: 'ORD-WATCH-001',
    paypal_capture_id: 'CAP-SIMULATED-120USD',
    carrier: 'FEDEX',
    tracking_number: '987654321098',
    tracking_status: 'delivered',
    shipped_at: fiveDaysAgo,
    delivered_at: threeDaysAgo,
  });

  const orderEarbuds = await ordersRepo.create(db, {
    item: 'Wireless Noise-Canceling Earbuds',
    amount_cents: 2000, // $20.00 (under $25 cap)
    currency: 'USD',
    paypal_order_id: 'ORD-EARBUDS-002',
    paypal_capture_id: 'CAP-SIMULATED-20USD',
    carrier: 'USPS',
    tracking_number: '9400111899562537',
    tracking_status: 'in_transit', // not delivered
    shipped_at: fiveDaysAgo,
  });

  const orderKeyboard = await ordersRepo.create(db, {
    item: 'Custom Mechanical Keyboard',
    amount_cents: 8500, // $85.00 (above $25 cap)
    currency: 'USD',
    paypal_order_id: 'ORD-KEYBOARD-003',
    paypal_capture_id: 'CAP-SIMULATED-85USD',
    carrier: 'UPS',
    tracking_number: '1Z9999999999999999',
    tracking_status: 'delivered',
    shipped_at: fiveDaysAgo,
    delivered_at: threeDaysAgo,
  });

  logger.info('Seeded orders (Watch, Earbuds, Keyboard)');

  // 3. Seed Refund Request Cases
  await casesRepo.create(db, {
    source: 'refund_request',
    order_id: orderEarbuds.id,
    reason: 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED',
    buyer_message: 'Hi, tracking has been stuck for 5 days and I never received my earbuds. Can you please refund my $20?',
    amount_cents: 2000,
    status: 'new',
    available_actions: ['refund', 'reply'],
    simulated: true,
  });

  await casesRepo.create(db, {
    source: 'refund_request',
    order_id: orderKeyboard.id,
    reason: 'MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED',
    buyer_message: 'The keyboard arrived with two sticky keys. I would like a refund or partial discount.',
    amount_cents: 8500,
    status: 'new',
    available_actions: ['refund', 'reply'],
    simulated: true,
  });

  logger.info('Seeded refund requests (Earbuds auto candidate, Keyboard approval candidate)');

  // 4. Sync disputes from PayPal (real sandbox or fake)
  const paypal = createPayPal();
  const syncResult = await syncCases(db, paypal);
  logger.info('Synced PayPal disputes into cases', syncResult);

  logger.info('Seeding finished successfully!');
  process.exit(0);
}

seed().catch((err) => {
  logger.error('Seeding failed', { error: err.message, stack: err.stack });
  process.exit(1);
});
