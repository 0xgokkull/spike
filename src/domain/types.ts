import { z } from 'zod';

export const CaseStatusSchema = z.enum([
  'new',
  'triaged',
  'action_ready',
  'awaiting_approval',
  'executed',
  'waiting_on_paypal',
  'resolved',
  'snoozed',
  'closed',
  'exec_failed',
]);
export type CaseStatus = z.infer<typeof CaseStatusSchema>;

export const CaseSourceSchema = z.enum(['dispute', 'refund_request']);
export type CaseSource = z.infer<typeof CaseSourceSchema>;

export const ActionTypeSchema = z.enum(['refund', 'contest', 'accept_claim', 'reply']);
export type ActionType = z.infer<typeof ActionTypeSchema>;

export const ReasonSchema = z.enum([
  'MERCHANDISE_OR_SERVICE_NOT_RECEIVED',
  'MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED',
  'UNAUTHORISED',
  'BUYER_CANCELLED_SERVICE',
  'OTHER',
]);
export type Reason = z.infer<typeof ReasonSchema>;

export const TrackingStatusSchema = z.enum(['none', 'in_transit', 'delivered', 'exception']);
export type TrackingStatus = z.infer<typeof TrackingStatusSchema>;

export const ActorSchema = z.enum(['system', 'agent', 'agent_auto', 'seller', 'paypal']);
export type Actor = z.infer<typeof ActorSchema>;

export const ExecutionModeSchema = z.enum(['auto', 'approval']);
export type ExecutionMode = z.infer<typeof ExecutionModeSchema>;

export const CaseOutcomeSchema = z.enum([
  'seller_favor',
  'buyer_favor',
  'refunded',
  'conceded',
  'replied',
]);
export type CaseOutcome = z.infer<typeof CaseOutcomeSchema>;

export const DecisionTypeSchema = z.enum(['approve', 'edit', 'snooze']);
export type DecisionType = z.infer<typeof DecisionTypeSchema>;

export interface PolicyClause {
  id: string;
  text: string;
}

export interface PolicyRules {
  version: number;
  clauses: PolicyClause[];
  autoRefundCapCents: number;
  autoRefundReasons: Reason[];
  refundWindowDays: number;
}

export interface Provenance {
  policyClause: PolicyClause;
  order: {
    id: string;
    item: string;
    amountCents: number;
    currency: string;
  };
  tracking: {
    carrier?: string | null;
    number?: string | null;
    status: TrackingStatus;
    deliveredAt?: string | null;
  };
  evidence: {
    required: string[];
    present: string[];
    missing: string[];
    score: string;
  };
  paypalAction: {
    label: string;
    method: string;
    endpoint: string;
    amountCents?: number;
  };
  execution: {
    mode: ExecutionMode;
    reasons: string[];
  };
}

export interface TriageResult {
  reason: Reason;
  buyerClaim: string;
  requestedOutcome: 'refund' | 'replacement' | 'info' | 'unknown';
}

export interface Proposal {
  action: ActionType;
  refundAmountCents?: number;
  policyClauseId: string;
  rationale: string;
  evidenceNarrative?: string;
  trackingMessageDraft?: string;
}

export interface CaseListItem {
  id: string;
  source: CaseSource;
  status: CaseStatus;
  reason: Reason;
  amountCents: number;
  currency: string;
  deadlineAt: string | null;
  snoozedUntil: string | null;
  recommendation: {
    action: ActionType;
    amountCents?: number;
    mode: ExecutionMode;
  } | null;
  simulated: boolean;
}

export interface CaseDetail extends CaseListItem {
  order: {
    id: string;
    item: string;
    amountCents: number;
    currency: string;
    carrier?: string | null;
    trackingNumber?: string | null;
    trackingStatus: TrackingStatus;
    deliveredAt?: string | null;
  };
  buyerMessage: string;
  recommendation: {
    id: string;
    action: ActionType;
    refundAmountCents?: number | null;
    policyClauseId: string;
    rationale: string;
    evidenceNarrative?: string | null;
    trackingMessageDraft?: string | null;
    mode: ExecutionMode;
    gateReasons: string[];
    origin: 'llm' | 'fallback';
  } | null;
  provenance: Provenance | null;
  events: {
    id: number;
    type: string;
    actor: Actor;
    payload: unknown;
    at: string;
  }[];
  availableDecisions: DecisionType[];
  disabledReasons: Record<string, string>;
}
