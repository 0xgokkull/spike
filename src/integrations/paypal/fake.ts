import type {
  PayPalPort,
  DisputeSummary,
  DisputeDetail,
  ActionResult,
  EvidenceItem,
  EvidenceFile,
} from './port';
import { mapDisputeDetail } from './mappers';
import disputeFixture from '../../../tests/fixtures/paypal/spike-e-dispute-simulated.json';

export class FakePayPal implements PayPalPort {
  private disputes: Map<string, any> = new Map();

  constructor() {
    this.disputes.set(disputeFixture.dispute_id, disputeFixture);
  }

  async listDisputes(_query?: { status?: string }): Promise<DisputeSummary[]> {
    return Array.from(this.disputes.values()).map((d) => mapDisputeDetail(d, true));
  }

  async getDispute(id: string): Promise<DisputeDetail> {
    const d = this.disputes.get(id) || disputeFixture;
    return mapDisputeDetail(d, true);
  }

  async refundCapture(input: {
    captureId: string;
    amountCents?: number;
    currency?: string;
    requestId: string;
    note?: string;
  }): Promise<ActionResult> {
    return {
      ok: true,
      refs: {
        refundId: `REF-FAKE-${input.requestId.slice(0, 8)}`,
        captureId: input.captureId,
      },
      simulated: true,
    };
  }

  async acceptClaim(input: {
    disputeId: string;
    note?: string;
    requestId?: string;
  }): Promise<ActionResult> {
    const existing = this.disputes.get(input.disputeId);
    if (existing) {
      existing.status = 'RESOLVED';
      existing.dispute_outcome = { outcome_code: 'RESOLVED_BUYER_FAVOUR' };
    }
    return {
      ok: true,
      refs: {
        disputeId: input.disputeId,
        status: 'RESOLVED',
      },
      simulated: true,
    };
  }

  async provideEvidence(input: {
    disputeId: string;
    evidences: EvidenceItem[];
    files?: EvidenceFile[];
  }): Promise<ActionResult> {
    const existing = this.disputes.get(input.disputeId);
    if (existing) {
      existing.status = 'UNDER_REVIEW';
    }
    return {
      ok: true,
      refs: {
        disputeId: input.disputeId,
        status: 'UNDER_REVIEW',
      },
      simulated: true,
    };
  }

  async createShipmentTracking(_input: {
    transactionId: string;
    trackingNumber: string;
    carrier: string;
    status: string;
  }): Promise<void> {
    return;
  }

  async settleDisputeSandbox(input: {
    disputeId: string;
    outcome: 'seller' | 'buyer';
  }): Promise<ActionResult> {
    const existing = this.disputes.get(input.disputeId);
    const outcomeCode = input.outcome === 'seller' ? 'RESOLVED_SELLER_FAVOUR' : 'RESOLVED_BUYER_FAVOUR';
    if (existing) {
      existing.status = 'RESOLVED';
      existing.dispute_outcome = { outcome_code: outcomeCode };
    }
    return {
      ok: true,
      refs: {
        disputeId: input.disputeId,
        outcome: outcomeCode,
      },
      simulated: true,
    };
  }

  async verifyWebhook(_input: { headers: Record<string, string>; rawBody: string }): Promise<boolean> {
    return true;
  }
}
