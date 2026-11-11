import { describe, it, expect } from 'vitest';
import { validateRecommendation } from '@/domain/validate';
import type { PolicyRules } from '@/domain/types';

describe('domain/validate validateRecommendation', () => {
  const policy: PolicyRules = {
    version: 1,
    autoRefundCapCents: 2500,
    autoRefundReasons: ['MERCHANDISE_OR_SERVICE_NOT_RECEIVED'],
    refundWindowDays: 30,
    clauses: [
      { id: 'P-1', text: 'Refund when not delivered' },
      { id: 'P-3', text: 'Contest when delivered' },
    ],
  };

  it('validates a correct refund proposal', () => {
    const res = validateRecommendation(
      {
        action: 'refund',
        refundAmountCents: 2000,
        policyClauseId: 'P-1',
        rationale: 'Item lost in transit',
      },
      {
        source: 'refund_request',
        reason: 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED',
        availableActions: ['refund', 'reply'],
        order: {
          id: 'ord-1',
          amount_cents: 2000,
          refunded_cents: 0,
          tracking_status: 'none',
        },
        policy,
      }
    );

    expect(res.valid).toBe(true);
    expect(res.errors).toEqual([]);
  });

  it('fails if proposed action is not available', () => {
    const res = validateRecommendation(
      {
        action: 'contest',
        policyClauseId: 'P-3',
        rationale: 'Contest claim',
      },
      {
        source: 'refund_request',
        reason: 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED',
        availableActions: ['refund', 'reply'], // contest is not available!
        order: {
          id: 'ord-1',
          amount_cents: 2000,
          refunded_cents: 0,
          tracking_status: 'delivered',
          carrier: 'FEDEX',
          tracking_number: '123',
          delivered_at: new Date(),
        },
        policy,
      }
    );

    expect(res.valid).toBe(false);
    expect(res.errors[0]).toContain("Action 'contest' is not in available actions");
  });

  it('fails if refund amount exceeds max refundable', () => {
    const res = validateRecommendation(
      {
        action: 'refund',
        refundAmountCents: 2500, // 2500 > (2000 - 0)
        policyClauseId: 'P-1',
        rationale: 'Over-refund',
      },
      {
        source: 'refund_request',
        reason: 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED',
        availableActions: ['refund'],
        order: {
          id: 'ord-1',
          amount_cents: 2000,
          refunded_cents: 0,
          tracking_status: 'none',
        },
        policy,
      }
    );

    expect(res.valid).toBe(false);
    expect(res.errors[0]).toContain('exceeds max refundable amount');
  });

  it('fails contest if evidence is incomplete', () => {
    const res = validateRecommendation(
      {
        action: 'contest',
        policyClauseId: 'P-3',
        rationale: 'Contest',
      },
      {
        source: 'dispute',
        reason: 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED',
        availableActions: ['contest', 'refund'],
        order: {
          id: 'ord-1',
          amount_cents: 5000,
          refunded_cents: 0,
          tracking_status: 'in_transit', // not delivered!
        },
        policy,
      }
    );

    expect(res.valid).toBe(false);
    expect(res.errors[0]).toContain('Contest requires 100% evidence completeness');
  });
});

