import { describe, it, expect } from 'vitest';
import { autonomyGate } from '@/domain/gate';
import type { PolicyRules } from '@/domain/types';

describe('domain/gate autonomyGate', () => {
  const policy: PolicyRules = {
    version: 1,
    autoRefundCapCents: 2500, // $25.00
    autoRefundReasons: ['MERCHANDISE_OR_SERVICE_NOT_RECEIVED', 'OTHER'],
    refundWindowDays: 30,
    clauses: [
      { id: 'P-1', text: 'Refund up to $25 when parcel never arrived' },
      { id: 'P-2', text: 'Above $25 requires approval' },
      { id: 'P-3', text: 'Contest with proof of delivery' },
    ],
  };

  it('approves auto-execution only for small refund when parcel not delivered', () => {
    const res = autonomyGate(
      {
        action: 'refund',
        refundAmountCents: 2000,
        policyClauseId: 'P-1',
        rationale: 'Parcel lost',
      },
      {
        reason: 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED',
        trackingStatus: 'in_transit',
        policy,
        validation: { valid: true, errors: [] },
      }
    );

    expect(res.mode).toBe('auto');
    expect(res.reasons).toEqual([]);
  });

  it('requires approval if refund amount exceeds auto cap', () => {
    const res = autonomyGate(
      {
        action: 'refund',
        refundAmountCents: 3000, // $30 > $25
        policyClauseId: 'P-2',
        rationale: 'Customer requested refund',
      },
      {
        reason: 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED',
        trackingStatus: 'in_transit',
        policy,
        validation: { valid: true, errors: [] },
      }
    );

    expect(res.mode).toBe('approval');
    expect(res.reasons.length).toBeGreaterThan(0);
    expect(res.reasons[0]).toContain('exceeds auto-refund limit');
  });

  it('requires approval if tracking shows package delivered', () => {
    const res = autonomyGate(
      {
        action: 'refund',
        refundAmountCents: 1500,
        policyClauseId: 'P-1',
        rationale: 'Customer reports missing',
      },
      {
        reason: 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED',
        trackingStatus: 'delivered', // delivered!
        policy,
        validation: { valid: true, errors: [] },
      }
    );

    expect(res.mode).toBe('approval');
    expect(res.reasons).toContain('Package is marked as delivered; seller must review claim');
  });

  it('always requires approval for contest, accept_claim, and reply', () => {
    const contestRes = autonomyGate(
      { action: 'contest', policyClauseId: 'P-3', rationale: 'Contest' },
      {
        reason: 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED',
        trackingStatus: 'delivered',
        policy,
        validation: { valid: true, errors: [] },
      }
    );
    expect(contestRes.mode).toBe('approval');

    const acceptRes = autonomyGate(
      { action: 'accept_claim', policyClauseId: 'P-2', rationale: 'Accept' },
      {
        reason: 'OTHER',
        trackingStatus: 'delivered',
        policy,
        validation: { valid: true, errors: [] },
      }
    );
    expect(acceptRes.mode).toBe('approval');

    const replyRes = autonomyGate(
      { action: 'reply', policyClauseId: 'P-2', rationale: 'Reply' },
      {
        reason: 'OTHER',
        trackingStatus: 'delivered',
        policy,
        validation: { valid: true, errors: [] },
      }
    );
    expect(replyRes.mode).toBe('approval');
  });
});
