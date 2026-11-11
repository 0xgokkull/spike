import type { DbClient } from '@/db/client';
import type { LlmPort } from '@/integrations/llm/port';
import { casesRepo } from '@/db/repos/cases';
import { ordersRepo } from '@/db/repos/orders';
import { policiesRepo } from '@/db/repos/policies';
import { recommendationsRepo } from '@/db/repos/recommendations';
import { eventsRepo } from '@/db/repos/events';
import { runAgent } from '@/agent/pipeline';
import { autonomyGate } from '@/domain/gate';
import { buildProvenance } from '@/domain/provenance';
import { AppError } from '@/lib/errors';
import { logger } from '@/lib/logger';

export async function processCase(
  db: DbClient,
  llm: LlmPort,
  caseId: string,
  executeActionFn?: (params: { caseId: string; type: string; actor: 'agent_auto'; input: any }) => Promise<any>
) {
  const c = await casesRepo.findById(db, caseId);
  if (!c) {
    throw new AppError('NOT_FOUND', `Case ${caseId} not found`);
  }

  const order = await ordersRepo.findById(db, c.order_id);
  if (!order) {
    throw new AppError('NOT_FOUND', `Order ${c.order_id} not found for case ${caseId}`);
  }

  const policy = await policiesRepo.getActive(db);
  if (!policy) {
    throw new AppError('NOT_FOUND', 'Active store policy not found');
  }

  logger.info(`Running agent pipeline for case ${caseId}...`);

  const pipelineResult = await runAgent(llm, {
    source: c.source,
    reason: c.reason,
    buyerMessage: c.buyer_message,
    availableActions: c.available_actions,
    order: {
      id: order.id,
      carrier: order.carrier,
      tracking_number: order.tracking_number,
      tracking_status: order.tracking_status,
      delivered_at: order.delivered_at,
      amount_cents: order.amount_cents,
      refunded_cents: order.refunded_cents,
      shipped_at: order.shipped_at,
    },
    policy: policy.rules,
  });

  const gateResult = autonomyGate(pipelineResult.proposal, {
    reason: c.reason,
    trackingStatus: order.tracking_status,
    policy: policy.rules,
    validation: pipelineResult.validation,
  });

  const provenance = buildProvenance(
    {
      order: {
        id: order.id,
        item: order.item,
        amount_cents: order.amount_cents,
        currency: order.currency,
        carrier: order.carrier,
        tracking_number: order.tracking_number,
        tracking_status: order.tracking_status,
        delivered_at: order.delivered_at,
      },
      reason: c.reason,
      policy: policy.rules,
    },
    pipelineResult.proposal,
    gateResult
  );

  // Store recommendation
  const rec = await recommendationsRepo.create(db, {
    case_id: c.id,
    action: pipelineResult.proposal.action,
    refund_amount_cents: pipelineResult.proposal.refundAmountCents,
    policy_clause_id: pipelineResult.proposal.policyClauseId,
    rationale: pipelineResult.proposal.rationale,
    evidence_narrative: pipelineResult.proposal.evidenceNarrative,
    tracking_message_draft: pipelineResult.proposal.trackingMessageDraft,
    provenance,
    mode: gateResult.mode,
    gate_reasons: gateResult.reasons,
    origin: pipelineResult.origin,
    validation: pipelineResult.validation as unknown as Record<string, unknown>,
  });

  // State transitions: new -> triaged -> action_ready
  if (c.status === 'new') {
    await casesRepo.transition(db, c.id, ['new'], 'triaged', 'system');
  }
  await casesRepo.transition(db, c.id, ['triaged'], 'action_ready', 'agent');

  await eventsRepo.append(db, c.id, 'agent.recommended', 'agent', {
    recommendationId: rec.id,
    action: rec.action,
    mode: rec.mode,
  });

  // If gate is auto and executor is available, execute; otherwise awaiting_approval
  if (gateResult.mode === 'auto' && executeActionFn) {
    logger.info(`Auto-executing action for case ${caseId}...`);
    await executeActionFn({
      caseId: c.id,
      type: rec.action,
      actor: 'agent_auto',
      input: {
        amountCents: rec.refund_amount_cents,
      },
    });
  } else {
    await casesRepo.transition(db, c.id, ['action_ready'], 'awaiting_approval', 'system');
  }

  return {
    case: await casesRepo.findById(db, c.id),
    recommendation: rec,
    provenance,
  };
}
