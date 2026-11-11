import { describe, it, expect } from 'vitest';
import {
  mapDisputeReason,
  mapAvailableActions,
  createPayPal,
  FakePayPal,
} from '@/integrations/paypal';

describe('PayPal integration', () => {
  it('maps dispute reasons accurately', () => {
    expect(mapDisputeReason('MERCHANDISE_OR_SERVICE_NOT_RECEIVED')).toBe(
      'MERCHANDISE_OR_SERVICE_NOT_RECEIVED'
    );
    expect(mapDisputeReason('MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED')).toBe(
      'MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED'
    );
    expect(mapDisputeReason('UNKNOWN_REASON')).toBe('OTHER');
  });

  it('maps available actions from status and HATEOAS links', () => {
    const disputeWithEvidence = {
      status: 'WAITING_FOR_SELLER_RESPONSE',
      links: [{ rel: 'provide-evidence' }, { rel: 'accept-claim' }],
    };
    const actions = mapAvailableActions(disputeWithEvidence);
    expect(actions).toContain('contest');
    expect(actions).toContain('accept_claim');
    expect(actions).toContain('refund');

    const resolvedDispute = {
      status: 'RESOLVED',
      links: [],
    };
    expect(mapAvailableActions(resolvedDispute)).toEqual([]);
  });

  it('FakePayPal executes simulated actions', async () => {
    const port = createPayPal('fake');
    expect(port).toBeInstanceOf(FakePayPal);

    const list = await port.listDisputes();
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].simulated).toBe(true);

    const refund = await port.refundCapture({
      captureId: 'CAP-123',
      amountCents: 1000,
      requestId: 'req-1',
    });
    expect(refund.ok).toBe(true);
    expect(refund.simulated).toBe(true);

    const settle = await port.settleDisputeSandbox({
      disputeId: list[0].disputeId,
      outcome: 'seller',
    });
    expect(settle.ok).toBe(true);
    expect(settle.refs.outcome).toBe('RESOLVED_SELLER_FAVOUR');
  });
});

