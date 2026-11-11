import type { Proposal, CaseSource, Reason, PolicyRules } from '@/domain/types';
import { evidenceCompleteness, type OrderEvidenceFacts } from '@/domain/evidence';

export interface FallbackContext {
  source: CaseSource;
  reason: Reason;
  order: OrderEvidenceFacts & {
    amount_cents: number;
    refunded_cents: number;
    shipped_at?: Date | string | null;
  };
  policy: PolicyRules;
}

export function deterministicProposal(ctx: FallbackContext): Proposal {
  const refundable = Math.max(0, ctx.order.amount_cents - ctx.order.refunded_cents);

  if (ctx.source === 'dispute') {
    if (ctx.reason === 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED') {
      const completeness = evidenceCompleteness(ctx.order, ctx.reason);
      if (completeness.isComplete) {
        return {
          action: 'contest',
          policyClauseId: 'P-3',
          rationale: 'Carrier tracking confirms delivery to buyer address with full proof of delivery.',
          evidenceNarrative: `Package was shipped via ${ctx.order.carrier || 'carrier'} with tracking number ${ctx.order.tracking_number || ''} and confirmed delivered.`,
        };
      }
      return {
        action: 'refund',
        refundAmountCents: refundable,
        policyClauseId: 'P-1',
        rationale: 'Tracking does not confirm delivery; policy dictates refunding the customer.',
      };
    }
    return {
      action: 'accept_claim',
      policyClauseId: 'P-2',
      rationale: 'Dispute reason is outside contest scope; conceding claim to minimize merchant risk.',
    };
  }

  // Source is refund_request
  if (ctx.order.tracking_status !== 'delivered') {
    return {
      action: 'refund',
      refundAmountCents: refundable,
      policyClauseId: 'P-1',
      rationale: 'Package was not delivered; issuing refund per standard delivery policy.',
    };
  }

  // Order was delivered: check 30-day window
  const deliveredAt = ctx.order.delivered_at ? new Date(ctx.order.delivered_at).getTime() : 0;
  const daysSinceDelivery = deliveredAt > 0 ? (Date.now() - deliveredAt) / (1000 * 60 * 60 * 24) : 0;

  if (daysSinceDelivery <= ctx.policy.refundWindowDays) {
    return {
      action: 'refund',
      refundAmountCents: refundable,
      policyClauseId: 'P-4',
      rationale: 'Customer requested return within the allowed 30-day policy return window.',
    };
  }

  return {
    action: 'reply',
    policyClauseId: 'P-5',
    rationale: 'Request was submitted after the 30-day policy window; providing explanation to customer.',
    trackingMessageDraft: 'Thank you for reaching out. Per our store policy, return and refund requests must be initiated within 30 days of delivery.',
  };
}

