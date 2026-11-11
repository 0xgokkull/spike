import { z } from 'zod';
import type { LlmPort } from '@/integrations/llm/port';
import { generateStructured } from '@/integrations/llm/structured';
import { PROPOSE_SYSTEM_PROMPT } from './prompts/propose';
import { ActionTypeSchema, type Proposal, type PolicyRules, type TriageResult } from '@/domain/types';
import type { CaseValidationContext } from '@/domain/validate';

const ProposalSchema = z.object({
  action: ActionTypeSchema,
  refundAmountCents: z.number().nullable().optional(),
  policyClauseId: z.string(),
  rationale: z.string().max(400),
  evidenceNarrative: z.string().max(800).nullable().optional(),
  trackingMessageDraft: z.string().max(500).nullable().optional(),
});

export interface ProposeContext extends CaseValidationContext {
  triage: TriageResult;
  buyerMessage: string;
}

export async function proposeAction(llm: LlmPort, ctx: ProposeContext): Promise<Proposal> {
  const policyClausesText = (ctx.policy?.clauses || [])
    .map((c) => `- [${c.id}]: ${c.text}`)
    .join('\n');

  const maxRefundable = ctx.order.amount_cents - ctx.order.refunded_cents;

  const userInput = `
Case Facts:
- Source: ${ctx.source}
- Reason: ${ctx.reason}
- Available Actions: [${ctx.availableActions.join(', ')}]
- Order Item: ${ctx.order.carrier || 'Standard Order'} (Amount: ${ctx.order.amount_cents} cents, Max Refundable: ${maxRefundable} cents)
- Tracking Status: ${ctx.order.tracking_status} (Carrier: ${ctx.order.carrier || 'none'}, Number: ${ctx.order.tracking_number || 'none'})
- Triage Summary: ${ctx.triage.buyerClaim} (Requested: ${ctx.triage.requestedOutcome})

Merchant Policy Clauses:
${policyClausesText}

Buyer Message:
"""
${ctx.buyerMessage.slice(0, 1000)}
"""

Recommend the single best action and cite the matching policy clause:`;

  const res = await generateStructured(llm, {
    schema: ProposalSchema,
    system: PROPOSE_SYSTEM_PROMPT,
    input: userInput,
  });

  return {
    action: res.action,
    refundAmountCents: res.refundAmountCents ?? undefined,
    policyClauseId: res.policyClauseId,
    rationale: res.rationale,
    evidenceNarrative: res.evidenceNarrative ?? undefined,
    trackingMessageDraft: res.trackingMessageDraft ?? undefined,
  };
}

