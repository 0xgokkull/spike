import type { CaseStatus } from './types';

export const ACTIONABLE_STATUSES: readonly CaseStatus[] = [
  'new',
  'triaged',
  'action_ready',
  'awaiting_approval',
  'exec_failed',
] as const;

export const TRANSITIONS: Record<CaseStatus, readonly CaseStatus[]> = {
  new: ['triaged'],
  triaged: ['action_ready'],
  action_ready: ['executed', 'awaiting_approval', 'exec_failed'],
  awaiting_approval: ['executed', 'snoozed', 'exec_failed'],
  snoozed: ['action_ready'],
  exec_failed: ['action_ready', 'executed'],
  executed: ['waiting_on_paypal', 'resolved'],
  waiting_on_paypal: ['resolved', 'action_ready'],
  resolved: ['closed'],
  closed: [],
};

export function canTransition(from: CaseStatus, to: CaseStatus): boolean {
  const allowed = TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

export function isActionable(status: CaseStatus, snoozedUntil?: string | null, todayIso?: string): boolean {
  if (status === 'snoozed') {
    if (!snoozedUntil || !todayIso) return false;
    return snoozedUntil <= todayIso;
  }
  return (ACTIONABLE_STATUSES as readonly string[]).includes(status);
}
