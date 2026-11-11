import { describe, it, expect } from 'vitest';
import { canTransition, isActionable } from '@/domain/states';

describe('domain/states state machine', () => {
  it('allows valid transitions', () => {
    expect(canTransition('new', 'triaged')).toBe(true);
    expect(canTransition('triaged', 'action_ready')).toBe(true);
    expect(canTransition('action_ready', 'executed')).toBe(true);
    expect(canTransition('action_ready', 'awaiting_approval')).toBe(true);
    expect(canTransition('awaiting_approval', 'executed')).toBe(true);
    expect(canTransition('awaiting_approval', 'snoozed')).toBe(true);
    expect(canTransition('snoozed', 'action_ready')).toBe(true);
    expect(canTransition('executed', 'waiting_on_paypal')).toBe(true);
    expect(canTransition('executed', 'resolved')).toBe(true);
    expect(canTransition('waiting_on_paypal', 'resolved')).toBe(true);
    expect(canTransition('resolved', 'closed')).toBe(true);
  });

  it('rejects invalid transitions', () => {
    expect(canTransition('new', 'closed')).toBe(false);
    expect(canTransition('new', 'executed')).toBe(false);
    expect(canTransition('closed', 'new')).toBe(false);
    expect(canTransition('resolved', 'action_ready')).toBe(false);
  });

  it('determines if a status is actionable', () => {
    expect(isActionable('new')).toBe(true);
    expect(isActionable('triaged')).toBe(true);
    expect(isActionable('action_ready')).toBe(true);
    expect(isActionable('awaiting_approval')).toBe(true);
    expect(isActionable('exec_failed')).toBe(true);

    expect(isActionable('waiting_on_paypal')).toBe(false);
    expect(isActionable('resolved')).toBe(false);
    expect(isActionable('closed')).toBe(false);

    // Snoozed case
    expect(isActionable('snoozed', '2026-11-10', '2026-11-11')).toBe(true); // past/today date is actionable
    expect(isActionable('snoozed', '2026-11-15', '2026-11-11')).toBe(false); // future date is not actionable
  });
});
