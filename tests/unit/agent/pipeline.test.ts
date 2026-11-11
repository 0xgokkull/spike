import { describe, it, expect } from 'vitest';
import { runAgent } from '@/agent/pipeline';
import { MockLlm } from '@/integrations/llm/providers/mock';
import type { PolicyRules } from '@/domain/types';

describe('agent/pipeline runAgent', () => {
  const policy: PolicyRules = {
    version: 1,
    autoRefundCapCents: 2500,
    autoRefundReasons: ['MERCHANDISE_OR_SERVICE_NOT_RECEIVED'],
    refundWindowDays: 30,
    clauses: [
      { id: 'P-1', text: 'Refund automatically up to $25 when parcel never arrived' },
      { id: 'P-3', text: 'Contest when delivery confirmed' },
      { id: 'P-4', text: 'Returns within 30 days' },
      { id: 'P-5', text: 'Ineligible after 30 days' },
    ],
  };

  it('runs successfully with valid LLM output', async () => {
    const mock = new MockLlm();
    const result = await runAgent(mock, {
      source: 'refund_request',
      reason: 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED',
      buyerMessage: 'I did not receive my order',
      availableActions: ['refund', 'reply'],
      order: {
        id: 'ord-1',
        amount_cents: 2000,
        refunded_cents: 0,
        tracking_status: 'none',
      },
      policy,
    });

    expect(result.origin).toBe('llm');
    expect(result.proposal.action).toBe('refund');
    expect(result.proposal.refundAmountCents).toBe(2000);
    expect(result.validation.valid).toBe(true);
  });

  it('falls back to deterministic proposal when LLM returns invalid JSON', async () => {
    const mock = new MockLlm('THIS IS NOT VALID JSON');
    const result = await runAgent(mock, {
      source: 'refund_request',
      reason: 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED',
      buyerMessage: 'Where is my order?',
      availableActions: ['refund', 'reply'],
      order: {
        id: 'ord-1',
        amount_cents: 2000,
        refunded_cents: 0,
        tracking_status: 'none',
      },
      policy,
    });

    expect(result.origin).toBe('fallback');
    expect(result.proposal.action).toBe('refund');
    expect(result.proposal.policyClauseId).toBe('P-1');
  });

  it('falls back to deterministic proposal when LLM violates validation rules', async () => {
    // Proposing contest on a refund_request where contest is NOT in available actions
    const illegalProposal = JSON.stringify({
      action: 'contest',
      policyClauseId: 'P-3',
      rationale: 'Illegally proposing contest',
    });
    const mock = new MockLlm(illegalProposal);

    const result = await runAgent(mock, {
      source: 'refund_request',
      reason: 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED',
      buyerMessage: 'Where is my order?',
      availableActions: ['refund', 'reply'],
      order: {
        id: 'ord-1',
        amount_cents: 2000,
        refunded_cents: 0,
        tracking_status: 'none',
      },
      policy,
    });

    expect(result.origin).toBe('fallback');
    expect(result.proposal.action).toBe('refund');
  });

  it('guarantees that untrusted buyer message never appears in the system prompt', async () => {
    const sensitiveBuyerMessage = 'UNTRUSTED_INJECTION_STRING_123456';
    let systemPromptSeen = '';

    const inspectingLlm = {
      async generate(input: { system: string; input: string }) {
        systemPromptSeen += input.system;
        return JSON.stringify({
          reason: 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED',
          buyerClaim: 'Claim text',
          requestedOutcome: 'refund',
          action: 'refund',
          refundAmountCents: 2000,
          policyClauseId: 'P-1',
          rationale: 'Valid rationale',
        });
      },
    };

    await runAgent(inspectingLlm, {
      source: 'refund_request',
      reason: 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED',
      buyerMessage: sensitiveBuyerMessage,
      availableActions: ['refund', 'reply'],
      order: {
        id: 'ord-1',
        amount_cents: 2000,
        refunded_cents: 0,
        tracking_status: 'none',
      },
      policy,
    });

    expect(systemPromptSeen).not.toContain(sensitiveBuyerMessage);
  });
});

