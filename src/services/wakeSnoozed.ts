import type { DbClient } from '@/db/client';
import { casesRepo } from '@/db/repos/cases';
import { clock } from '@/lib/clock';
import { cases } from '@/db/schema';
import { eq, and, lte } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export async function wakeSnoozed(db: DbClient): Promise<{ woken: number; caseIds: string[] }> {
  const today = clock.todayIso();

  const snoozedCases = await db
    .select()
    .from(cases)
    .where(and(eq(cases.status, 'snoozed'), lte(cases.snoozed_until, today)));

  const wokenIds: string[] = [];

  for (const c of snoozedCases) {
    logger.info(`Waking snoozed case ${c.id} (snoozed_until: ${c.snoozed_until})`);
    await casesRepo.transition(db, c.id, ['snoozed'], 'action_ready', 'system', {
      reason: 'snooze_expired',
      today,
    });
    wokenIds.push(c.id);
  }

  return {
    woken: wokenIds.length,
    caseIds: wokenIds,
  };
}

