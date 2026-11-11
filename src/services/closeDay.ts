import type { DbClient } from '@/db/client';
import { casesRepo } from '@/db/repos/cases';
import { actionsRepo } from '@/db/repos/actions';
import { dayClosesRepo } from '@/db/repos/dayCloses';
import { clock } from '@/lib/clock';
import { isActionable } from '@/domain/states';
import { AppError } from '@/lib/errors';
import { cases } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function getDayCloseStatus(db: DbClient) {
  const allCases = await casesRepo.list(db);
  const today = clock.todayIso();

  const blockers = allCases.filter((c) => isActionable(c.status, c.snoozed_until, today));
  const unacknowledged = await actionsRepo.listUnacknowledgedAuto(db);

  return {
    canClose: blockers.length === 0 && unacknowledged.length === 0,
    blockers: blockers.map((b) => ({
      id: b.id,
      reason: b.reason,
      status: b.status,
      amountCents: b.amount_cents,
    })),
    unacknowledged: unacknowledged.map((u) => ({
      id: u.id,
      caseId: u.case_id,
      type: u.type,
      amountCents: (u.input as any)?.amountCents,
      createdAt: u.created_at.toISOString(),
    })),
  };
}

export async function closeDay(db: DbClient, acknowledgedActionIds: string[] = []) {
  const status = await getDayCloseStatus(db);
  const today = clock.todayIso();

  if (status.blockers.length > 0) {
    throw new AppError('DAY_CLOSE_BLOCKED', 'Cannot close day: actionable cases remain in queue', {
      blockers: status.blockers,
    });
  }

  // Acknowledge unacknowledged auto actions
  const ackSet = new Set(acknowledgedActionIds);
  for (const unack of status.unacknowledged) {
    if (!ackSet.has(unack.id)) {
      throw new AppError(
        'DAY_CLOSE_BLOCKED',
        'Cannot close day: all automatic actions must be acknowledged',
        { unacknowledged: status.unacknowledged }
      );
    }
  }

  for (const ackId of acknowledgedActionIds) {
    await actionsRepo.update(db, ackId, {
      acknowledged_at: new Date(),
    });
  }

  // Transition all resolved cases to closed
  const allCases = await casesRepo.list(db);
  for (const c of allCases) {
    if (c.status === 'resolved') {
      await casesRepo.transition(db, c.id, ['resolved'], 'closed', 'seller');
    }
  }

  // Create day close summary
  const summary = {
    day: today,
    closedAt: new Date().toISOString(),
    acknowledgedActionsCount: acknowledgedActionIds.length,
    totalCasesCount: allCases.length,
  };

  const dayClose = await dayClosesRepo.create(db, today, summary);

  return {
    ok: true,
    dayClose,
  };
}

