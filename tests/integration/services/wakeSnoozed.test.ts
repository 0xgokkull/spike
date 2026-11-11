import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from '../../helpers/db';
import { wakeSnoozed } from '@/services/wakeSnoozed';
import { casesRepo } from '@/db/repos/cases';
import { ordersRepo } from '@/db/repos/orders';
import { clock } from '@/lib/clock';
import type { DbClient } from '@/db/client';

describe('wakeSnoozed service', () => {
  let db: DbClient;

  beforeEach(async () => {
    const res = await createTestDb();
    db = res.db as unknown as DbClient;
    clock.setOffsetDays(0);
  });

  it('wakes snoozed cases whose date has arrived', async () => {
    const order = await ordersRepo.create(db, {
      item: 'Keyboard',
      amount_cents: 8500,
    });

    const c1 = await casesRepo.create(db, {
      source: 'refund_request',
      order_id: order.id,
      reason: 'OTHER',
      buyer_message: 'Please review next week',
      amount_cents: 8500,
      status: 'awaiting_approval',
    });

    // Snooze until today
    const today = clock.todayIso();
    await casesRepo.transition(db, c1.id, ['awaiting_approval'], 'snoozed', 'seller', {
      snoozed_until: today,
    });

    // Another case snoozed until tomorrow
    const c2 = await casesRepo.create(db, {
      source: 'refund_request',
      order_id: order.id,
      reason: 'OTHER',
      buyer_message: 'Another request',
      amount_cents: 2000,
      status: 'awaiting_approval',
    });

    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    await casesRepo.transition(db, c2.id, ['awaiting_approval'], 'snoozed', 'seller', {
      snoozed_until: tomorrow,
    });

    const res = await wakeSnoozed(db);
    expect(res.woken).toBe(1);
    expect(res.caseIds).toContain(c1.id);

    const updated1 = await casesRepo.findById(db, c1.id);
    expect(updated1?.status).toBe('action_ready');

    const updated2 = await casesRepo.findById(db, c2.id);
    expect(updated2?.status).toBe('snoozed');
  });
});
