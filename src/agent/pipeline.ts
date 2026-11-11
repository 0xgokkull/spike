import type { LlmPort } from '@/integrations/llm/port';
import type { Proposal, TriageResult, PolicyRules, Reason, CaseSource, ActionType } from '@/domain/types';
import { triageCase } from './triage';
import { proposeAction } from './propose';
import { deterministicProposal } from './fallback';
import { validateRecommendation, type ValidationResult } from '@/domain/validate';
import type { OrderEvidenceFacts } from '@/domain/evidence';
import { logger } from '@/lib/logger';

export interface AgentPipelineContext {
  source: CaseSource;
  reason: Reason;
  buyerMessage: string;
  availableActions: ActionType[];
  order: OrderEvidenceFacts & {
    amount_cents: number;
    refunded_cents: number;
    shipped_at?: Date | string | null;
  };
  policy: PolicyRules;
}

export interface PipelineResult {
  triage: TriageResult;
  proposal: Proposal;
  validation: ValidationResult;
  origin: 'llm' | 'fallback';
}

export async function runAgent(
  llm: LlmPort,
  ctx: AgentPipelineContext
): Promise<PipelineResult> {
  // Step 1: Triage
  let triage: TriageResult;
  try {
    triage = await triageCase(llm, ctx.buyerMessage);
  } catch (err: any) {
    logger.warn('LLM triage failed, using fallback triage', { error: err.message });
    triage = {
      reason: ctx.reason,
      buyerClaim: (ctx.buyerMessage || '').slice(0, 200),
      requestedOutcome: 'unknown',
    };
  }

  // Step 2: Propose Action
  let proposal: Proposal | null = null;
  let validation: ValidationResult = { valid: false, errors: [] };
  let origin: 'llm' | 'fallback' = 'llm';

  try {
    proposal = await proposeAction(llm, { ...ctx, triage });
    validation = validateRecommendation(proposal, ctx);
  } catch (err: any) {
    logger.warn('LLM proposal generation failed', { error: err.message });
  }

  // Step 3: If LLM proposal failed or violated rules, trigger deterministic fallback
  if (!proposal || !validation.valid) {
    logger.warn('LLM proposal invalid or failed, using deterministic fallback', {
      errors: validation.errors,
    });
    proposal = deterministicProposal(ctx);
    validation = validateRecommendation(proposal, ctx);
    origin = 'fallback';
  }

  return {
    triage,
    proposal,
    validation,
    origin,
  };
}

