import type { Provenance, Proposal, PolicyRules, Reason } from './types';
import type { GateResult } from './gate';
import { matchClause } from './policy';
import { evidenceCompleteness, type OrderEvidenceFacts } from './evidence';

export interface ProvenanceContext {
  order: OrderEvidenceFacts & {
    item: string;
    amount_cents: number;
    currency: string;
  };
  reason: Reason;
  policy: PolicyRules;
}

export function buildProvenance(
  ctx: ProvenanceContext,
  proposal: Proposal,
  gate: GateResult
): Provenance {
  const clause = matchClause(ctx.policy, proposal.policyClauseId) || {
    id: proposal.policyClauseId,
    text: 'Cited policy clause',
  };

  const evidence = evidenceCompleteness(ctx.order, ctx.reason);

  let label = 'Local Action';
  let method = 'POST';
  let endpoint = '/api/local';

  if (proposal.action === 'refund') {
    label = 'PayPal Refund Capture';
    method = 'POST';
    endpoint = '/v2/payments/captures/{capture_id}/refund';
  } else if (proposal.action === 'contest') {
    label = 'PayPal Dispute Evidence Submission';
    method = 'POST';
    endpoint = '/v1/customer/disputes/{id}/provide-evidence';
  } else if (proposal.action === 'accept_claim') {
    label = 'PayPal Dispute Concession';
    method = 'POST';
    endpoint = '/v1/customer/disputes/{id}/accept-claim';
  } else if (proposal.action === 'reply') {
    label = 'Customer Response Message';
    method = 'LOCAL';
    endpoint = 'none';
  }

  return {
    policyClause: clause,
    order: {
      id: ctx.order.id,
      item: ctx.order.item,
      amountCents: ctx.order.amount_cents,
      currency: ctx.order.currency,
    },
    tracking: {
      carrier: ctx.order.carrier,
      number: ctx.order.tracking_number,
      status: ctx.order.tracking_status,
      deliveredAt: ctx.order.delivered_at ? String(ctx.order.delivered_at) : null,
    },
    evidence: {
      required: evidence.required,
      present: evidence.present,
      missing: evidence.missing,
      score: evidence.score,
    },
    paypalAction: {
      label,
      method,
      endpoint,
      amountCents: proposal.refundAmountCents,
    },
    execution: {
      mode: gate.mode,
      reasons: gate.reasons,
    },
  };
}
