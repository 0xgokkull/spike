import type { Proposal, PolicyRules, Reason, TrackingStatus, ExecutionMode } from './types';
import type { ValidationResult } from './validate';

export interface GateContext {
  reason: Reason;
  trackingStatus: TrackingStatus;
  policy: PolicyRules;
  validation: ValidationResult;
  hasPriorFailedAttempt?: boolean;
}

export interface GateResult {
  mode: ExecutionMode;
  reasons: string[];
}

export function autonomyGate(proposal: Proposal, ctx: GateContext): GateResult {
  const reasons: string[] = [];

  if (proposal.action !== 'refund') {
    reasons.push(`Action '${proposal.action}' requires seller approval by system policy`);
  }

  if (proposal.action === 'refund') {
    const amount = proposal.refundAmountCents ?? 0;
    if (amount > ctx.policy.autoRefundCapCents) {
      reasons.push(`Refund amount $${(amount / 100).toFixed(2)} exceeds auto-refund limit of $${(ctx.policy.autoRefundCapCents / 100).toFixed(2)}`);
    }

    if (!ctx.policy.autoRefundReasons.includes(ctx.reason)) {
      reasons.push(`Reason '${ctx.reason}' is not eligible for auto-refund under store policy`);
    }

    if (ctx.trackingStatus === 'delivered') {
      reasons.push('Package is marked as delivered; seller must review claim');
    }
  }

  if (!ctx.validation.valid) {
    reasons.push('Proposal failed validation checks');
  }

  if (ctx.hasPriorFailedAttempt) {
    reasons.push('A previous execution attempt failed for this case');
  }

  const isAuto = reasons.length === 0;

  return {
    mode: isAuto ? 'auto' : 'approval',
    reasons,
  };
}

