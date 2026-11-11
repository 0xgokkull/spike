import type { PolicyRules, PolicyClause, Reason } from './types';

export function matchClause(policy: PolicyRules, clauseId: string): PolicyClause | null {
  return policy?.clauses?.find((c) => c.id === clauseId) ?? null;
}

export function isEligibleForAutoRefund(
  policy: PolicyRules,
  reason: Reason,
  amountCents: number
): boolean {
  if (amountCents > policy.autoRefundCapCents) {
    return false;
  }
  return policy.autoRefundReasons.includes(reason);
}

