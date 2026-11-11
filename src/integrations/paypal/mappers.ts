import { toCents } from '@/lib/money';
import type { DisputeDetail, DisputeSummary } from './port';
import type { ActionType, Reason } from '@/domain/types';

export function mapDisputeReason(rawReason: string): Reason {
  if (rawReason === 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED') {
    return 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED';
  }
  if (rawReason === 'MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED') {
    return 'MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED';
  }
  if (rawReason === 'UNAUTHORISED') {
    return 'UNAUTHORISED';
  }
  if (rawReason === 'BUYER_CANCELLED_SERVICE') {
    return 'BUYER_CANCELLED_SERVICE';
  }
  return 'OTHER';
}

export function mapAvailableActions(dispute: any): ActionType[] {
  const actions: ActionType[] = [];
  const links: { rel: string }[] = dispute.links || [];
  const rels = new Set(links.map((l) => l.rel));

  if (dispute.status === 'WAITING_FOR_SELLER_RESPONSE' && rels.has('provide-evidence')) {
    actions.push('contest');
  }
  if (rels.has('accept-claim')) {
    actions.push('accept_claim');
  }
  // If dispute is not resolved, refund is available
  if (dispute.status !== 'RESOLVED') {
    actions.push('refund');
  }

  return actions;
}

export function mapDisputeSummary(raw: any, simulated: boolean = false): DisputeSummary {
  const buyerMessage =
    (raw.messages || []).find((m: any) => m.posted_by === 'BUYER')?.content ||
    raw.dispute_amount?.notes ||
    'Dispute opened by buyer.';

  return {
    disputeId: raw.dispute_id || raw.id,
    createTime: raw.create_time,
    updateTime: raw.update_time,
    status: raw.status,
    reason: mapDisputeReason(raw.reason),
    disputeAmountCents: toCents(raw.dispute_amount?.value || '0.00'),
    currency: raw.dispute_amount?.currency_code || 'USD',
    sellerResponseDueDate: raw.seller_response_due_date || null,
    buyerMessage,
    availableActions: mapAvailableActions(raw),
    simulated,
  };
}

export function mapDisputeDetail(raw: any, simulated: boolean = false): DisputeDetail {
  const summary = mapDisputeSummary(raw, simulated);
  const tx = raw.disputed_transactions?.[0];

  return {
    ...summary,
    sellerTransactionId: tx?.seller_transaction_id || null,
    buyerTransactionId: tx?.buyer_transaction_id || null,
    links: raw.links || [],
  };
}
