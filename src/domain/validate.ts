import type { Proposal, PolicyRules, ActionType, Reason, CaseSource } from './types';
import { matchClause } from './policy';
import { evidenceCompleteness, type OrderEvidenceFacts } from './evidence';

export interface CaseValidationContext {
  source: CaseSource;
  reason: Reason;
  availableActions: ActionType[];
  order: OrderEvidenceFacts & {
    amount_cents: number;
    refunded_cents: number;
  };
  policy: PolicyRules;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateRecommendation(
  proposal: Proposal,
  context: CaseValidationContext
): ValidationResult {
  const errors: string[] = [];

  // 1. Action available
  if (!context.availableActions.includes(proposal.action)) {
    errors.push(`Action '${proposal.action}' is not in available actions: [${context.availableActions.join(', ')}]`);
  }

  // 2. Policy clause exists
  const clause = matchClause(context.policy, proposal.policyClauseId);
  if (!clause) {
    errors.push(`Policy clause '${proposal.policyClauseId}' does not exist in active policy version ${context.policy.version}`);
  }

  // 3. Refund amount validation
  if (proposal.action === 'refund') {
    if (proposal.refundAmountCents === undefined || proposal.refundAmountCents === null) {
      errors.push('Refund action requires refundAmountCents to be specified');
    } else {
      if (!Number.isInteger(proposal.refundAmountCents) || proposal.refundAmountCents <= 0) {
        errors.push(`Refund amount must be a positive integer in cents. Got: ${proposal.refundAmountCents}`);
      }
      const maxRefundable = context.order.amount_cents - context.order.refunded_cents;
      if (proposal.refundAmountCents > maxRefundable) {
        errors.push(`Refund amount ${proposal.refundAmountCents} exceeds max refundable amount ${maxRefundable}`);
      }
    }
  }

  // 4. Contest requires supported reason and 100% evidence completeness
  if (proposal.action === 'contest') {
    if (context.reason !== 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED') {
      errors.push(`Contest is only supported for 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED', got '${context.reason}'`);
    }
    const completeness = evidenceCompleteness(context.order, context.reason);
    if (!completeness.isComplete) {
      errors.push(`Contest requires 100% evidence completeness. Missing items: [${completeness.missing.join(', ')}]`);
    }
  }

  // 5. Accept claim applies only to disputes
  if (proposal.action === 'accept_claim' && context.source !== 'dispute') {
    errors.push('Action accept_claim applies only to dispute cases');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
