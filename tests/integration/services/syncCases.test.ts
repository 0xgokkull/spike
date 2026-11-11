import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from '../../helpers/db';
import { syncCases } from '@/services/syncCases';
import { FakePayPal } from '@/integrations/paypal/fake';
import { casesRepo } from '@/db/repos/cases';
import type { DbClient } from '@/db/client';

describe('syncCases service', () => {
  let db: DbClient;
  let fakePayPal: FakePayPal;

  beforeEach(async () => {
    const res = await createTestDb();
    db = res.db as unknown as DbClient;
    fakePayPal = new FakePayPal();
  });

  it('pulls disputes from PayPal, creates case and order records with events', async () => {
    const result = await syncCases(db, fakePayPal);
    expect(result.synced).toBeGreaterThan(0);
    expect(result.created).toBeGreaterThan(0);

    const allCases = await casesRepo.list(db);
    expect(allCases.length).toBe(result.created);

    const first = allCases[0];
    expect(first.source).toBe('dispute');
    expect(first.status).toBe('new');
    expect(first.available_actions).toContain('contest');
    expect(first.simulated).toBe(true);

    // Second sync should update, not create duplicates
    const secondSync = await syncCases(db, fakePayPal);
    expect(secondSync.created).toBe(0);
    expect(secondSync.updated).toBe(result.synced);

    const casesAfterSecond = await casesRepo.list(db);
    expect(casesAfterSecond.length).toBe(allCases.length);
  });
});
