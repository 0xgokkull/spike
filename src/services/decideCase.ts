import type { DbClient } from '@/db/client';
import type { PayPalPort } from '@/integrations/paypal/port';
import type { DecisionType } from '@/domain/types';
import { casesRepo } from '@/db/repos/cases';
import { recommendationsRepo } from '@/db/repos/recommendations';
import { ordersRepo } from '@/db/repos/orders';
import { policiesRepo } from '@/db/repos/policies';
import { executeAction } from './executeAction';
import { getCaseDetail } from './getCases';
import { AppError } from '@/lib/errors';
import { clock } from '@/lib/clock';

export interface DecideCaseInput {
  caseId: string;
  decision: DecisionType;
  edits?: {
    amountCents?: number;
    narrative?: string;
  };
  until?: string;
}

export async function decideCase(
  db: DbClient,
  paypal: PayPalPort,
  input: DecideCaseInput
) {
  const c = await casesRepo.findById(db, input.caseId);
  if (!c) {
    throw new AppError('NOT_FOUND', `Case ${input.caseId} not found`);
  }

  if (c.status !== 'awaiting_approval' && c.status !== 'exec_failed') {
    throw new AppError('CONFLICT_STATE', `Case is in '${c.status}', cannot decide`);
  }

  const rec = await recommendationsRepo.getLatestForCase(db, c.id);
  if (!rec && input.decision !== 'snooze') {
    throw new AppError('CONFLICT_STATE', 'No recommendation exists for this case to approve/edit');
  }

  if (input.decision === 'approve') {
    await executeAction(db, paypal, {
      caseId: c.id,
      type: rec!.action,
      actor: 'seller',
      recommendationId: rec!.id,
      input: {
        amountCents: rec!.refund_amount_cents,
        narrative: rec!.evidence_narrative,
        message: rec!.tracking_message_draft,
      },
    });
  } else if (input.decision === 'edit') {
    const amountCents = input.edits?.amountCents ?? rec!.refund_amount_cents;
    const narrative = input.edits?.narrative ?? rec!.evidence_narrative;

    // Validate edits against order maximum
    const order = await ordersRepo.findById(db, c.order_id);
    if (order && amountCents) {
      const maxRefundable = order.amount_cents - order.refunded_cents;
      if (amountCents > maxRefundable) {
        throw new AppError('VALIDATION', `Edited amount exceeds max refundable of ${maxRefundable} cents`);
      }
    }

    await executeAction(db, paypal, {
      caseId: c.id,
      type: rec!.action,
      actor: 'seller',
      recommendationId: rec!.id,
      input: {
        amountCents,
        narrative,
      },
    });
  } else if (input.decision === 'snooze') {
    if (!input.until) {
      throw new AppError('VALIDATION', 'Snooze requires an until date (YYYY-MM-DD)');
    }
    const today = clock.todayIso();
    if (input.until <= today) {
      throw new AppError('VALIDATION', `Snooze date must be in the future (after today ${today})`);
    }

    await casesRepo.transition(db, c.id, [c.status], 'snoozed', 'seller', {
      snoozed_until: input.until,
    });
  }

  return getCaseDetail(db, c.id);
}

