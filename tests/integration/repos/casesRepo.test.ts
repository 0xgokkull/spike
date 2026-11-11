import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from '../../helpers/db';
import { casesRepo } from '@/db/repos/cases';
import { ordersRepo } from '@/db/repos/orders';
import { eventsRepo } from '@/db/repos/events';
import { AppError } from '@/lib/errors';
import type { DbClient } from '@/db/client';

describe('casesRepo and state transitions', () => {
  let db: DbClient;

  beforeEach(async () => {
    const res = await createTestDb();
    db = res.db as unknown as DbClient;
  });

  it('creates order, case, and transitions state through valid lifecycle', async () => {
    const order = await ordersRepo.create(db, {
      item: 'Vintage Mechanical Watch',
      amount_cents: 12000,
      tracking_status: 'delivered',
    });

    const c = await casesRepo.create(db, {
      source: 'dispute',
      order_id: order.id,
      reason: 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED',
      buyer_message: 'Where is my order?',
      amount_cents: 12000,
      status: 'new',
    });

    expect(c.status).toBe('new');

    // Transition new -> triaged
    const triaged = await casesRepo.transition(db, c.id, ['new'], 'triaged', 'system');
    expect(triaged.status).toBe('triaged');

    // Transition triaged -> action_ready
    const ready = await casesRepo.transition(db, c.id, ['triaged'], 'action_ready', 'agent');
    expect(ready.status).toBe('action_ready');

    // Transition action_ready -> awaiting_approval
    const awaiting = await casesRepo.transition(
      db,
      c.id,
      ['action_ready'],
      'awaiting_approval',
      'system'
    );
    expect(awaiting.status).toBe('awaiting_approval');

    // Check events table has recorded the transitions
    const evts = await eventsRepo.listForCase(db, c.id);
    expect(evts).toHaveLength(3);
    expect(evts[0].type).toBe('case.transitioned');
  });

  it('prevents illegal transitions and throws CONFLICT_STATE', async () => {
    const order = await ordersRepo.create(db, {
      item: 'Wireless Headphones',
      amount_cents: 4500,
    });

    const c = await casesRepo.create(db, {
      source: 'refund_request',
      order_id: order.id,
      reason: 'OTHER',
      buyer_message: 'Please refund',
      amount_cents: 4500,
      status: 'new',
    });

    // Try new -> executed (illegal directly)
    await expect(
      casesRepo.transition(db, c.id, ['new'], 'executed', 'seller')
    ).rejects.toThrow(AppError);

    // Try transitioning with wrong current state in 'from'
    await expect(
      casesRepo.transition(db, c.id, ['triaged'], 'action_ready', 'agent')
    ).rejects.toThrow(AppError);
  });
});
