import type { DbClient } from '@/db/client';
import type { PayPalPort } from '@/integrations/paypal/port';
import type { ActionType, Actor } from '@/domain/types';
import { actionsRepo } from '@/db/repos/actions';
import { casesRepo } from '@/db/repos/cases';
import { ordersRepo } from '@/db/repos/orders';
import { eventsRepo } from '@/db/repos/events';
import { getExecutor } from '@/executors/registry';
import { idempotencyKey } from '@/lib/hash';
import { AppError } from '@/lib/errors';
import { logger } from '@/lib/logger';

export interface ExecuteActionInput {
  caseId: string;
  type: ActionType;
  actor: 'agent_auto' | 'seller';
  input: Record<string, unknown>;
  recommendationId?: string | null;
}

export async function executeAction(
  db: DbClient,
  paypal: PayPalPort,
  input: ExecuteActionInput
) {
  const { caseId, type, actor, recommendationId } = input;

  // 1. Compute idempotency key
  const key = idempotencyKey([
    caseId,
    type,
    String(input.input.amountCents || ''),
    String(input.input.narrative || input.input.message || ''),
  ]);

  // 2. Check for existing execution
  const existing = await actionsRepo.findByIdempotencyKey(db, key);
  if (existing && existing.status === 'succeeded') {
    logger.info(`Idempotent action returned: ${key}`, { actionId: existing.id });
    return {
      action: existing,
      idempotent: true,
      ok: true,
    };
  }

  const c = await casesRepo.findById(db, caseId);
  if (!c) {
    throw new AppError('NOT_FOUND', `Case ${caseId} not found`);
  }

  const order = await ordersRepo.findById(db, c.order_id);
  if (!order) {
    throw new AppError('NOT_FOUND', `Order ${c.order_id} not found`);
  }

  // 3. Record pending action
  const actionRow = await actionsRepo.create(db, {
    case_id: caseId,
    recommendation_id: recommendationId,
    type,
    input: input.input,
    idempotency_key: key,
    actor,
    simulated: c.simulated,
  });

  await eventsRepo.append(db, caseId, 'action.started', actor as Actor, {
    actionId: actionRow.id,
    type,
  });

  // 4. Run executor
  const executor = getExecutor(type);
  try {
    const result = await executor.run(input.input, {
      caseId,
      paypal,
      order: {
        id: order.id,
        item: order.item,
        amount_cents: order.amount_cents,
        currency: order.currency,
        paypal_order_id: order.paypal_order_id,
        paypal_capture_id: order.paypal_capture_id,
        carrier: order.carrier,
        tracking_number: order.tracking_number,
        tracking_status: order.tracking_status,
        delivered_at: order.delivered_at,
      },
      paypalDisputeId: c.paypal_dispute_id,
      actor,
    });

    // 5. Update action row with success
    const updatedAction = await actionsRepo.update(db, actionRow.id, {
      status: 'succeeded',
      response: result.refs,
      paypal_refs: result.refs,
    });

    // 6. Transition case state
    // Step a: from current actionable state to 'executed'
    const fromStatus = [c.status];
    await casesRepo.transition(db, caseId, fromStatus, 'executed', actor as Actor, {
      actionId: actionRow.id,
      type,
    });

    // Step b: from 'executed' to target resolution state
    if (c.source === 'dispute') {
      if (type === 'contest') {
        await casesRepo.transition(db, caseId, ['executed'], 'waiting_on_paypal', 'system');
      } else {
        await casesRepo.transition(db, caseId, ['executed'], 'resolved', 'system', {
          outcome: type === 'accept_claim' ? 'conceded' : 'refunded',
        });
      }
    } else {
      await casesRepo.transition(db, caseId, ['executed'], 'resolved', 'system', {
        outcome: type === 'reply' ? 'replied' : 'refunded',
      });
    }

    await eventsRepo.append(db, caseId, 'action.succeeded', actor as Actor, {
      actionId: actionRow.id,
      refs: result.refs,
    });

    return {
      action: updatedAction,
      idempotent: false,
      ok: true,
      refs: result.refs,
    };
  } catch (err: any) {
    logger.error(`Execution failed for case ${caseId}`, { error: err.message });

    await actionsRepo.update(db, actionRow.id, {
      status: 'failed',
      error: { message: err.message },
    });

    try {
      await casesRepo.transition(db, caseId, [c.status], 'exec_failed', 'system', {
        error: err.message,
      });
    } catch (transitionErr) {
      logger.warn('Could not transition to exec_failed', { error: String(transitionErr) });
    }

    await eventsRepo.append(db, caseId, 'action.failed', actor as Actor, {
      actionId: actionRow.id,
      error: err.message,
    });

    throw err;
  }
}
