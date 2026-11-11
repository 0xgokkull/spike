import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from '../../helpers/db';
import { executeAction } from '@/services/executeAction';
import { FakePayPal } from '@/integrations/paypal/fake';
import { casesRepo } from '@/db/repos/cases';
import { ordersRepo } from '@/db/repos/orders';
import { eventsRepo } from '@/db/repos/events';
import type { DbClient } from '@/db/client';

describe('executeAction service and executors', () => {
  let db: DbClient;
  let fakePayPal: FakePayPal;

  beforeEach(async () => {
    const res = await createTestDb();
    db = res.db as unknown as DbClient;
    fakePayPal = new FakePayPal();
  });

  it('executes refund action, updates DB, records events, and transitions to resolved', async () => {
    const order = await ordersRepo.create(db, {
      item: 'Earbuds',
      amount_cents: 2000,
      paypal_capture_id: 'CAP-EARBUDS-1',
    });

    const c = await casesRepo.create(db, {
      source: 'refund_request',
      order_id: order.id,
      reason: 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED',
      buyer_message: 'Never got item',
      amount_cents: 2000,
      status: 'awaiting_approval',
    });

    const res = await executeAction(db, fakePayPal, {
      caseId: c.id,
      type: 'refund',
      actor: 'seller',
      input: { amountCents: 2000 },
    });

    expect(res.ok).toBe(true);
    expect(res.idempotent).toBe(false);

    const updatedCase = await casesRepo.findById(db, c.id);
    expect(updatedCase?.status).toBe('resolved');
    expect(updatedCase?.outcome).toBe('refunded');

    const evts = await eventsRepo.listForCase(db, c.id);
    expect(evts.some((e) => e.type === 'action.succeeded')).toBe(true);
  });

  it('guarantees idempotency on repeated calls', async () => {
    const order = await ordersRepo.create(db, {
      item: 'Earbuds',
      amount_cents: 2000,
      paypal_capture_id: 'CAP-EARBUDS-1',
    });

    const c = await casesRepo.create(db, {
      source: 'refund_request',
      order_id: order.id,
      reason: 'OTHER',
      buyer_message: 'Please refund',
      amount_cents: 2000,
      status: 'awaiting_approval',
    });

    const first = await executeAction(db, fakePayPal, {
      caseId: c.id,
      type: 'refund',
      actor: 'seller',
      input: { amountCents: 2000 },
    });
    expect(first.idempotent).toBe(false);

    // Call again with exact same input
    const second = await executeAction(db, fakePayPal, {
      caseId: c.id,
      type: 'refund',
      actor: 'seller',
      input: { amountCents: 2000 },
    });
    expect(second.idempotent).toBe(true);
    expect(second.action.id).toBe(first.action.id);
  });

  it('executes contest on dispute and transitions to waiting_on_paypal', async () => {
    const order = await ordersRepo.create(db, {
      item: 'Watch',
      amount_cents: 12000,
      carrier: 'FEDEX',
      tracking_number: '987654321098',
      tracking_status: 'delivered',
      delivered_at: new Date(),
    });

    const c = await casesRepo.create(db, {
      source: 'dispute',
      paypal_dispute_id: 'PP-D-SIMULATED-9871',
      order_id: order.id,
      reason: 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED',
      buyer_message: 'Not received',
      amount_cents: 12000,
      status: 'awaiting_approval',
    });

    const res = await executeAction(db, fakePayPal, {
      caseId: c.id,
      type: 'contest',
      actor: 'seller',
      input: { narrative: 'Item delivered by FedEx' },
    });

    expect(res.ok).toBe(true);

    const updatedCase = await casesRepo.findById(db, c.id);
    expect(updatedCase?.status).toBe('waiting_on_paypal');
  });
});

