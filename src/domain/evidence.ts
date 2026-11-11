import type { Reason, TrackingStatus } from './types';

export interface OrderEvidenceFacts {
  id: string;
  carrier?: string | null;
  tracking_number?: string | null;
  tracking_status: TrackingStatus;
  delivered_at?: Date | string | null;
}

export interface EvidenceCompletenessResult {
  required: string[];
  present: string[];
  missing: string[];
  score: string;
  isComplete: boolean;
}

export function requiredEvidence(reason: Reason): string[] {
  if (reason === 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED') {
    return [
      'orderId',
      'carrier',
      'trackingNumber',
      'deliveryStatus',
      'deliveredAt',
      'deliveryReceiptPdf',
    ];
  }
  return ['orderId'];
}

export function evidenceCompleteness(
  order: OrderEvidenceFacts,
  reason: Reason
): EvidenceCompletenessResult {
  const required = requiredEvidence(reason);
  const present: string[] = [];
  const missing: string[] = [];

  for (const item of required) {
    let hasItem = false;

    if (item === 'orderId') {
      hasItem = Boolean(order.id);
    } else if (item === 'carrier') {
      hasItem = Boolean(order.carrier);
    } else if (item === 'trackingNumber') {
      hasItem = Boolean(order.tracking_number);
    } else if (item === 'deliveryStatus') {
      hasItem = order.tracking_status === 'delivered';
    } else if (item === 'deliveredAt') {
      hasItem = Boolean(order.delivered_at);
    } else if (item === 'deliveryReceiptPdf') {
      hasItem = Boolean(order.carrier && order.tracking_number && order.tracking_status === 'delivered');
    }

    if (hasItem) {
      present.push(item);
    } else {
      missing.push(item);
    }
  }

  return {
    required,
    present,
    missing,
    score: `${present.length}/${required.length}`,
    isComplete: missing.length === 0,
  };
}
