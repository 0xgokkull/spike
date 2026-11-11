import type { ActionType, Reason } from '@/domain/types';

export interface ActionResult {
  ok: boolean;
  refs: Record<string, string>;
  simulated: boolean;
}

export interface DisputeSummary {
  disputeId: string;
  createTime: string;
  updateTime: string;
  status: string;
  reason: Reason;
  disputeAmountCents: number;
  currency: string;
  sellerResponseDueDate: string | null;
  buyerMessage: string;
  availableActions: ActionType[];
  simulated: boolean;
}

export interface DisputeDetail extends DisputeSummary {
  sellerTransactionId: string | null;
  buyerTransactionId: string | null;
  links: { rel: string; href: string; method: string }[];
}

export interface EvidenceItem {
  evidenceType: string;
  carrierName?: string;
  trackingNumber?: string;
  notes?: string;
}

export interface EvidenceFile {
  name: string;
  buffer: Buffer;
  contentType: string;
}

export interface PayPalPort {
  listDisputes(query?: { status?: string }): Promise<DisputeSummary[]>;
  getDispute(id: string): Promise<DisputeDetail>;
  refundCapture(input: {
    captureId: string;
    amountCents?: number;
    currency?: string;
    requestId: string;
    note?: string;
  }): Promise<ActionResult>;
  acceptClaim(input: {
    disputeId: string;
    note?: string;
    requestId?: string;
  }): Promise<ActionResult>;
  provideEvidence(input: {
    disputeId: string;
    evidences: EvidenceItem[];
    files?: EvidenceFile[];
  }): Promise<ActionResult>;
  createShipmentTracking(input: {
    transactionId: string;
    trackingNumber: string;
    carrier: string;
    status: string;
  }): Promise<void>;
  settleDisputeSandbox(input: {
    disputeId: string;
    outcome: 'seller' | 'buyer';
  }): Promise<ActionResult>;
  verifyWebhook(input: {
    headers: Record<string, string>;
    rawBody: string;
  }): Promise<boolean>;
}

